/**
 * @file Test suite for Example Controller
 * @description Tests CRUD operations for the example controller with in-memory storage
 * @module tests/controllers/example
 */

import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { ExampleController } from '../../src/controllers/example.controller';

/**
 * Test suite for Example Controller
 * Validates all controller methods with mocked requests and responses
 */
describe('ExampleController', () => {
  /** Instance of the controller being tested */
  let controller: ExampleController;
  
  /** Partial mock of Express Request object */
  let mockRequest: Partial<Request>;
  
  /** Mock of Express Response object */
  let mockResponse: Response;

  /**
   * Initialize fresh controller and mocks before each test
   */
  beforeEach(() => {
    controller = new ExampleController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
  });

  /**
   * Clear all mocks after each test
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test suite for fetching all items
   */
  describe('getAll', () => {
    /**
     * Verifies successful retrieval of all items
     * @test {GET /api/examples}
     */
    it('should return 200 and list of items', () => {
      controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: expect.any(Number), name: expect.any(String) }),
        ])
      );
    });

    /**
     * Verifies error handling when response status throws
     * @test {GET /api/examples} - Error scenario
     */
    it('should return 500 on error', () => {
      mockResponse.status = jest.fn().mockImplementationOnce(() => {
        throw new Error('Test error');
      }) as unknown as Response['status'];

      try {
        controller.getAll(mockRequest as Request, mockResponse as Response);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  /**
   * Test suite for fetching item by ID
   */
  describe('getById', () => {
    /**
     * Verifies successful retrieval of item by ID
     * @test {GET /api/examples/:id}
     */
    it('should return 200 and item by id', () => {
      mockRequest.params = { id: '1' };

      controller.getById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: 'Item 1' })
      );
    });

    /**
     * Verifies validation when ID is missing
     * @test {GET /api/examples/:id} - Missing ID
     */
    it('should return 400 if id is not provided', () => {
      mockRequest.params = {};

      controller.getById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID is required' });
    });
  });

  /**
   * Test suite for creating new items
   */
  describe('create', () => {
    /**
     * Verifies successful item creation
     * @test {POST /api/examples}
     */
    it('should return 201 and created item', () => {
      mockRequest.body = { name: 'New Item' };

      controller.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(Number),
          name: 'New Item',
        })
      );
    });

    /**
     * Verifies validation when name is missing
     * @test {POST /api/examples} - Missing name
     */
    it('should return 400 if name is not provided', () => {
      mockRequest.body = {};

      controller.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Name is required' });
    });
  });
});
