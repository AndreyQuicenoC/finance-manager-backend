import { describe, expect, it, beforeEach, jest, afterAll } from '@jest/globals';
import { Request, Response } from 'express';
import prisma from '../../src/config/db';
import {
  createTagPocket,
  getAllTags,
  getTagsByAccount,
  updateTagPocket,
  deleteTagPocket,
} from '../../src/controllers/tagPocket.controller';

jest.mock('../../src/config/db', () => ({
  __esModule: true,
  default: {
    tagPocket: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
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

describe('TagPocketController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('createTagPocket', () => {
    it('should return 401 when user is not authenticated', async () => {
      const req = {
        body: { name: 'Tag', accountId: 1 },
      } as unknown as Request;
      const res = createMockResponse();

      await createTagPocket(req, res);

      expect(prismaMock.account.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.tagPocket.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No autenticado',
      });
    });

    it('should create a tagPocket when name and accountId are provided', async () => {
      const req = {
        user: mockUser,
        body: { name: 'Test Tag', description: 'Test Description', accountId: 1 },
      } as unknown as Request;
      const res = createMockResponse();
      const createdTag = {
        id: 1,
        name: 'Test Tag',
        description: 'Test Description',
        accountId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.account.findFirst.mockResolvedValueOnce({
        id: 1,
        userId: mockUser.userId,
      } as any);
      prismaMock.tagPocket.create.mockResolvedValueOnce(createdTag as any);

      await createTagPocket(req, res);

      expect(prismaMock.tagPocket.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Tag',
          description: 'Test Description',
          accountId: 1,
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'TagPocket creado',
        tag: createdTag,
      });
    });

    it('should create a tagPocket without description when description is not provided', async () => {
      const req = {
        user: mockUser,
        body: { name: 'Test Tag', accountId: 1 },
      } as unknown as Request;
      const res = createMockResponse();
      const createdTag = {
        id: 1,
        name: 'Test Tag',
        description: null,
        accountId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.account.findFirst.mockResolvedValueOnce({
        id: 1,
        userId: mockUser.userId,
      } as any);
      prismaMock.tagPocket.create.mockResolvedValueOnce(createdTag as any);

      await createTagPocket(req, res);

      expect(prismaMock.tagPocket.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Tag',
          description: undefined,
          accountId: 1,
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 when accountId is missing', async () => {
      const req = {
        user: mockUser,
        body: { name: 'Test Tag' },
      } as unknown as Request;
      const res = createMockResponse();

      await createTagPocket(req, res);

      expect(prismaMock.tagPocket.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Faltan accountId o name',
      });
    });

    it('should return 400 when name is missing', async () => {
      const req = {
        user: mockUser,
        body: { accountId: 1 },
      } as unknown as Request;
      const res = createMockResponse();

      await createTagPocket(req, res);

      expect(prismaMock.tagPocket.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Faltan accountId o name',
      });
    });

    it('should return 403 when account does not belong to user', async () => {
      const req = {
        user: mockUser,
        body: { name: 'Test Tag', accountId: 1 },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.account.findFirst.mockResolvedValueOnce(null as any);

      await createTagPocket(req, res);

      expect(prismaMock.tagPocket.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La cuenta no existe o no pertenece a tu usuario',
      });
    });

    it('should return 500 when creation fails', async () => {
      const req = {
        user: mockUser,
        body: { name: 'Test Tag', accountId: 1 },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.account.findFirst.mockResolvedValueOnce({
        id: 1,
        userId: mockUser.userId,
      } as any);
      prismaMock.tagPocket.create.mockRejectedValueOnce(new Error('Database error'));

      await createTagPocket(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al crear TagPocket',
      });
    });

    it('should return 403 when account exists but belongs to another user', async () => {
      const req = {
        user: mockUser,
        body: { name: 'Test Tag', accountId: 1 },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.account.findFirst.mockResolvedValueOnce(null as any);

      await createTagPocket(req, res);

      expect(prismaMock.tagPocket.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La cuenta no existe o no pertenece a tu usuario',
      });
    });
  });

  describe('getAllTags', () => {
    it('should return 401 when user is not authenticated', async () => {
      const req = {} as unknown as Request;
      const res = createMockResponse();

      await getAllTags(req, res);

      expect(prismaMock.tagPocket.findMany).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No autenticado',
      });
    });

    it('should return all tags for authenticated user', async () => {
      const req = {
        user: mockUser,
      } as unknown as Request;
      const res = createMockResponse();
      const tags = [
        { id: 1, name: 'Tag 1', account: { userId: mockUser.userId }, transactions: [] },
      ];
      prismaMock.tagPocket.findMany.mockResolvedValueOnce(tags as any);

      await getAllTags(req, res);

      expect(prismaMock.tagPocket.findMany).toHaveBeenCalledWith({
        where: {
          account: {
            userId: mockUser.userId,
          },
        },
        include: {
          transactions: true,
          account: true,
        },
      });
      expect(res.json).toHaveBeenCalledWith(tags);
    });

    it('should return 500 when fetching all tags fails', async () => {
      const req = {
        user: mockUser,
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.tagPocket.findMany.mockRejectedValueOnce(new Error('Database error'));

      await getAllTags(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener TagPockets',
      });
    });
  });

  describe('getTagsByAccount', () => {
    it('should return 401 when user is not authenticated', async () => {
      const req = {
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();

      await getTagsByAccount(req, res);

      expect(prismaMock.account.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.tagPocket.findMany).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No autenticado',
      });
    });
    it('should return all tags for an account', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      const tags = [
        {
          id: 1,
          name: 'Tag 1',
          accountId: 1,
          transactions: [],
        },
        {
          id: 2,
          name: 'Tag 2',
          accountId: 1,
          transactions: [],
        },
      ];
      prismaMock.account.findFirst.mockResolvedValueOnce({
        id: 1,
        userId: mockUser.userId,
      } as any);
      prismaMock.tagPocket.findMany.mockResolvedValueOnce(tags as any);

      await getTagsByAccount(req, res);

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          userId: mockUser.userId,
        },
      });
      expect(prismaMock.tagPocket.findMany).toHaveBeenCalledWith({
        where: {
          accountId: 1,
          account: {
            userId: mockUser.userId,
          },
        },
        include: { transactions: true, account: true },
      });
      expect(res.json).toHaveBeenCalledWith(tags);
    });

    it('should return empty array when no tags exist for account', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.account.findFirst.mockResolvedValueOnce({
        id: 1,
        userId: mockUser.userId,
      } as any);
      prismaMock.tagPocket.findMany.mockResolvedValueOnce([]);

      await getTagsByAccount(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 404 when account does not exist or does not belong to user', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.account.findFirst.mockResolvedValueOnce(null as any);

      await getTagsByAccount(req, res);

      expect(prismaMock.tagPocket.findMany).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Cuenta no encontrada o no pertenece a tu usuario',
      });
    });

    it('should return 500 when fetching fails', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.account.findFirst.mockResolvedValueOnce({
        id: 1,
        userId: mockUser.userId,
      } as any);
      prismaMock.tagPocket.findMany.mockRejectedValueOnce(new Error('Database error'));

      await getTagsByAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener TagPockets',
      });
    });
  });

  describe('updateTagPocket', () => {
    it('should return 401 when user is not authenticated', async () => {
      const req = {
        params: { id: '1' },
        body: { name: 'Updated Tag' },
      } as unknown as Request;
      const res = createMockResponse();

      await updateTagPocket(req, res);

      expect(prismaMock.tagPocket.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.tagPocket.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No autenticado',
      });
    });
    it('should update tagPocket when it exists', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
        body: { name: 'Updated Tag', description: 'Updated Description' },
      } as unknown as Request;
      const res = createMockResponse();
      const existingTag = {
        id: 1,
        name: 'Old Tag',
        description: 'Old Description',
        accountId: 1,
      };
      const updatedTag = {
        id: 1,
        name: 'Updated Tag',
        description: 'Updated Description',
        accountId: 1,
        updatedAt: new Date(),
      };
      prismaMock.tagPocket.findFirst.mockResolvedValueOnce(existingTag as any);
      prismaMock.tagPocket.update.mockResolvedValueOnce(updatedTag as any);

      await updateTagPocket(req, res);

      expect(prismaMock.tagPocket.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          account: {
            userId: mockUser.userId,
          },
        },
      });
      expect(prismaMock.tagPocket.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated Tag',
          description: 'Updated Description',
        },
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'TagPocket actualizado',
        tag: updatedTag,
      });
    });

    it('should use existing values when fields are not provided', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
        body: {},
      } as unknown as Request;
      const res = createMockResponse();
      const existingTag = {
        id: 1,
        name: 'Existing Tag',
        description: 'Existing Description',
        accountId: 1,
      };
      const updatedTag = {
        id: 1,
        name: 'Existing Tag',
        description: 'Existing Description',
        accountId: 1,
        updatedAt: new Date(),
      };
      prismaMock.tagPocket.findFirst.mockResolvedValueOnce(existingTag as any);
      prismaMock.tagPocket.update.mockResolvedValueOnce(updatedTag as any);

      await updateTagPocket(req, res);

      expect(prismaMock.tagPocket.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Existing Tag',
          description: 'Existing Description',
        },
      });
    });

    it('should return 404 when tagPocket is not found', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
        body: { name: 'Updated Tag' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.tagPocket.findFirst.mockResolvedValueOnce(null);

      await updateTagPocket(req, res);

      expect(prismaMock.tagPocket.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'TagPocket no encontrado o no pertenece a tu usuario',
      });
    });

    it('should return 500 when update fails', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
        body: { name: 'Updated Tag' },
      } as unknown as Request;
      const res = createMockResponse();
      const existingTag = {
        id: 1,
        name: 'Old Tag',
        accountId: 1,
      };
      prismaMock.tagPocket.findFirst.mockResolvedValueOnce(existingTag as any);
      prismaMock.tagPocket.update.mockRejectedValueOnce(new Error('Database error'));

      await updateTagPocket(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al actualizar TagPocket',
      });
    });
  });

  describe('deleteTagPocket', () => {
    it('should return 401 when user is not authenticated', async () => {
      const req = {
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();

      await deleteTagPocket(req, res);

      expect(prismaMock.tagPocket.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.tagPocket.delete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No autenticado',
      });
    });
    it('should delete tagPocket and return success message', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.tagPocket.findFirst.mockResolvedValueOnce({
        id: 1,
        account: { userId: mockUser.userId },
      } as any);
      prismaMock.tagPocket.delete.mockResolvedValueOnce({} as any);

      await deleteTagPocket(req, res);

      expect(prismaMock.tagPocket.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          account: {
            userId: mockUser.userId,
          },
        },
      });
      expect(prismaMock.tagPocket.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'TagPocket eliminado',
      });
    });

    it('should return 404 when tagPocket does not exist or does not belong to user', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.tagPocket.findFirst.mockResolvedValueOnce(null as any);

      await deleteTagPocket(req, res);

      expect(prismaMock.tagPocket.delete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'TagPocket no encontrado o no pertenece a tu usuario',
      });
    });

    it('should return 500 when deletion fails', async () => {
      const req = {
        user: mockUser,
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.tagPocket.findFirst.mockResolvedValueOnce({
        id: 1,
        account: { userId: mockUser.userId },
      } as any);
      prismaMock.tagPocket.delete.mockRejectedValueOnce(new Error('Database error'));

      await deleteTagPocket(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al eliminar TagPocket',
      });
    });
  });
});

