/**
 * @file Test suite for Authentication Validators
 * @description Tests express-validator middleware for signup and login validation
 * @module tests/validators/auth
 */

import { describe, expect, it, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { ValidationChain } from 'express-validator';
import {
  signupValidation,
  loginValidation,
  validate,
} from '../../src/validators/auth.validator';

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
 * Executes a chain of validation middleware on a request body
 * @param {ValidationChain[]} chain - Array of express-validator middleware
 * @param {Record<string, unknown>} body - Request body to validate
 * @returns {Promise<Object>} Object containing mocked req and res
 */
const runValidationChain = async (
  chain: ValidationChain[],
  body: Record<string, unknown>
) => {
  const req = { body } as Request;
  const res = createMockResponse();

  for (const middleware of chain) {
    await middleware.run(req);
  }

  return { req, res };
};

/**
 * Test suite for authentication validators
 * Tests signup and login validation rules with express-validator
 */
describe('auth validators', () => {
  /**
   * Verifies successful validation with complete signup data
   * @test Signup validation - Valid payload
   */
  it('should pass signup validation for valid payload', async () => {
    const payload = {
      nombres: 'Juan',
      apellidos: 'Pérez',
      edad: 25,
      correoElectronico: 'juan@example.com',
      contraseña: 'Password1!',
      confirmarContraseña: 'Password1!',
    };
    const { req, res } = await runValidationChain(signupValidation, payload);
    const next = jest.fn();

    validate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  /**
   * Verifies proper error messages for invalid signup data
   * @test Signup validation - Invalid payload with multiple errors
   */
  it('should return errors when signup payload is invalid', async () => {
    const payload = {
      nombres: '',
      apellidos: 'P',
      edad: 14,
      correoElectronico: 'invalid',
      contraseña: 'weak',
      confirmarContraseña: 'different',
    };
    const { req, res } = await runValidationChain(signupValidation, payload);
    const next = jest.fn();

    validate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ msg: expect.any(String) }),
        ]),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  /**
   * Verifies successful validation with valid login credentials
   * @test Login validation - Valid credentials
   */
  it('should pass login validation with valid credentials', async () => {
    const payload = {
      correoElectronico: 'user@example.com',
      contraseña: 'Password1!',
    };
    const { req, res } = await runValidationChain(loginValidation, payload);
    const next = jest.fn();

    validate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  /**
   * Verifies error handling when login fields are missing
   * @test Login validation - Missing required fields
   */
  it('should fail login validation with missing fields', async () => {
    const payload = { correoElectronico: '' };
    const { req, res } = await runValidationChain(loginValidation, payload);
    const next = jest.fn();

    validate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ msg: expect.any(String) }),
        ]),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});


