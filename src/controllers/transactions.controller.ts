import { Request, Response } from "express";
import prisma from "../config/db";

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


const updateAccountRelatedToTransaction = async (
  res: Response,
  transaction: any,
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
 * Crear una transacción
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
 * Obtener todas las transacciones
 */
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { tag: true },
    });
    res.json(transactions);
  } catch (error) {
    console.error("Error obteniendo transacciones:", error);
    res.status(500).json({ error: "Error al obtener transacciones" });
  }
};

/**
 * Obtener una transacción por ID
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

    res.json(transaction);
  } catch (error) {
    console.error("Error obteniendo transacción:", error);
    res.status(500).json({ error: "Error al obtener transacción" });
  }
};

/**
 * Actualizar una transacción
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
  
      const dataToUpdate: any = {};
  
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
  
      res.json({
        message: "Transacción actualizada correctamente",
        transaction: updated,
      });
    } catch (error) {
      console.error("Error actualizando transacción:", error);
      res.status(500).json({ error: "Error al actualizar la transacción" });
    }
  };
  

/**
 * Eliminar una transacción
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

    res.json({ message: "Transacción eliminada" });
  } catch (error) {
    console.error("Error eliminando transacción:", error);
    res.status(500).json({ error: "Error al eliminar transacción" });
  }
};

/**
 * Obtener todas las transacciones de un día específico
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

    res.json(transactions);
  } catch (error) {
    console.error("Error obteniendo transacciones por fecha:", error);
    res.status(500).json({ error: "Error al obtener transacciones" });
  }
};

/**
 * Obtener transacciones de tipo ingreso o egreso de un día específico
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
  
      res.json(transactions);
    } catch (error) {
      console.error("Error obteniendo transacciones por tipo y fecha:", error);
      res.status(500).json({ error: "Error al obtener transacciones" });
    }
  };
  
