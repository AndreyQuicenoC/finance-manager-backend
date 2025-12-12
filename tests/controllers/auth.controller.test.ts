import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import {
  signup,
  login,
  logout,
  getProfile,
  recoverPass,
  resetPass,
  adminLogin,
} from '../../src/controllers/auth.controller';
import prisma from '../../src/config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sendEmail from '../../src/utils/sendEmail';

jest.mock('../../src/config/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userSession: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    passwordReset: {
      create: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      updateMany: jest.fn(),
    },
    transaction: {
      count: jest.fn(),
    },
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock('../../src/utils/sendEmail', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const prismaMock = prisma as any;
const bcryptMock = bcrypt as any;
const jwtMock = jwt as any;
const sendEmailMock = sendEmail as jest.MockedFunction<typeof sendEmail>;

type MockResponse = Response & {
  status: jest.Mock;
  json: jest.Mock;
  cookie: jest.Mock;
  clearCookie: jest.Mock;
};

const createMockResponse = (): MockResponse => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return res as unknown as MockResponse;
};

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'secret';
    process.env.JWT_ADMIN_SECRET = 'admin-secret';
    process.env.FRONTEND_URL_DEV = 'http://localhost:3000';
    process.env.FRONTEND_URL_PROD = 'https://prod.example.com';
  });

  describe('signup', () => {
    it('should create a new user when email is not taken', async () => {
      const req = {
        body: { nickname: 'Nick', email: 'nick@example.com', password: 'Secret123!' },
      } as Request;
      const res = createMockResponse();
      
      // Mock: user doesn't exist
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      
      // Mock: role exists
      const defaultRole = { id: 1, name: 'user' };
      prismaMock.role.findUnique.mockResolvedValueOnce(defaultRole);
      
      // Mock: password hashing
      bcryptMock.hash.mockResolvedValueOnce('hashed');
      
      // Mock: user creation
      const createdUser = {
        id: 1,
        email: 'nick@example.com',
        nickname: 'Nick',
        createdAt: new Date(),
      };
      prismaMock.user.create.mockResolvedValueOnce(createdUser);
      
      // Mock: JWT token generation
      jwtMock.sign.mockReturnValueOnce('token');

      await signup(req, res);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nick@example.com' },
      });
      expect(prismaMock.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'user' },
      });
      expect(bcryptMock.hash).toHaveBeenCalledWith('Secret123!', 10);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'nick@example.com',
          password: 'hashed',
          nickname: 'Nick',
          roleId: 1,
        },
        select: {
          id: true,
          email: true,
          nickname: true,
          createdAt: true,
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario registrado exitosamente',
        token: 'token',
        user: createdUser,
      });
    });

    it('should create default role when it does not exist', async () => {
      const req = {
        body: { nickname: 'NewUser', email: 'new@example.com', password: 'Secret123!' },
      } as Request;
      const res = createMockResponse();
      
      // Mock: user doesn't exist
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      
      // Mock: role doesn't exist, then create it
      prismaMock.role.findUnique.mockResolvedValueOnce(null);
      const createdRole = { id: 1, name: 'user' };
      prismaMock.role.create.mockResolvedValueOnce(createdRole);
      
      // Mock: password hashing
      bcryptMock.hash.mockResolvedValueOnce('hashed');
      
      // Mock: user creation
      const createdUser = {
        id: 1,
        email: 'new@example.com',
        nickname: 'NewUser',
        createdAt: new Date(),
      };
      prismaMock.user.create.mockResolvedValueOnce(createdUser);
      
      // Mock: JWT token generation
      jwtMock.sign.mockReturnValueOnce('token');

      await signup(req, res);

      expect(prismaMock.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'user' },
      });
      expect(prismaMock.role.create).toHaveBeenCalledWith({
        data: { name: 'user' },
      });
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          password: 'hashed',
          nickname: 'NewUser',
          roleId: 1,
        },
        select: {
          id: true,
          email: true,
          nickname: true,
          createdAt: true,
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if email already exists', async () => {
      const req = {
        body: { nickname: 'Nick', email: 'nick@example.com', password: 'Secret123!' },
      } as Request;
      const res = createMockResponse();
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1 });

      await signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El correo electrónico ya está registrado',
      });
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('should return 500 when signup throws unexpectedly', async () => {
      const req = {
        body: { nickname: 'Nick', email: 'nick@example.com', password: 'Secret123!' },
      } as Request;
      const res = createMockResponse();
      prismaMock.user.findUnique.mockRejectedValueOnce(new Error('db down'));

      await signup(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Error al registrar usuario' })
      );
    });
  });

  describe('login', () => {
    it('should return 400 when credentials are missing', async () => {
      const req = { body: {} } as Request;
      const res = createMockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Correo electrónico y contraseña son requeridos',
      });
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('should authenticate user and set cookie', async () => {
      const req = {
        body: { email: 'user@example.com', password: 'Secret123!' },
        headers: {},
        ip: '127.0.0.1',
      } as unknown as Request;
      const res = createMockResponse();
      const user = {
        id: 1,
        email: 'user@example.com',
        nickname: 'User',
        createdAt: new Date(),
        password: 'hashed',
      };
      prismaMock.user.findUnique.mockResolvedValueOnce(user);
      bcryptMock.compare.mockResolvedValueOnce(true);
      jwtMock.sign.mockReturnValueOnce('jwt-token');

      await login(req, res);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        select: expect.any(Object),
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'authToken',
        'jwt-token',
        expect.objectContaining({ httpOnly: true })
      );
      // Debe registrar una sesión de usuario
      expect(prismaMock.userSession.upsert).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Inicio de sesión exitoso',
        user: {
          id: 1,
          email: 'user@example.com',
          nickname: 'User',
          createdAt: user.createdAt,
        },
      });
    });

    it('should authenticate user using correoElectronico and contraseña', async () => {
      const req = {
        body: { correoElectronico: 'user@example.com', contraseña: 'Secret123!' },
      } as Request;
      const res = createMockResponse();
      const user = {
        id: 1,
        email: 'user@example.com',
        password: 'hashedPassword',
        nickname: 'User',
        createdAt: new Date(),
      };
      prismaMock.user.findUnique.mockResolvedValueOnce(user);
      bcryptMock.compare.mockResolvedValueOnce(true);
      jwtMock.sign.mockReturnValueOnce('jwt-token');

      await login(req, res);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        select: expect.any(Object),
      });
      expect(res.cookie).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Inicio de sesión exitoso',
        user: expect.objectContaining({ email: 'user@example.com' }),
      });
    });

    it('should return 401 when password is invalid', async () => {
      const req = {
        body: { email: 'user@example.com', password: 'wrong' },
      } as Request;
      const res = createMockResponse();
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'user@example.com',
        nickname: 'User',
        createdAt: new Date(),
        password: 'hashed',
      });
      bcryptMock.compare.mockResolvedValueOnce(false);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
    });

    it('should return 401 when user is not found', async () => {
      const req = {
        body: { email: 'missing@example.com', password: 'Secret123!' },
      } as Request;
      const res = createMockResponse();
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
    });

    it('should return 500 when login throws unexpectedly', async () => {
      const req = {
        body: { email: 'user@example.com', password: 'Secret123!' },
      } as Request;
      const res = createMockResponse();
      prismaMock.user.findUnique.mockRejectedValueOnce(new Error('db down'));

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al iniciar sesión' });
    });
  });

  describe('logout', () => {
    it('should clear cookie and respond with success', () => {
      const req = {} as Request;
      const res = createMockResponse();

      logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        'authToken',
        expect.objectContaining({ httpOnly: true })
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Sesión cerrada exitosamente',
      });
    });
  });

  describe('getProfile', () => {
    it('should return 401 when user is not authenticated', async () => {
      const req = { user: undefined } as unknown as Request;
      const res = createMockResponse();

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    });

    it('should return user profile when exists with string userId', async () => {
      const req = { user: { userId: '5' } } as unknown as Request;
      const res = createMockResponse();
      const user = { id: 5, email: 'user@example.com', nickname: 'User', createdAt: new Date() };
      prismaMock.user.findUnique.mockResolvedValueOnce(user);

      await getProfile(req, res);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
        select: {
          id: true,
          email: true,
          nickname: true,
          createdAt: true,
        },
      });
      expect(res.json).toHaveBeenCalledWith({ user });
    });

    it('should return user profile when exists with number userId', async () => {
      const req = { user: { userId: 5 } } as unknown as Request;
      const res = createMockResponse();
      const user = { id: 5, email: 'user@example.com', nickname: 'User', createdAt: new Date() };
      prismaMock.user.findUnique.mockResolvedValueOnce(user);

      await getProfile(req, res);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
        select: {
          id: true,
          email: true,
          nickname: true,
          createdAt: true,
        },
      });
      expect(res.json).toHaveBeenCalledWith({ user });
    });

    it('should return 401 when userId is NaN', async () => {
      const req = { user: { userId: 'invalid' } } as unknown as Request;
      const res = createMockResponse();

      await getProfile(req, res);

      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    });

    it('should return 404 when user does not exist', async () => {
      const req = { user: { userId: '5' } } as unknown as Request;
      const res = createMockResponse();
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuario no encontrado' });
    });

    it('should return 500 when getProfile throws', async () => {
      const req = { user: { userId: '5' } } as unknown as Request;
      const res = createMockResponse();
      prismaMock.user.findUnique.mockRejectedValueOnce(new Error('db fail'));

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Error al obtener perfil' })
      );
    });
  });

  describe('recoverPass', () => {
    it('should return 400 when email is missing', async () => {
      const req = { body: {} } as Request;
      const res = createMockResponse();

      await recoverPass(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'El email es requerido' });
    });

    it('should send email when user exists', async () => {
      const req = { body: { email: 'user@example.com' } } as Request;
      const res = createMockResponse();
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'user@example.com',
      });
      jwtMock.sign.mockReturnValueOnce('reset-token');
      sendEmailMock.mockResolvedValueOnce();

      await recoverPass(req, res);

      const [callPayload, , callOptions] = jwtMock.sign.mock.calls[0];
      expect(callPayload).toEqual({ userId: 1 });
      expect(callOptions).toEqual({ expiresIn: '1h' });
      // Debe registrar un PasswordReset
      expect(prismaMock.passwordReset.create).toHaveBeenCalled();
      expect(sendEmailMock).toHaveBeenCalledWith(
        'user@example.com',
        'Restablecer contraseña',
        expect.stringContaining('reset-token')
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Revisa tu correo para continuar',
      });
    });

    it('should return 202 when user is not found', async () => {
      const req = { body: { email: 'unknown@example.com' } } as Request;
      const res = createMockResponse();
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await recoverPass(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Si el correo es válido recibirá instrucciones',
      });
    });

    it('should return 500 when recoverPass throws unexpectedly', async () => {
      const req = { body: { email: 'user@example.com' } } as Request;
      const res = createMockResponse();
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'user@example.com',
      });
      sendEmailMock.mockRejectedValueOnce(new Error('smtp down'));

      await recoverPass(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Inténtalo de nuevo más tarde',
      });
    });
  });

  describe('resetPass', () => {
    it('should return 400 when passwords are missing', async () => {
      const req = { params: { token: 'token' }, body: {} } as unknown as Request;
      const res = createMockResponse();

      await resetPass(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La contraseña y confirmación son requeridas',
      });
    });

    it('should return 400 for invalid token', async () => {
      const req = {
        params: { token: 'token' },
        body: { password: 'Password1!', confirmPassword: 'Password1!' },
      } as unknown as Request;
      const res = createMockResponse();
      jwtMock.verify.mockImplementationOnce(() => {
        throw new Error('invalid');
      });

      await resetPass(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido o expirado' });
    });

    it('should update password when token and payload are valid', async () => {
      const req = {
        params: { token: 'token' },
        body: { password: 'Password1!', confirmPassword: 'Password1!' },
      } as unknown as Request;
      const res = createMockResponse();
      jwtMock.verify.mockReturnValueOnce({ userId: 1 });
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1 });
      bcryptMock.hash.mockResolvedValueOnce('hashed');

      await resetPass(req, res);

      expect(bcryptMock.hash).toHaveBeenCalledWith('Password1!', 10);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: 'hashed' },
      });
      expect(prismaMock.passwordReset.updateMany).toHaveBeenCalledWith({
        where: { token: 'token' },
        data: { used: true },
      });
      expect(res.json).toHaveBeenCalledWith({ message: 'Contraseña actualizada' });
    });

    it('should return 400 when passwords do not match', async () => {
      const req = {
        params: { token: 'token' },
        body: { password: 'Password1!', confirmPassword: 'Password2!' },
      } as unknown as Request;
      const res = createMockResponse();

      await resetPass(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Las contraseñas no coinciden' });
    });

    it('should return 400 when password does not meet strength requirements', async () => {
      const req = {
        params: { token: 'token' },
        body: { password: 'weak', confirmPassword: 'weak' },
      } as unknown as Request;
      const res = createMockResponse();
      jwtMock.verify.mockReturnValueOnce({ userId: 1 });

      await resetPass(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message:
          'La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y carácter especial',
      });
    });

    it('should return 404 when decoded user does not exist', async () => {
      const req = {
        params: { token: 'token' },
        body: { password: 'Password1!', confirmPassword: 'Password1!' },
      } as unknown as Request;
      const res = createMockResponse();
      jwtMock.verify.mockReturnValueOnce({ userId: 1 });
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await resetPass(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });

    it('should return 500 when reset process throws', async () => {
      const req = {
        params: { token: 'token' },
        body: { password: 'Password1!', confirmPassword: 'Password1!' },
      } as unknown as Request;
      const res = createMockResponse();
      jwtMock.verify.mockReturnValueOnce({ userId: 1 });
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1 });
      bcryptMock.hash.mockResolvedValueOnce('hashed');
      prismaMock.user.update.mockRejectedValueOnce(new Error('db fail'));

      await resetPass(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Inténtalo de nuevo más tarde',
      });
    });
  });

  describe('adminLogin', () => {
    it('should return 400 when credentials are missing', async () => {
      const req = { body: {} } as Request;
      const res = createMockResponse();

      await adminLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Correo electrónico y contraseña son requeridos',
      });
    });

    it('should authenticate admin user and set admin cookie', async () => {
      const req = {
        body: { email: 'admin@example.com', password: 'Secret123!' },
        headers: {},
        ip: '127.0.0.1',
      } as unknown as Request;
      const res = createMockResponse();
      const user = {
        id: 1,
        email: 'admin@example.com',
        password: 'hashed',
        nickname: 'Admin',
        createdAt: new Date(),
        role: { name: 'admin' },
      };
      prismaMock.user.findUnique.mockResolvedValueOnce(user);
      bcryptMock.compare.mockResolvedValueOnce(true);
      jwtMock.sign.mockReturnValueOnce('admin-jwt-token');

      await adminLogin(req, res);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@example.com' },
        include: { role: true },
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'adminAuthToken',
        'admin-jwt-token',
        expect.objectContaining({ httpOnly: true })
      );
      expect(prismaMock.userSession.upsert).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Inicio de sesión de administrador exitoso',
        user: expect.objectContaining({
          email: 'admin@example.com',
          role: 'admin',
        }),
      });
    });

    it('should return 403 when user is not admin', async () => {
      const req = {
        body: { email: 'user@example.com', password: 'Secret123!' },
      } as unknown as Request;
      const res = createMockResponse();
      const user = {
        id: 1,
        email: 'user@example.com',
        password: 'hashed',
        nickname: 'User',
        createdAt: new Date(),
        role: { name: 'user' },
      };
      prismaMock.user.findUnique.mockResolvedValueOnce(user);
      bcryptMock.compare.mockResolvedValueOnce(true);

      await adminLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Acceso restringido a administradores',
      });
    });
  });
});


