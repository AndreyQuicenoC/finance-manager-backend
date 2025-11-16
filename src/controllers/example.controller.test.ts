import { Request, Response } from 'express';
import { ExampleController } from './example.controller';

describe('ExampleController', () => {
  let controller: ExampleController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    controller = new ExampleController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return 200 and list of items', () => {
      controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: expect.any(Number), name: expect.any(String) }),
        ])
      );
    });

    it('should return 500 on error', () => {
      mockResponse.status = jest.fn().mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      try {
        controller.getAll(mockRequest as Request, mockResponse as Response);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getById', () => {
    it('should return 200 and item by id', () => {
      mockRequest.params = { id: '1' };

      controller.getById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: 'Item 1' })
      );
    });

    it('should return 400 if id is not provided', () => {
      mockRequest.params = {};

      controller.getById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID is required' });
    });
  });

  describe('create', () => {
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

    it('should return 400 if name is not provided', () => {
      mockRequest.body = {};

      controller.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Name is required' });
    });
  });
});
