/**
 * @file Test suite for Authentication Middleware
 * @description Tests JWT token verification middleware with various scenarios
 * @module tests/middlewares/auth
 */

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import verifyToken from '../../src/middlewares/auth.middleware';

/**
 * Mock jsonwebtoken library to control token verification
 */
jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    verify: jest.fn(),
  },
}));

/** Typed mock of JWT library */
const jwtMock = jwt as jest.Mocked<typeof jwt>;

/**
 * Creates a fresh set of Express request, response, and next function mocks
 * @returns {Object} Object containing req, res, and next mocks
 */
const createContext = () => {
  const req = {
    cookies: {},
  } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;

  return { req, res, next };
};

/**
 * Test suite for JWT token verification middleware
 * Validates authentication flows and error handling
 */
describe('verifyToken middleware', () => {
  /**
   * Reset mocks and set JWT secret before each test
   */
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'secret';
  });

  /**
   * Verifies proper 401 response when authentication token is missing
   * @test Missing token
   */
  it('should respond with 401 when token is missing', () => {
    const { req, res, next } = createContext();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Autenticación requerida' });
    expect(next).not.toHaveBeenCalled();
  });

  /**
   * Verifies successful authentication with valid token
   * @test Valid token - Should attach user data to request
   */
  it('should attach user and call next when token is valid', () => {
    const { req, res, next } = createContext();
    req.cookies.authToken = 'token';
    jwtMock.verify.mockReturnValueOnce({
      userId: 'user-1',
      email: 'user@example.com',
    } as any);

    verifyToken(req, res, next);

    expect(jwtMock.verify).toHaveBeenCalledWith('token', 'secret');
    expect(req.user).toEqual({ userId: 'user-1', email: 'user@example.com' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  /**
   * Verifies rejection of tokens with invalid/incomplete payload
   * @test Invalid payload - Missing required fields
   */
  it('should respond with 401 when payload lacks required fields', () => {
    const { req, res, next } = createContext();
    req.cookies.authToken = 'token';
    jwtMock.verify.mockReturnValueOnce({} as any);

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token payload' });
    expect(next).not.toHaveBeenCalled();
  });

  /**
   * Verifies proper handling of expired tokens
   * @test Expired token - TokenExpiredError
   */
  it('should respond with 401 when token is expired', () => {
    const { req, res, next } = createContext();
    req.cookies.authToken = 'token';
    const error = new Error('expired');
    (error as any).name = 'TokenExpiredError';
    jwtMock.verify.mockImplementationOnce(() => {
      throw error;
    });

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token has expired' });
  });

  /**
   * Verifies proper handling of malformed tokens
   * @test Invalid token - JsonWebTokenError
   */
  it('should respond with 401 when token is invalid', () => {
    const { req, res, next } = createContext();
    req.cookies.authToken = 'token';
    const error = new Error('invalid');
    (error as any).name = 'JsonWebTokenError';
    jwtMock.verify.mockImplementationOnce(() => {
      throw error;
    });

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
  });

  /**
   * Verifies proper handling of unexpected errors during verification
   * @test Unexpected error - Generic error handling
   */
  it('should respond with 500 for unexpected errors', () => {
    const { req, res, next } = createContext();
    req.cookies.authToken = 'token';
    jwtMock.verify.mockImplementationOnce(() => {
      throw new Error('unexpected');
    });

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Inténtalo de nuevo más tarde',
    });
  });
});


