import { describe, expect, it, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { ValidationChain } from 'express-validator';
import {
  signupValidation,
  loginValidation,
  validate,
} from '../../src/validators/auth.validator';

const createMockResponse = () => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
};

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

describe('auth validators', () => {
  it('should pass signup validation for valid payload', async () => {
    const payload = {
      email: 'juan@example.com',
      password: 'Password1!',
      nickname: 'juan_perez',
    };
    const { req, res } = await runValidationChain(signupValidation, payload);
    const next = jest.fn();

    validate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return errors when signup payload is invalid', async () => {
    const payload = {
      email: 'invalid',
      password: 'weak',
      nickname: 'A', // Too short
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

  it('should pass login validation with valid credentials', async () => {
    const payload = {
      email: 'user@example.com',
      password: 'Password1!',
    };
    const { req, res } = await runValidationChain(loginValidation, payload);
    const next = jest.fn();

    validate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should fail login validation with missing fields', async () => {
    const payload = { email: '' };
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


