import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import prisma from '../../src/config/db';
import {
  getLoginLogs,
  deleteUserByAdmin,
  getAllUsersForAdmin,
  getPasswordResetStats,
  getOverviewStats,
  createAdminUser,
  deleteAdminUser,
} from '../../src/controllers/admin.controller';

jest.mock('../../src/config/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    userSession: {
      findMany: jest.fn(),
    },
    passwordReset: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    transaction: {
      count: jest.fn(),
    },
  },
}));

const prismaMock = prisma as any;

const createMockResponse = () => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
};

describe('AdminController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLoginLogs', () => {
    it('should return login logs', async () => {
      const req = { query: {} } as unknown as Request;
      const res = createMockResponse();

      const logs = [{ id: 1, userId: 1 }];
      prismaMock.userSession.findMany.mockResolvedValueOnce(logs);

      await getLoginLogs(req, res);

      expect(prismaMock.userSession.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ logs });
    });

    it('should filter logs by numeric userId query param', async () => {
      const req = { query: { userId: '42' } } as unknown as Request;
      const res = createMockResponse();

      const logs = [{ id: 1, userId: 42 }];
      prismaMock.userSession.findMany.mockResolvedValueOnce(logs);

      await getLoginLogs(req, res);

      expect(prismaMock.userSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 42 },
        })
      );
      expect(res.json).toHaveBeenCalledWith({ logs });
    });

    it('should ignore invalid userId and still return logs', async () => {
      const req = { query: { userId: 'not-a-number' } } as unknown as Request;
      const res = createMockResponse();

      const logs = [{ id: 1, userId: 1 }];
      prismaMock.userSession.findMany.mockResolvedValueOnce(logs);

      await getLoginLogs(req, res);

      expect(prismaMock.userSession.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ logs });
    });

    it('should return 500 when an unexpected error occurs', async () => {
      const req = { query: {} } as unknown as Request;
      const res = createMockResponse();

      prismaMock.userSession.findMany.mockRejectedValueOnce(
        new Error('DB error')
      );

      await getLoginLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener historial de logeos',
      });
    });
  });

  describe('deleteUserByAdmin', () => {
    it('should return 400 for invalid id', async () => {
      const req = { params: { id: 'abc' } } as unknown as Request;
      const res = createMockResponse();

      await deleteUserByAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when user not found', async () => {
      const req = { params: { id: '1' } } as unknown as Request;
      const res = createMockResponse();
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await deleteUserByAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should soft delete user when exists', async () => {
      const req = { params: { id: '1' } } as unknown as Request;
      const res = createMockResponse();
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1 });
      prismaMock.user.update.mockResolvedValueOnce({});

      await deleteUserByAdmin(req, res);

      expect(prismaMock.user.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario eliminado correctamente',
      });
    });

    it('should return 500 when deletion throws an error', async () => {
      const req = { params: { id: '1' } } as unknown as Request;
      const res = createMockResponse();

      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1 });
      prismaMock.user.update.mockRejectedValueOnce(new Error('DB error'));

      await deleteUserByAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al eliminar usuario por administrador',
      });
    });
  });

  describe('getAllUsersForAdmin', () => {
    it('should return users', async () => {
      const req = {} as Request;
      const res = createMockResponse();
      const users = [{ id: 1, email: 'user@test.com' }];
      prismaMock.user.findMany.mockResolvedValueOnce(users);

      await getAllUsersForAdmin(req, res);

      expect(res.json).toHaveBeenCalledWith({ users });
    });

    it('should return 500 when getAllUsersForAdmin fails', async () => {
      const req = {} as Request;
      const res = createMockResponse();

      prismaMock.user.findMany.mockRejectedValueOnce(new Error('DB error'));

      await getAllUsersForAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener usuarios para administración',
      });
    });
  });

  describe('getPasswordResetStats', () => {
    it('should return stats', async () => {
      const req = {} as Request;
      const res = createMockResponse();
      prismaMock.passwordReset.count.mockResolvedValueOnce(5);
      prismaMock.passwordReset.groupBy.mockResolvedValueOnce([
        { userId: 1, _count: { _all: 3 } },
        { userId: 2, _count: { _all: 2 } },
      ]);

      await getPasswordResetStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        totalResets: 5,
        byUser: [
          { userId: 1, resetCount: 3 },
          { userId: 2, resetCount: 2 },
        ],
      });
    });

    it('should return 500 when getPasswordResetStats fails', async () => {
      const req = {} as Request;
      const res = createMockResponse();

      prismaMock.passwordReset.count.mockRejectedValueOnce(
        new Error('DB error')
      );

      await getPasswordResetStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener estadísticas de reseteos',
      });
    });
  });

  describe('getOverviewStats', () => {
    it('should return 400 when dates are missing', async () => {
      const req = { query: {} } as unknown as Request;
      const res = createMockResponse();

      await getOverviewStats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return overview stats', async () => {
      const req = {
        query: { from: '2025-01-01', to: '2025-01-31' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.transaction.count.mockResolvedValueOnce(10);
      prismaMock.user.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(5); // adminCount

      await getOverviewStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionsCount: 10,
          totalUsers: 100,
          adminCount: 5,
        })
      );
    });

    it('should return 400 when date params are invalid', async () => {
      const req = {
        query: { from: 'invalid-date', to: 'also-invalid' },
      } as unknown as Request;
      const res = createMockResponse();

      await getOverviewStats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Parámetros de fecha inválidos',
      });
    });

    it('should return 500 when getOverviewStats fails', async () => {
      const req = {
        query: { from: '2025-01-01', to: '2025-01-31' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.transaction.count.mockRejectedValueOnce(
        new Error('DB error')
      );

      await getOverviewStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener estadísticas generales',
      });
    });
  });

  describe('createAdminUser', () => {
    it('should return 400 when email or password missing', async () => {
      const req = { body: {} } as unknown as Request;
      const res = createMockResponse();

      await createAdminUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should create admin user when data is valid', async () => {
      const req = {
        body: { email: 'admin@test.com', password: 'Secret123!', nickname: 'Admin' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.role.findUnique.mockResolvedValueOnce({ id: 2, name: 'admin' });
      const createdUser = {
        id: 1,
        email: 'admin@test.com',
        nickname: 'Admin',
        createdAt: new Date(),
      };
      prismaMock.user.create.mockResolvedValueOnce(createdUser);

      await createAdminUser(req, res);

      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Administrador creado exitosamente',
        user: createdUser,
      });
    });

    it('should return 400 when email is already registered', async () => {
      const req = {
        body: { email: 'admin@test.com', password: 'Secret123!' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1 });

      await createAdminUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'El correo electrónico ya está registrado',
      });
    });

    it('should create admin role when it does not exist', async () => {
      const req = {
        body: {
          email: 'newadmin@test.com',
          password: 'Secret123!',
          nickname: 'New Admin',
        },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.role.findUnique.mockResolvedValueOnce(null);
      prismaMock.role.create.mockResolvedValueOnce({ id: 3, name: 'admin' });
      const createdUser = {
        id: 2,
        email: 'newadmin@test.com',
        nickname: 'New Admin',
        createdAt: new Date(),
      };
      prismaMock.user.create.mockResolvedValueOnce(createdUser);

      await createAdminUser(req, res);

      expect(prismaMock.role.create).toHaveBeenCalledWith({
        data: { name: 'admin' },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Administrador creado exitosamente',
        user: createdUser,
      });
    });

    it('should return 500 when createAdminUser fails unexpectedly', async () => {
      const req = {
        body: { email: 'admin@test.com', password: 'Secret123!' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.user.findUnique.mockRejectedValueOnce(
        new Error('DB error')
      );

      await createAdminUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al crear usuario administrador',
      });
    });
  });

  describe('deleteAdminUser', () => {
    it('should return 400 for invalid id', async () => {
      const req = { params: { id: 'abc' } } as unknown as Request;
      const res = createMockResponse();

      await deleteAdminUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when admin not found', async () => {
      const req = { params: { id: '1' } } as unknown as Request;
      const res = createMockResponse();
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await deleteAdminUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 when user is not admin', async () => {
      const req = { params: { id: '1' } } as unknown as Request;
      const res = createMockResponse();
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        role: { name: 'user' },
      });

      await deleteAdminUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should soft delete admin when valid', async () => {
      const req = { params: { id: '1' } } as unknown as Request;
      const res = createMockResponse();
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        role: { name: 'admin' },
      });
      prismaMock.user.update.mockResolvedValueOnce({});

      await deleteAdminUser(req, res);

      expect(prismaMock.user.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Administrador eliminado correctamente',
      });
    });

    it('should return 500 when deleteAdminUser fails unexpectedly', async () => {
      const req = { params: { id: '1' } } as unknown as Request;
      const res = createMockResponse();

      prismaMock.user.findUnique.mockRejectedValueOnce(
        new Error('DB error')
      );

      await deleteAdminUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al eliminar usuario administrador',
      });
    });
  });
});


