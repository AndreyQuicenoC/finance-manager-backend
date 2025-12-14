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
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tagPocket: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    account: {
      update: jest.fn(),
    },
  },
}));

const prismaMock = prisma as jest.Mocked<typeof prisma>;
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
const mockUser = { userId: 1 };

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
    it('should return 401 when user is not authenticated', async () => {
      const req = {} as unknown as Request;
      const res = createMockResponse();

      await getAllTransactions(req, res);

      expect(prismaMock.transaction.findMany).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    });
    it('should return all transactions', async () => {
      const req = { user: mockUser } as unknown as Request;
      const res = createMockResponse();
      const transactions = [
        { id: 1, amount: 100, isIncome: true, tag: { id: 1 } },
        { id: 2, amount: 50, isIncome: false, tag: { id: 2 } },
      ];
      prismaMock.transaction.findMany.mockResolvedValueOnce(transactions as any);

      await getAllTransactions(req, res);

      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith({
        where: {
          tag: {
            account: {
              userId: mockUser.userId,
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
      expect(res.json).toHaveBeenCalledWith(transactions);
    });

    it('should return 500 when fetching fails', async () => {
      const req = { user: mockUser } as unknown as Request;
      const res = createMockResponse();
      prismaMock.transaction.findMany.mockRejectedValueOnce(new Error('Database error'));

      await getAllTransactions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener transacciones' });
    });
  });

  describe('getTransactionById', () => {
    it('should return 401 when user is not authenticated', async () => {
      const req = {
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();

      await getTransactionById(req, res);

      expect(prismaMock.transaction.findFirst).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    });
    it('should return transaction when found', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      const transaction = {
        id: 1,
        amount: 100,
        isIncome: true,
        tag: { id: 1 },
      };
      prismaMock.transaction.findFirst.mockResolvedValueOnce(transaction as any);

      await getTransactionById(req, res);

      expect(prismaMock.transaction.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          tag: {
            account: {
              userId: mockUser.userId,
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
      expect(res.json).toHaveBeenCalledWith(transaction);
    });

    it('should return 404 when transaction is not found', async () => {
      const req = {
        user: mockUser,
        params: { id: '999' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.transaction.findFirst.mockResolvedValueOnce(null);

      await getTransactionById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Transacción no encontrada' });
    });

    it('should return 500 when fetching fails', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.transaction.findFirst.mockRejectedValueOnce(new Error('Database error'));

      await getTransactionById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener transacción' });
    });
  });

  describe('createTransaction', () => {
    it('should return 401 when user is not authenticated', async () => {
      const req = {
        body: {
          amount: 100,
          isIncome: true,
          transactionDate: '2024-01-01',
          tagId: 1,
        },
      } as unknown as Request;
      const res = createMockResponse();

      await createTransaction(req, res);

      expect(prismaMock.tagPocket.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.transaction.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    });

    it('should return 400 when required fields are missing', async () => {
      const req = {
        user: mockUser,
        body: {
          isIncome: true,
          transactionDate: '2024-01-01',
          // amount y tagId faltan
        },
      } as unknown as Request;
      const res = createMockResponse();

      await createTransaction(req, res);

      expect(prismaMock.tagPocket.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.transaction.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Faltan campos requeridos: amount, isIncome, transactionDate, tagId',
      });
    });

    it('should return 403 when tag does not belong to user', async () => {
      const req = {
        user: mockUser,
        body: {
          amount: 100,
          isIncome: true,
          transactionDate: '2024-01-01',
          tagId: 1,
        },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.tagPocket.findFirst.mockResolvedValueOnce(null as any);

      await createTransaction(req, res);

      expect(prismaMock.transaction.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El tag no existe o no pertenece a tu cuenta',
      });
    });

    it('should return 500 when account update fails unexpectedly', async () => {
      const req = {
        user: mockUser,
        body: {
          amount: 100,
          isIncome: true,
          transactionDate: '2024-01-01',
          tagId: 1,
        },
      } as unknown as Request;
      const res = createMockResponse();
      const createdTransaction = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
      };
      prismaMock.tagPocket.findFirst.mockResolvedValueOnce({
        id: 1,
        account: { userId: mockUser.userId },
      } as any);
      prismaMock.transaction.create.mockResolvedValueOnce(createdTransaction as any);
      // Provocar error dentro de updateAccountRelatedToTransaction
      prismaMock.tagPocket.findUnique.mockRejectedValueOnce(new Error('Database error'));

      await createTransaction(req, res);

      expect(prismaMock.transaction.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Database error',
      });
    });
    it('should create transaction and update account', async () => {
      const req = {
        user: mockUser,
        body: {
          amount: 100,
          isIncome: true,
          transactionDate: '2024-01-01',
          description: 'Test',
          tagId: 1,
        },
      } as unknown as Request;
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
      prismaMock.tagPocket.findFirst.mockResolvedValueOnce({
        id: 1,
        account: { userId: mockUser.userId },
      } as any);
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

    it('should return 404 when tag or account is not found', async () => {
      const req = {
        user: mockUser,
        body: {
          amount: 100,
          isIncome: true,
          transactionDate: '2024-01-01',
          tagId: 1,
        },
      } as unknown as Request;
      const res = createMockResponse();
      const createdTransaction = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
      };
      prismaMock.tagPocket.findFirst.mockResolvedValueOnce({
        id: 1,
        account: { userId: mockUser.userId },
      } as any);
      prismaMock.transaction.create.mockResolvedValueOnce(createdTransaction as any);
      prismaMock.tagPocket.findUnique.mockResolvedValueOnce(null);

      await createTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Cuenta o tag no encontrada',
      });
    });

    it('should return 409 when account would have negative balance', async () => {
      const req = {
        user: mockUser,
        body: {
          amount: 1000,
          isIncome: false, // gasto
          transactionDate: '2024-01-01',
          tagId: 1,
        },
      } as unknown as Request;
      const res = createMockResponse();
      const createdTransaction = {
        id: 1,
        amount: 1000,
        isIncome: false,
        tagId: 1,
      };
      const tag = {
        id: 1,
        account: { id: 1, money: 500 }, // saldo insuficiente
      };
      prismaMock.tagPocket.findFirst.mockResolvedValueOnce({
        id: 1,
        account: { userId: mockUser.userId },
      } as any);
      prismaMock.transaction.create.mockResolvedValueOnce(createdTransaction as any);
      prismaMock.tagPocket.findUnique.mockResolvedValueOnce(tag as any);

      await createTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Dinero insuficiente en la cuenta',
      });
    });

    it('should return 500 when creation fails', async () => {
      const req = {
        user: mockUser,
        body: {
          amount: 100,
          isIncome: true,
          transactionDate: '2024-01-01',
          tagId: 1,
        },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.tagPocket.findFirst.mockResolvedValueOnce({
        id: 1,
        account: { userId: mockUser.userId },
      } as any);
      prismaMock.transaction.create.mockRejectedValueOnce(new Error('Database error'));

      await createTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Error al crear transacción' })
      );
    });
  });

  describe('updateTransaction', () => {
    it('should return 401 when user is not authenticated', async () => {
      const req = {
        params: { id: '1' },
        body: { amount: 200 },
      } as unknown as Request;
      const res = createMockResponse();

      await updateTransaction(req, res);

      expect(prismaMock.transaction.findFirst).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    });
    it('should return 400 when id is invalid', async () => {
      const req = {
        user: mockUser,
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
        user: mockUser,
        params: { id: '999' },
        body: { amount: 200 },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.transaction.findFirst.mockResolvedValueOnce(null);

      await updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Transacción no encontrada' });
    });

    it('should return 400 when no fields to update', async () => {
      const req = {
        user: mockUser,
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
      prismaMock.transaction.findFirst.mockResolvedValueOnce(existing as any);

      await updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No se enviaron campos para actualizar' });
    });

    it('should update transaction and account when old transaction is found', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
        body: { amount: 200, isIncome: true, tagId: 1 },
      } as unknown as Request;
      const res = createMockResponse();
      const existing = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
      };
      const updated = {
        id: 1,
        amount: 200,
        isIncome: true,
        tagId: 1,
      };
      const oldTransaction = {
        id: 1,
        amount: 100,
        isIncome: false, // era gasto
        tagId: 1,
      };
      const tag = {
        id: 1,
        account: { id: 1, money: 1000 },
      };
      prismaMock.transaction.findFirst.mockResolvedValueOnce(existing as any);
      prismaMock.transaction.update.mockResolvedValueOnce(updated as any);
      prismaMock.tagPocket.findUnique.mockResolvedValueOnce(tag as any);
      prismaMock.transaction.findUnique.mockResolvedValueOnce(oldTransaction as any);
      prismaMock.account.update.mockResolvedValueOnce({} as any);

      await updateTransaction(req, res);

      expect(prismaMock.transaction.update).toHaveBeenCalled();
      expect(prismaMock.tagPocket.findUnique).toHaveBeenCalled();
      expect(prismaMock.transaction.findFirst).toHaveBeenCalledTimes(1);
      expect(prismaMock.transaction.findUnique).toHaveBeenCalledTimes(1); // solo para oldTransaction
      expect(res.json).toHaveBeenCalledWith({
        message: 'Transacción actualizada correctamente',
        transaction: updated,
      });
    });

    it('should return 404 when old transaction is not found during update', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
        body: { amount: 200, tagId: 1 },
      } as unknown as Request;
      const res = createMockResponse();
      const existing = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
      };
      const updated = {
        id: 1,
        amount: 200,
        isIncome: true,
        tagId: 1,
      };
      const tag = {
        id: 1,
        account: { id: 1, money: 1000 },
      };
      prismaMock.transaction.findFirst.mockResolvedValueOnce(existing as any);
      prismaMock.transaction.update.mockResolvedValueOnce(updated as any);
      prismaMock.tagPocket.findUnique.mockResolvedValueOnce(tag as any);
      prismaMock.transaction.findUnique.mockResolvedValueOnce(null); // oldTransaction no encontrada

      await updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Transacción anterior no encontrada',
      });
    });

    it('should return 404 when tag or account is not found during update', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
        body: { amount: 200, tagId: 1 },
      } as unknown as Request;
      const res = createMockResponse();
      const existing = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
      };
      const updated = {
        id: 1,
        amount: 200,
        isIncome: true,
        tagId: 1,
      };
      prismaMock.transaction.findFirst.mockResolvedValueOnce(existing as any);
      prismaMock.transaction.update.mockResolvedValueOnce(updated as any);
      prismaMock.tagPocket.findUnique.mockResolvedValueOnce(null);

      await updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Cuenta o tag no encontrada',
      });
    });

    it('should return 409 when update would leave negative balance', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
        body: { amount: 2000, isIncome: false, tagId: 1 }, // gasto grande
      } as unknown as Request;
      const res = createMockResponse();
      const existing = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
      };
      const updated = {
        id: 1,
        amount: 2000,
        isIncome: false,
        tagId: 1,
      };
      const oldTransaction = {
        id: 1,
        amount: 100,
        isIncome: true, // era ingreso
        tagId: 1,
      };
      const tag = {
        id: 1,
        account: { id: 1, money: 500 }, // saldo insuficiente
      };
      prismaMock.transaction.findFirst.mockResolvedValueOnce(existing as any);
      prismaMock.transaction.update.mockResolvedValueOnce(updated as any);
      prismaMock.tagPocket.findUnique.mockResolvedValueOnce(tag as any);
      prismaMock.transaction.findUnique.mockResolvedValueOnce(oldTransaction as any);

      await updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Dinero insuficiente en la cuenta',
      });
    });

    it('should handle transactionDate update', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
        body: { transactionDate: '2024-02-01' },
      } as unknown as Request;
      const res = createMockResponse();
      const existing = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
      };
      const updated = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
        transactionDate: new Date('2024-02-01'),
      };
      prismaMock.transaction.findFirst.mockResolvedValueOnce(existing as any);
      prismaMock.transaction.update.mockResolvedValueOnce(updated as any);
      prismaMock.tagPocket.findUnique.mockResolvedValueOnce({
        id: 1,
        account: { id: 1, money: 1000 },
      } as any);
      prismaMock.transaction.findUnique.mockResolvedValueOnce(existing as any);
      prismaMock.account.update.mockResolvedValueOnce({} as any);

      await updateTransaction(req, res);

      expect(prismaMock.transaction.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          transactionDate: new Date('2024-02-01'),
        },
      });
    });

    it('should return 500 when update fails', async () => {
      const req = {
        user: mockUser,
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
      prismaMock.transaction.findFirst.mockResolvedValueOnce(existing as any);
      prismaMock.transaction.update.mockRejectedValueOnce(new Error('Database error'));

      await updateTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al actualizar la transacción' });
    });
  });

  describe('deleteTransaction', () => {
    it('should return 401 when user is not authenticated', async () => {
      const req = {
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();

      await deleteTransaction(req, res);

      expect(prismaMock.transaction.findFirst).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    });
    it('should return 404 when transaction is not found', async () => {
      const req = {
        user: mockUser,
        params: { id: '999' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.transaction.findFirst.mockResolvedValueOnce(null);

      await deleteTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Transacción no encontrada' });
    });

    it('should return 404 when transaction tag or account is not found', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      const transaction = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
      };
      prismaMock.transaction.findFirst.mockResolvedValueOnce(transaction as any);
      // Simular que no se encuentra el tag o account en revertAccountFromDeletedTransaction
      prismaMock.transaction.findUnique.mockResolvedValueOnce({
        id: 1,
        tag: null,
      } as any);

      await deleteTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Transacción, tag o cuenta no encontrada',
      });
    });

    it('should return 409 when deletion would leave negative balance', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      const transaction = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
      };
      prismaMock.transaction.findFirst.mockResolvedValueOnce(transaction as any);
      // Simular transacción con tag y account, pero el saldo quedaría negativo en revertAccountFromDeletedTransaction
      prismaMock.transaction.findUnique.mockResolvedValueOnce({
        id: 1,
        amount: 1000,
        isIncome: true, // es ingreso, al revertir se resta
        tag: {
          id: 1,
          account: {
            id: 1,
            money: 500, // saldo actual menor que el monto a revertir
          },
        },
      } as any);

      await deleteTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La eliminación deja el saldo en negativo',
      });
    });

    it('should successfully delete transaction and update account', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      const transaction = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
      };
      prismaMock.transaction.findFirst.mockResolvedValueOnce(transaction as any);
      // Simular transacción con tag y account, saldo suficiente en revertAccountFromDeletedTransaction
      prismaMock.transaction.findUnique.mockResolvedValueOnce({
        id: 1,
        amount: 100,
        isIncome: false, // es gasto, al revertir se suma
        tag: {
          id: 1,
          account: {
            id: 1,
            money: 1000, // saldo suficiente
          },
        },
      } as any);
      prismaMock.account.update.mockResolvedValueOnce({} as any);
      prismaMock.transaction.delete.mockResolvedValueOnce({} as any);

      await deleteTransaction(req, res);

      expect(prismaMock.account.update).toHaveBeenCalled();
      // delete se llama desde revertAccountFromDeletedTransaction y de nuevo en deleteTransaction
      expect(prismaMock.transaction.delete).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Transacción eliminada',
      });
    });

    it('should return 500 when deletion fails', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      const transaction = {
        id: 1,
        amount: 100,
        isIncome: true,
        tagId: 1,
      };
      prismaMock.transaction.findFirst.mockResolvedValueOnce(transaction as any);
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
        user: mockUser,
        query: {},
      } as unknown as Request;
      const res = createMockResponse();

      await getTransactionsByDate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Falta el parámetro 'date'" });
    });

    it('should return 401 when user is not authenticated', async () => {
      const req = {
        query: { date: '2024-01-01' },
      } as unknown as Request;
      const res = createMockResponse();

      await getTransactionsByDate(req, res);

      expect(prismaMock.transaction.findMany).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    });

    it('should return transactions for a specific date', async () => {
      const req = {
        user: mockUser,
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
        user: mockUser,
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
        user: mockUser,
        query: {},
      } as unknown as Request;
      const res = createMockResponse();

      await getTransactionsByTypeAndDate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Faltan parámetros 'date' o 'type'" });
    });

    it('should return 400 when type is invalid', async () => {
      const req = {
        user: mockUser,
        query: { date: '2024-01-01', type: 'invalid' },
      } as unknown as Request;
      const res = createMockResponse();

      await getTransactionsByTypeAndDate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "El parámetro 'type' debe ser 'income' o 'expense'",
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      const req = {
        query: { date: '2024-01-01', type: 'income' },
      } as unknown as Request;
      const res = createMockResponse();

      await getTransactionsByTypeAndDate(req, res);

      expect(prismaMock.transaction.findMany).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    });

    it('should return transactions for income type', async () => {
      const req = {
        user: mockUser,
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
        user: mockUser,
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
        user: mockUser,
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

