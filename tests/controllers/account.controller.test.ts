/**
 * @file Test suite for Account Controller
 * @description Tests all CRUD operations for account management using Prisma
 * @module tests/controllers/account
 */

import { describe, expect, it, beforeEach, jest, afterAll } from '@jest/globals';
import { Request, Response } from 'express';
import prisma from '../../src/config/db';
import {
  createAccount,
  getAccountsByUser,
  updateAccount,
  deleteAccount,
} from '../../src/controllers/account.controller';

/**
 * Mock implementation of Prisma client for testing
 * Prevents actual database operations during tests
 */
jest.mock('../../src/config/db', () => ({
  __esModule: true,
  default: {
    account: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

/** Typed mock of Prisma client for test assertions */
const prismaMock = prisma as jest.Mocked<typeof prisma>;

/** Spy for console.error to suppress error logs during tests */
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

/**
 * Creates a mock Express Response object for testing
 * @returns {Response} Mocked response with chainable methods
 */
const createMockResponse = () => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
};

/**
 * Test suite for Account Controller operations
 * Tests all CRUD operations with both success and error scenarios
 */
describe('AccountController', () => {
  /**
   * Reset all mocks before each test to ensure test isolation
   */
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  /**
   * Restore console.error after all tests complete
   */
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  /**
   * Test suite for account creation functionality
   */
  describe('createAccount', () => {
    /**
     * Verifies successful account creation with valid payload
     * @test {POST /api/accounts}
     */
    it('should create an account when payload is valid', async () => {
      const req = {
        body: { name: 'Cuenta', money: 100, userId: 1, categoryId: 2 },
      } as Request;
      const res = createMockResponse();
      const createdAccount = { id: 10, ...req.body };
      prismaMock.account.create.mockResolvedValueOnce(createdAccount as any);

      await createAccount(req, res);

      expect(prismaMock.account.create).toHaveBeenCalledWith({
        data: {
          name: 'Cuenta',
          money: 100,
          userId: 1,
          categoryId: 2,
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cuenta creada exitosamente',
        account: createdAccount,
      });
    });

    /**
     * Verifies proper error handling when required fields are missing
     * @test {POST /api/accounts} - Missing userId or categoryId
     */
    it('should return 400 when userId or categoryId are missing', async () => {
      const req = {
        body: { name: 'Cuenta sin usuario' },
      } as Request;
      const res = createMockResponse();

      await createAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Faltan userId o categoryId',
      });
      expect(prismaMock.account.create).not.toHaveBeenCalled();
    });

    /**
     * Verifies proper error handling for unexpected database errors
     * @test {POST /api/accounts} - Database error
     */
    it('should handle unexpected errors', async () => {
      const req = {
        body: { name: 'Cuenta', userId: 1, categoryId: 2 },
      } as Request;
      const res = createMockResponse();
      prismaMock.account.create.mockRejectedValueOnce(new Error('boom'));

      await createAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al crear cuenta' });
    });
  });

  /**
   * Test suite for fetching accounts by user ID
   */
  describe('getAccountsByUser', () => {
    /**
     * Verifies successful retrieval of user accounts with related data
     * @test {GET /api/accounts/user/:userId}
     */
    it('should return accounts for the provided userId', async () => {
      const req = { params: { userId: '5' } } as unknown as Request;
      const res = createMockResponse();
      const accounts = [{ id: 1, name: 'Cuenta 1' }];
      prismaMock.account.findMany.mockResolvedValueOnce(accounts as any);

      await getAccountsByUser(req, res);

      expect(prismaMock.account.findMany).toHaveBeenCalledWith({
        where: { userId: 5 },
        include: { category: true, tags: true },
      });
      expect(res.json).toHaveBeenCalledWith(accounts);
    });

    /**
     * Verifies error handling when database query fails
     * @test {GET /api/accounts/user/:userId} - Database error
     */
    it('should return 500 when fetching accounts fails', async () => {
      const req = { params: { userId: '5' } } as unknown as Request;
      const res = createMockResponse();
      prismaMock.account.findMany.mockRejectedValueOnce(new Error('fail'));

      await getAccountsByUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener cuentas',
      });
    });
  });

  /**
   * Test suite for account update functionality
   */
  describe('updateAccount', () => {
    /**
     * Verifies proper 404 response when account doesn't exist
     * @test {PUT /api/accounts/:id} - Not found
     */
    it('should return 404 when account is not found', async () => {
      const req = {
        params: { id: '10' },
        body: { name: 'Nueva' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.account.findUnique.mockResolvedValueOnce(null);

      await updateAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Cuenta no encontrada',
      });
      expect(prismaMock.account.update).not.toHaveBeenCalled();
    });

    /**
     * Verifies successful account update with partial data
     * @test {PUT /api/accounts/:id} - Success
     */
    it('should update the account when it exists', async () => {
      const req = {
        params: { id: '10' },
        body: { name: 'Actualizada', money: 500 },
      } as unknown as Request;
      const res = createMockResponse();
      const existing = {
        id: 10,
        name: 'Vieja',
        money: 100,
        categoryId: 3,
      };
      const updated = { ...existing, name: 'Actualizada', money: 500 };
      prismaMock.account.findUnique.mockResolvedValueOnce(existing as any);
      prismaMock.account.update.mockResolvedValueOnce(updated as any);

      await updateAccount(req, res);

      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          name: 'Actualizada',
          money: 500,
          categoryId: 3,
        },
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cuenta actualizada',
        account: updated,
      });
    });

    /**
     * Verifies error handling when update operation fails
     * @test {PUT /api/accounts/:id} - Database error
     */
    it('should return 500 when update operation fails', async () => {
      const req = {
        params: { id: '10' },
        body: { name: 'Actualizada' },
      } as unknown as Request;
      const res = createMockResponse();
      const existing = { id: 10, name: 'Vieja', money: 100, categoryId: 3 };
      prismaMock.account.findUnique.mockResolvedValueOnce(existing as any);
      prismaMock.account.update.mockRejectedValueOnce(new Error('fail'));

      await updateAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al actualizar cuenta',
      });
    });
  });

  /**
   * Test suite for account deletion functionality
   */
  describe('deleteAccount', () => {
    /**
     * Verifies successful account deletion
     * @test {DELETE /api/accounts/:id}
     */
    it('should delete an account and respond with success message', async () => {
      const req = { params: { id: '20' } } as unknown as Request;
      const res = createMockResponse();
      prismaMock.account.delete.mockResolvedValueOnce(undefined as any);

      await deleteAccount(req, res);

      expect(prismaMock.account.delete).toHaveBeenCalledWith({
        where: { id: 20 },
      });
      expect(res.json).toHaveBeenCalledWith({ message: 'Cuenta eliminada' });
    });

    /**
     * Verifies error handling when deletion fails
     * @test {DELETE /api/accounts/:id} - Database error
     */
    it('should return 500 when deletion fails', async () => {
      const req = { params: { id: '20' } } as unknown as Request;
      const res = createMockResponse();
      prismaMock.account.delete.mockRejectedValueOnce(new Error('boom'));

      await deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al eliminar cuenta',
      });
    });
  });
});


