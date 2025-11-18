import { describe, expect, it, beforeEach, jest, afterAll } from '@jest/globals';
import { Request, Response } from 'express';
import prisma from '../../src/config/db';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../../src/controllers/category.controller';

jest.mock('../../src/config/db', () => ({
  __esModule: true,
  default: {
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

describe('CategoryController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('createCategory', () => {
    it('should create a category when tipo is provided', async () => {
      const req = {
        body: { tipo: 'Ingresos' },
      } as Request;
      const res = createMockResponse();
      const createdCategory = { id: 1, tipo: 'Ingresos', createdAt: new Date(), updatedAt: new Date() };
      prismaMock.category.create.mockResolvedValueOnce(createdCategory as any);

      await createCategory(req, res);

      expect(prismaMock.category.create).toHaveBeenCalledWith({
        data: {
          tipo: 'Ingresos',
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Categoría creada exitosamente',
        category: createdCategory,
      });
    });

    it('should return 400 when tipo is missing', async () => {
      const req = {
        body: {},
      } as Request;
      const res = createMockResponse();

      await createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Falta el campo 'tipo'" });
      expect(prismaMock.category.create).not.toHaveBeenCalled();
    });

    it('should return 400 when tipo is not a string', async () => {
      const req = {
        body: { tipo: 123 },
      } as Request;
      const res = createMockResponse();

      await createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Falta el campo 'tipo'" });
      expect(prismaMock.category.create).not.toHaveBeenCalled();
    });

    it('should return 500 when creation fails', async () => {
      const req = {
        body: { tipo: 'Ingresos' },
      } as Request;
      const res = createMockResponse();
      prismaMock.category.create.mockRejectedValueOnce(new Error('Database error'));

      await createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al crear categoría' });
    });
  });

  describe('getCategories', () => {
    it('should return all categories with accounts', async () => {
      const req = {} as Request;
      const res = createMockResponse();
      const categories = [
        { id: 1, tipo: 'Ingresos', accounts: [], createdAt: new Date(), updatedAt: new Date() },
        { id: 2, tipo: 'Gastos', accounts: [], createdAt: new Date(), updatedAt: new Date() },
      ];
      prismaMock.category.findMany.mockResolvedValueOnce(categories as any);

      await getCategories(req, res);

      expect(prismaMock.category.findMany).toHaveBeenCalledWith({
        include: { accounts: true },
      });
      expect(res.json).toHaveBeenCalledWith(categories);
    });

    it('should return 500 when fetching fails', async () => {
      const req = {} as Request;
      const res = createMockResponse();
      prismaMock.category.findMany.mockRejectedValueOnce(new Error('Database error'));

      await getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener categorías' });
    });
  });

  describe('getCategoryById', () => {
    it('should return category when found', async () => {
      const req = {
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      const category = {
        id: 1,
        tipo: 'Ingresos',
        accounts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.category.findUnique.mockResolvedValueOnce(category as any);

      await getCategoryById(req, res);

      expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { accounts: true },
      });
      expect(res.json).toHaveBeenCalledWith(category);
    });

    it('should return 404 when category is not found', async () => {
      const req = {
        params: { id: '999' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.category.findUnique.mockResolvedValueOnce(null);

      await getCategoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Categoría no encontrada' });
    });

    it('should return 500 when fetching fails', async () => {
      const req = {
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.category.findUnique.mockRejectedValueOnce(new Error('Database error'));

      await getCategoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener categoría' });
    });
  });

  describe('updateCategory', () => {
    it('should update category when it exists', async () => {
      const req = {
        params: { id: '1' },
        body: { tipo: 'Nuevo Tipo' },
      } as unknown as Request;
      const res = createMockResponse();
      const existing = {
        id: 1,
        tipo: 'Tipo Antiguo',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updated = { ...existing, tipo: 'Nuevo Tipo' };
      prismaMock.category.findUnique.mockResolvedValueOnce(existing as any);
      prismaMock.category.update.mockResolvedValueOnce(updated as any);

      await updateCategory(req, res);

      expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prismaMock.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          tipo: 'Nuevo Tipo',
        },
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Categoría actualizada',
        category: updated,
      });
    });

    it('should use existing tipo when tipo is not provided', async () => {
      const req = {
        params: { id: '1' },
        body: {},
      } as unknown as Request;
      const res = createMockResponse();
      const existing = {
        id: 1,
        tipo: 'Tipo Original',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updated = { ...existing };
      prismaMock.category.findUnique.mockResolvedValueOnce(existing as any);
      prismaMock.category.update.mockResolvedValueOnce(updated as any);

      await updateCategory(req, res);

      expect(prismaMock.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          tipo: 'Tipo Original',
        },
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Categoría actualizada',
        category: updated,
      });
    });

    it('should return 404 when category is not found', async () => {
      const req = {
        params: { id: '999' },
        body: { tipo: 'Nuevo Tipo' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.category.findUnique.mockResolvedValueOnce(null);

      await updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Categoría no encontrada' });
      expect(prismaMock.category.update).not.toHaveBeenCalled();
    });

    it('should return 500 when update fails', async () => {
      const req = {
        params: { id: '1' },
        body: { tipo: 'Nuevo Tipo' },
      } as unknown as Request;
      const res = createMockResponse();
      const existing = {
        id: 1,
        tipo: 'Tipo Antiguo',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.category.findUnique.mockResolvedValueOnce(existing as any);
      prismaMock.category.update.mockRejectedValueOnce(new Error('Database error'));

      await updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al actualizar categoría' });
    });
  });

  describe('deleteCategory', () => {
    it('should delete category and return success message', async () => {
      const req = {
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.category.delete.mockResolvedValueOnce(undefined as any);

      await deleteCategory(req, res);

      expect(prismaMock.category.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(res.json).toHaveBeenCalledWith({ message: 'Categoría eliminada correctamente' });
    });

    it('should return 500 when deletion fails', async () => {
      const req = {
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.category.delete.mockRejectedValueOnce(new Error('Database error'));

      await deleteCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al eliminar categoría' });
    });
  });
});

