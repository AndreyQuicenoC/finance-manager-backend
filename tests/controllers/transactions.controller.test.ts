import { describe, expect, it, beforeEach, jest, afterAll } from '@jest/globals';
import { Request, Response } from 'express';
import prisma from '../../src/config/db';
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionsByDate,
  getTransactionsByTypeAndDate,
} from '../../src/controllers/transactions.controller';

jest.mock('../../src/config/db', () => ({
  __esModule: true,
  default: {
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tagPocket: {
      findUnique: jest.fn(),
    },
    account: {
      update: jest.fn(),
    },
  },
}));

const prismaMock = prisma as jest.Mocked<typeof prisma>;
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

const createMockResponse = () => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
};

describe('TransactionsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('getAllTransactions', () => {
    it('should return all transactions', async () => {
      const req = {} as Request;
      const res = createMockResponse();
      const transactions = [
        { id: 1, amount: 100, isIncome: true, tag: { id: 1 } },
        { id: 2, amount: 50, isIncome: false, tag: { id: 2 } },
      ];
      prismaMock.transaction.findMany.mockResolvedValueOnce(transactions as any);

      await getAllTransactions(req, res);

      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith({
        include: { tag: true },
      });
      expect(res.json).toHaveBeenCalledWith(transactions);
    });

    it('should return 500 when fetching fails', async () => {
      const req = {} as Request;
      const res = createMockResponse();
      prismaMock.transaction.findMany.mockRejectedValueOnce(new Error('Database error'));

      await getAllTransactions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener transacciones' });
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction when found', async () => {
      const req = {
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      const transaction = {
        id: 1,
        amount: 100,
        isIncome: true,
        tag: { id: 1 },
      };
      prismaMock.transaction.findUnique.mockResolvedValueOnce(transaction as any);

      await getTransactionById(req, res);

      expect(prismaMock.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { tag: true },
      });
      expect(res.json).toHaveBeenCalledWith(transaction);
    });

    it('should return 404 when transaction is not found', async () => {
      const req = {
        params: { id: '999' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.transaction.findUnique.mockResolvedValueOnce(null);

      await getTransactionById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Transacción no encontrada' });
    });

    it('should return 500 when fetching fails', async () => {
      const req = {
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.transaction.findUnique.mockRejectedValueOnce(new Error('Database error'));

      await getTransactionById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener transacción' });
    });
  });

  describe('createTransaction', () => {
    it('should create transaction and update account', async () => {
      const req = {
        body: {
          amount: 100,
          isIncome: true,
          transactionDate: '2024-01-01',
          description: 'Test',
          tagId: 1,
        },
      } as Request;
      const res = createMockResponse();
      const createdTransaction = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
      };
      const tag = {
        id: 1,
        account: { id: 1, money: 1000 },
      };
      prismaMock.transaction.create.mockResolvedValueOnce(createdTransaction as any);
      prismaMock.tagPocket.findUnique.mockResolvedValueOnce(tag as any);
      prismaMock.account.update.mockResolvedValueOnce({} as any);

      await createTransaction(req, res);

      expect(prismaMock.transaction.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Transacción creada',
        transaction: createdTransaction,
      });
    });

    it('should return 500 when creation fails', async () => {
      const req = {
        body: {
          amount: 100,
          isIncome: true,
          transactionDate: '2024-01-01',
          tagId: 1,
        },
      } as Request;
      const res = createMockResponse();
      prismaMock.transaction.create.mockRejectedValueOnce(new Error('Database error'));

      await createTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al crear transacción' });
    });
  });

  describe('updateTransaction', () => {
    it('should return 400 when id is invalid', async () => {
      const req = {
        params: { id: 'invalid' },
        body: { amount: 200 },
      } as unknown as Request;
      const res = createMockResponse();

      await updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'ID inválido' });
    });

    it('should return 404 when transaction is not found', async () => {
      const req = {
        params: { id: '999' },
        body: { amount: 200 },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.transaction.findUnique.mockResolvedValueOnce(null);

      await updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Transacción no encontrada' });
    });

    it('should return 400 when no fields to update', async () => {
      const req = {
        params: { id: '1' },
        body: {},
      } as unknown as Request;
      const res = createMockResponse();
      const existing = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
      };
      prismaMock.transaction.findUnique.mockResolvedValueOnce(existing as any);

      await updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No se enviaron campos para actualizar' });
    });

    it('should return 500 when update fails', async () => {
      const req = {
        params: { id: '1' },
        body: { amount: 200 },
      } as unknown as Request;
      const res = createMockResponse();
      const existing = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
      };
      prismaMock.transaction.findUnique.mockResolvedValueOnce(existing as any);
      prismaMock.transaction.update.mockRejectedValueOnce(new Error('Database error'));

      await updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al actualizar la transacción' });
    });
  });

  describe('deleteTransaction', () => {
    it('should return 404 when transaction is not found', async () => {
      const req = {
        params: { id: '999' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.transaction.findUnique.mockResolvedValueOnce(null);

      await deleteTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Transacción no encontrada' });
    });

    it('should return 500 when deletion fails', async () => {
      const req = {
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      const transaction = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
      };
      prismaMock.transaction.findUnique.mockResolvedValueOnce(transaction as any);
      prismaMock.transaction.findUnique.mockResolvedValueOnce({
        id: 1,
        tag: { account: { id: 1, money: 1000 } },
      } as any);
      prismaMock.transaction.delete.mockRejectedValueOnce(new Error('Database error'));

      await deleteTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al eliminar transacción' });
    });
  });

  describe('getTransactionsByDate', () => {
    it('should return 400 when date is missing', async () => {
      const req = {
        query: {},
      } as unknown as Request;
      const res = createMockResponse();

      await getTransactionsByDate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Falta el parámetro 'date'" });
    });

    it('should return transactions for a specific date', async () => {
      const req = {
        query: { date: '2024-01-01' },
      } as unknown as Request;
      const res = createMockResponse();
      const transactions = [
        { id: 1, amount: 100, transactionDate: new Date('2024-01-01'), tag: { id: 1 } },
      ];
      prismaMock.transaction.findMany.mockResolvedValueOnce(transactions as any);

      await getTransactionsByDate(req, res);

      expect(prismaMock.transaction.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(transactions);
    });

    it('should return 500 when fetching fails', async () => {
      const req = {
        query: { date: '2024-01-01' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.transaction.findMany.mockRejectedValueOnce(new Error('Database error'));

      await getTransactionsByDate(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener transacciones' });
    });
  });

  describe('getTransactionsByTypeAndDate', () => {
    it('should return 400 when date or type is missing', async () => {
      const req = {
        query: {},
      } as unknown as Request;
      const res = createMockResponse();

      await getTransactionsByTypeAndDate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Faltan parámetros 'date' o 'type'" });
    });

    it('should return 400 when type is invalid', async () => {
      const req = {
        query: { date: '2024-01-01', type: 'invalid' },
      } as unknown as Request;
      const res = createMockResponse();

      await getTransactionsByTypeAndDate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "El parámetro 'type' debe ser 'income' o 'expense'",
      });
    });

    it('should return transactions for income type', async () => {
      const req = {
        query: { date: '2024-01-01', type: 'income' },
      } as unknown as Request;
      const res = createMockResponse();
      const transactions = [
        { id: 1, amount: 100, isIncome: true, transactionDate: new Date('2024-01-01'), tag: { id: 1 } },
      ];
      prismaMock.transaction.findMany.mockResolvedValueOnce(transactions as any);

      await getTransactionsByTypeAndDate(req, res);

      expect(prismaMock.transaction.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(transactions);
    });

    it('should return transactions for expense type', async () => {
      const req = {
        query: { date: '2024-01-01', type: 'expense' },
      } as unknown as Request;
      const res = createMockResponse();
      const transactions = [
        { id: 1, amount: 50, isIncome: false, transactionDate: new Date('2024-01-01'), tag: { id: 1 } },
      ];
      prismaMock.transaction.findMany.mockResolvedValueOnce(transactions as any);

      await getTransactionsByTypeAndDate(req, res);

      expect(prismaMock.transaction.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(transactions);
    });

    it('should return 500 when fetching fails', async () => {
      const req = {
        query: { date: '2024-01-01', type: 'income' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.transaction.findMany.mockRejectedValueOnce(new Error('Database error'));

      await getTransactionsByTypeAndDate(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener transacciones' });
    });
  });
});

