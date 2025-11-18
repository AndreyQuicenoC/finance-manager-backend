import { Request, Response } from "express";
import prisma from "../config/db";

interface TransactionData {
  id?: number;
  amount: number;
  isIncome: boolean;
  tagId: number;
}

interface TransactionUpdateData {
  amount?: number;
  isIncome?: boolean;
  transactionDate?: Date;
  description?: string;
  tagId?: number;
}

/**
 * Reverts the financial effect of a deleted transaction and updates the related account balance.
 * This function subtracts or adds the transaction amount depending on whether it was income or expense.
 * It ensures that the resulting account balance does not go negative.
 *
 * @async
 * @param {Response} res - Express response object used for sending error messages if needed.
 * @param {number} transactionId - ID of the transaction to revert and delete.
 * @returns {Promise<Response>} JSON response indicating success or error.
 */
const revertAccountFromDeletedTransaction = async (res: Response, transactionId: number) => {
  // Buscar la transacción con su tag y cuenta asociada
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      tag: {
        include: { account: true },
      },
    },
  });

  if (!transaction || !transaction.tag || !transaction.tag.account) {
    return res.status(404).json({ error: "Transacción, tag o cuenta no encontrada" });
  }

  const account = transaction.tag.account;
  let newBalance = account.money;

  // Revertir el efecto de la transacción
  newBalance += transaction.isIncome
    ? -transaction.amount // si era ingreso, ahora se resta
    : transaction.amount; // si era gasto, ahora se suma

  // Validar que el saldo no quede negativo después del ajuste
  if (newBalance < 0) {
    return res.status(409).json({ error: "La eliminación deja el saldo en negativo" });
  }

  // Actualizar cuenta
  await prisma.account.update({
    where: { id: account.id },
    data: { money: newBalance },
  });

  // Eliminar la transacción
  await prisma.transaction.delete({
    where: { id: transactionId },
  });

  return res.status(200).json({ message: "Transacción eliminada y cuenta actualizada correctamente" });
};

/**
 * Updates an account's balance based on a transaction.
 * If updating an existing transaction, the old transaction's effect is reversed first,
 * and then the new values are applied.
 *
 * @async
 * @param {Response} res - Express response object for returning error messages.
 * @param {Object} transaction - The transaction data to apply.
 * @param {number} transaction.id - Transaction ID (required if `isUpdate` is true).
 * @param {number} transaction.amount - Transaction amount.
 * @param {boolean} transaction.isIncome - Whether the transaction is income (true) or expense (false).
 * @param {number} transaction.tagId - Related tag ID.
 * @param {boolean} [isUpdate=false] - Whether the operation is an update instead of a creation.
 * @returns {Promise<Response>} JSON response confirming the update or returning validation errors.
 */
const updateAccountRelatedToTransaction = async (
  res: Response,
  transaction: TransactionData,
  isUpdate = false
) => {
  const tag = await prisma.tagPocket.findUnique({
    where: { id: transaction.tagId },
    include: { account: true },
  });

  if (!tag || !tag.account) {
    return res.status(404).json({ error: "Cuenta o tag no encontrada" });
  }

  const account = tag.account;
  let newBalance = account.money;

  if (isUpdate) {
    // Si es una actualización, busca la transacción anterior
    const oldTransaction = await prisma.transaction.findUnique({
      where: { id: transaction.id },
    });

    if (!oldTransaction) {
      return res.status(404).json({ error: "Transacción anterior no encontrada" });
    }

    // Reviertes el efecto de la transacción anterior
    newBalance += oldTransaction.isIncome
      ? -oldTransaction.amount
      : oldTransaction.amount;
  }

  // Aplicas el efecto de la nueva transacción
  newBalance += transaction.isIncome ? transaction.amount : -transaction.amount;

  // Validación para no dejar la cuenta en negativo
  if (newBalance < 0) {
    return res.status(409).json({ error: "Dinero insuficiente en la cuenta" });
  }

  await prisma.account.update({
    where: { id: account.id },
    data: { money: newBalance },
  });

  return res.status(200).json({ message: "Cuenta actualizada correctamente" });
};


/**
 * Creates a new transaction and updates the related account balance accordingly.
 *
 * @async
 * @route POST /transactions
 * @param {Request} req - Express request object containing transaction data in the body.
 * @param {number} req.body.amount - Transaction amount.
 * @param {boolean} req.body.isIncome - Whether the transaction is income.
 * @param {string|Date} req.body.transactionDate - Date of the transaction.
 * @param {string} [req.body.description] - Optional description.
 * @param {number} req.body.tagId - ID of the associated tag.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>}
 */
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { amount, isIncome, transactionDate, description, tagId } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        isIncome,
        transactionDate: new Date(transactionDate),
        description,
        tagId,
      },
    });

    await updateAccountRelatedToTransaction(res,transaction);

    res.status(201).json({ message: "Transacción creada", transaction });
  } catch (error) {
    console.error("Error creando transacción:", error);
    res.status(500).json({ error: "Error al crear transacción" });
  }
};

/**
 * Retrieves all transactions from the database.
 *
 * @async
 * @route GET /transactions
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object that returns an array of transactions.
 * @returns {Promise<void>}
 */
export const getAllTransactions = async (_req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { tag: true },
    });
    return res.json(transactions);
  } catch (error) {
    console.error("Error obteniendo transacciones:", error);
    return res.status(500).json({ error: "Error al obtener transacciones" });
  }
};

/**
 * Retrieves a single transaction by its ID.
 *
 * @async
 * @route GET /transactions/:id
 * @param {Request} req - Express request containing the transaction ID in params.
 * @param {Response} res - Express response object returning a transaction or an error.
 * @returns {Promise<void>}
 */
export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) },
      include: { tag: true },
    });

    if (!transaction)
      return res.status(404).json({ error: "Transacción no encontrada" });

    return res.json(transaction);
  } catch (error) {
    console.error("Error obteniendo transacción:", error);
    return res.status(500).json({ error: "Error al obtener transacción" });
  }
};

/**
 * Updates an existing transaction and adjusts the related account balance.
 * Only fields sent in the request body will be updated.
 *
 * @async
 * @route PUT /transactions/:id
 * @param {Request} req - Express request object containing transaction updates.
 * @param {Response} res - Express response object returning the updated transaction.
 * @returns {Promise<void>}
 */
export const updateTransaction = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { amount, isIncome, transactionDate, description, tagId } = req.body;
  
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "ID inválido" });
      }
  
      const existing = await prisma.transaction.findUnique({
        where: { id: Number(id) },
      });
  
      if (!existing) {
        return res.status(404).json({ error: "Transacción no encontrada" });
      }
  
      const dataToUpdate: TransactionUpdateData = {};
  
      if (amount !== undefined) dataToUpdate.amount = amount;
      if (isIncome !== undefined) dataToUpdate.isIncome = isIncome;
      if (transactionDate !== undefined)
        dataToUpdate.transactionDate = new Date(transactionDate);
      if (description !== undefined) dataToUpdate.description = description;
      if (tagId !== undefined) dataToUpdate.tagId = tagId;
  
      if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ error: "No se enviaron campos para actualizar" });
      }
  
      const updated = await prisma.transaction.update({
        where: { id: Number(id) },
        data: dataToUpdate,
      });

      await updateAccountRelatedToTransaction(res,updated,true);
  
      return res.json({
        message: "Transacción actualizada correctamente",
        transaction: updated,
      });
    } catch (error) {
      console.error("Error actualizando transacción:", error);
      return res.status(500).json({ error: "Error al actualizar la transacción" });
    }
  };
  

/**
 * Deletes a transaction after reverting its financial effect on the account.
 *
 * @async
 * @route DELETE /transactions/:id
 * @param {Request} req - Express request containing the transaction ID.
 * @param {Response} res - Express response object confirming deletion or sending errors.
 * @returns {Promise<void>}
 */
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) },
    });
    
    if (!transaction)
      return res.status(404).json({ error: "Transacción no encontrada" });
    

    await revertAccountFromDeletedTransaction(res,transaction.id);

    await prisma.transaction.delete({
      where: { id: Number(id) },
    });

    return res.json({ message: "Transacción eliminada" });
  } catch (error) {
    console.error("Error eliminando transacción:", error);
    return res.status(500).json({ error: "Error al eliminar transacción" });
  }
};

/**
 * Retrieves all transactions that occurred on a specific date.
 *
 * @async
 * @route GET /transactions/by-date
 * @param {Request} req - Express request containing the `date` query parameter.
 * @param {Response} res - Express response object with transactions from that date.
 * @returns {Promise<void>}
 */
export const getTransactionsByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    if (!date) return res.status(400).json({ error: "Falta el parámetro 'date'" });

    const start = new Date(date as string);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        transactionDate: {
          gte: start,
          lte: end,
        },
      },
      include: { tag: true },
    });

    return res.json(transactions);
  } catch (error) {
    console.error("Error obteniendo transacciones por fecha:", error);
    return res.status(500).json({ error: "Error al obtener transacciones" });
  }
};

/**
 * Retrieves transactions filtered by type (income or expense) and a specific date.
 *
 * @async
 * @route GET /transactions/by-type-and-date
 * @param {Request} req - Express request containing `date` and `type` in query.
 * @param {string} req.query.date - Date to filter transactions.
 * @param {"income"|"expense"} req.query.type - Type of transaction filter.
 * @param {Response} res - Express response object returning filtered transactions.
 * @returns {Promise<void>}
 */
export const getTransactionsByTypeAndDate = async (req: Request, res: Response) => {
    try {
      const { date, type } = req.query;
  
      if (!date || !type)
        return res.status(400).json({ error: "Faltan parámetros 'date' o 'type'" });
  
      let isIncome: boolean;
      if (type === "income") isIncome = true;
      else if (type === "expense") isIncome = false;
      else
        return res
          .status(400)
          .json({ error: "El parámetro 'type' debe ser 'income' o 'expense'" });
  
      const start = new Date(date as string);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
  
      const transactions = await prisma.transaction.findMany({
        where: {
          isIncome, 
          transactionDate: {
            gte: start,
            lte: end,
          },
        },
        include: {
          tag: true, 
        },
      });
  
      return res.json(transactions);
    } catch (error) {
      console.error("Error obteniendo transacciones por tipo y fecha:", error);
      return res.status(500).json({ error: "Error al obtener transacciones" });
    }
  };
  
