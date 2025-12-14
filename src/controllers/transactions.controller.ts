import { Request, Response } from "express";
import prisma from "../config/db";

/**
 * Helper: Extract and validate userId from request
 */
const getUserIdFromRequest = (req: Request): number | null => {
  const userIdValue = req.user?.userId;
  const userId = typeof userIdValue === "number" 
    ? userIdValue 
    : userIdValue 
    ? Number(userIdValue) 
    : undefined;
  
  if (!userId || Number.isNaN(userId)) {
    return null;
  }
  
  return userId;
};

/**
 * Helper: Calculate new balance after applying transaction
 */
const calculateNewBalance = (
  currentBalance: number,
  amount: number,
  isIncome: boolean,
  operation: 'apply' | 'revert'
): number => {
  if (operation === 'apply') {
    return currentBalance + (isIncome ? amount : -amount);
  }
  // revert operation
  return currentBalance + (isIncome ? -amount : amount);
};

/**
 * Helper: Validate balance is not negative
 */
const validateBalance = (balance: number): boolean => {
  return balance >= 0;
};

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
  const newBalance = calculateNewBalance(
    account.money,
    transaction.amount,
    transaction.isIncome,
    'revert'
  );

  // Validar que el saldo no quede negativo después del ajuste
  if (!validateBalance(newBalance)) {
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
  transaction: TransactionData,
  isUpdate = false
): Promise<{ success: boolean; error?: any }> => {
  try {
    const tag = await prisma.tagPocket.findUnique({
      where: { id: transaction.tagId },
      include: { account: true },
    });

    if (!tag || !tag.account) {
      return { success: false, error: { status: 404, message: "Cuenta o tag no encontrada" } };
    }

    const account = tag.account;
    let newBalance = account.money;

    if (isUpdate && transaction.id) {
      // Si es una actualización, busca la transacción anterior
      const oldTransaction = await prisma.transaction.findUnique({
        where: { id: transaction.id },
      });

      if (!oldTransaction) {
        return { success: false, error: { status: 404, message: "Transacción anterior no encontrada" } };
      }

      // Reviertes el efecto de la transacción anterior
      newBalance = calculateNewBalance(
        newBalance,
        oldTransaction.amount,
        oldTransaction.isIncome,
        'revert'
      );
    }

    // Aplicas el efecto de la nueva transacción
    newBalance = calculateNewBalance(
      newBalance,
      transaction.amount,
      transaction.isIncome,
      'apply'
    );

    // Validación para no dejar la cuenta en negativo
    if (!validateBalance(newBalance)) {
      return { success: false, error: { status: 409, message: "Dinero insuficiente en la cuenta" } };
    }

    await prisma.account.update({
      where: { id: account.id },
      data: { money: newBalance },
    });

    return { success: true };
  } catch (error) {
    console.error("Error en updateAccountRelatedToTransaction:", error);
    return { 
      success: false, 
      error: { 
        status: 500, 
        message: error instanceof Error ? error.message : "Error al actualizar cuenta" 
      } 
    };
  }
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
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { amount, isIncome, transactionDate, description, tagId } = req.body;

    // Validar campos requeridos
    if (!amount || isIncome === undefined || !transactionDate || !tagId) {
      return res.status(400).json({ 
        error: "Faltan campos requeridos: amount, isIncome, transactionDate, tagId" 
      });
    }

    // Verificar que el tag pertenece al usuario autenticado
    const tag = await prisma.tagPocket.findFirst({
      where: {
        id: Number(tagId),
        account: {
          userId: userId,
        },
      },
    });

    if (!tag) {
      return res.status(403).json({ error: "El tag no existe o no pertenece a tu cuenta" });
    }

    // Crear la transacción
    const transaction = await prisma.transaction.create({
      data: {
        amount: Number(amount),
        isIncome: Boolean(isIncome),
        transactionDate: new Date(transactionDate),
        description: description || null,
        tagId: Number(tagId),
      },
    });

    // Actualizar la cuenta relacionada
    const accountUpdateResult = await updateAccountRelatedToTransaction({
      id: transaction.id,
      amount: transaction.amount,
      isIncome: transaction.isIncome,
      tagId: transaction.tagId,
    });

    // Si updateAccountRelatedToTransaction devuelve un error
    if (!accountUpdateResult.success) {
      // Eliminar la transacción creada
      await prisma.transaction.delete({ where: { id: transaction.id } });
      return res.status(accountUpdateResult.error?.status || 500).json({ 
        error: accountUpdateResult.error?.message || "Error al actualizar cuenta" 
      });
    }

    return res.status(201).json({ message: "Transacción creada", transaction });
  } catch (error) {
    console.error("Error creando transacción:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    return res.status(500).json({ 
      error: "Error al crear transacción",
      message: error instanceof Error ? error.message : "Error desconocido"
    });
  }
};

/**
 * Retrieves all transactions from the database for the authenticated user.
 *
 * @async
 * @route GET /transactions
 * @param {Request} req - Express request object (with user from verifyToken middleware).
 * @param {Response} res - Express response object that returns an array of transactions.
 * @returns {Promise<void>}
 */
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    // Filtrar transacciones por usuario a través de tag -> account -> user
    const transactions = await prisma.transaction.findMany({
      where: {
        tag: {
          account: {
            userId: userId,
          },
        },
      },
      include: { 
        tag: {
          include: {
            account: true,
          },
        },
      },
    });
    return res.json(transactions);
  } catch (error) {
    console.error("Error obteniendo transacciones:", error);
    return res.status(500).json({ error: "Error al obtener transacciones" });
  }
};

/**
 * Retrieves a single transaction by its ID (only if it belongs to the authenticated user).
 *
 * @async
 * @route GET /transactions/:id
 * @param {Request} req - Express request containing the transaction ID in params.
 * @param {Response} res - Express response object returning a transaction or an error.
 * @returns {Promise<void>}
 */
export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { id } = req.params;
    const transaction = await prisma.transaction.findFirst({
      where: { 
        id: Number(id),
        tag: {
          account: {
            userId: userId,
          },
        },
      },
      include: { 
        tag: {
          include: {
            account: true,
          },
        },
      },
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
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "No autenticado" });
      }

      const { id } = req.params;
      const { amount, isIncome, transactionDate, description, tagId } = req.body;
  
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "ID inválido" });
      }
  
      // Verificar que la transacción pertenece al usuario autenticado
      const existing = await prisma.transaction.findFirst({
        where: { 
          id: Number(id),
          tag: {
            account: {
              userId: userId,
            },
          },
        },
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

      // Actualizar la cuenta relacionada
      const accountUpdateResult = await updateAccountRelatedToTransaction({
        id: updated.id,
        amount: updated.amount,
        isIncome: updated.isIncome,
        tagId: updated.tagId,
      }, true);

      // Si updateAccountRelatedToTransaction devuelve un error
      if (!accountUpdateResult.success) {
        // Revertir la actualización de la transacción
        await prisma.transaction.update({
          where: { id: Number(id) },
          data: {
            amount: existing.amount,
            isIncome: existing.isIncome,
            transactionDate: existing.transactionDate,
            description: existing.description,
            tagId: existing.tagId,
          },
        });
        return res.status(accountUpdateResult.error?.status || 500).json({ 
          error: accountUpdateResult.error?.message || "Error al actualizar cuenta" 
        });
      }
  
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
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { id } = req.params;

    // Verificar que la transacción pertenece al usuario autenticado
    const transaction = await prisma.transaction.findFirst({
      where: { 
        id: Number(id),
        tag: {
          account: {
            userId: userId,
          },
        },
      },
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
    // Obtener userId del token
    const userIdValue = req.user?.userId;
    const userId = typeof userIdValue === "number" 
      ? userIdValue 
      : userIdValue 
      ? Number(userIdValue) 
      : undefined;

    if (!userId || Number.isNaN(userId)) {
      return res.status(401).json({ error: "No autenticado" });
    }

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
        tag: {
          account: {
            userId: userId,
          },
        },
      },
      include: { 
        tag: {
          include: {
            account: true,
          },
        },
      },
    });

    return res.json(transactions);
  } catch (error) {
    console.error("Error obteniendo transacciones por fecha:", error);
    return res.status(500).json({ error: "Error al obtener transacciones" });
  }
};

/**
 * Retrieves transactions filtered by type (income or expense) and a specific date (only for authenticated user).
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
      // Obtener userId del token
      const userIdValue = req.user?.userId;
      const userId = typeof userIdValue === "number" 
        ? userIdValue 
        : userIdValue 
        ? Number(userIdValue) 
        : undefined;

      if (!userId || Number.isNaN(userId)) {
        return res.status(401).json({ error: "No autenticado" });
      }

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
          tag: {
            account: {
              userId: userId,
            },
          },
        },
        include: {
          tag: {
            include: {
              account: true,
            },
          },
        },
      });
  
      return res.json(transactions);
    } catch (error) {
      console.error("Error obteniendo transacciones por tipo y fecha:", error);
      return res.status(500).json({ error: "Error al obtener transacciones" });
    }
  };
  
