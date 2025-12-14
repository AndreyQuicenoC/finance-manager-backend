/**
 * @fileoverview Authentication controller for user registration, login, logout, profile management, and password recovery.
 * @module controllers/auth.controller
 * @requires express
 * @requires bcrypt
 * @requires jsonwebtoken
 * @requires ../config/db
 * @requires ../utils/sendEmail
 */

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
//import { UserResponse } from "../types";
import sendEmail from "../utils/sendEmail";

const JWT_SECRET = process.env.JWT_SECRET as string;
const SALT_ROUNDS = 10;

/**
 * Helper to obtain the admin JWT secret. It prefers `JWT_ADMIN_SECRET`
 * but falls back to `JWT_SECRET` so existing environments keep working.
 */
const getAdminJwtSecret = (): string | undefined => {
  const baseSecret = process.env.JWT_SECRET;
  const adminSecret = process.env.JWT_ADMIN_SECRET || baseSecret;
  return adminSecret;
};

/**
 * Helper to register or update a user session, which also acts as a basic
 * login log that administrators can later inspect from the admin panel.
 */
const registerUserSession = async (userId: number, req: Request) => {
  try {
    const deviceId =
      (req.headers["x-device-id"] as string | undefined) ?? "web-client";
    const userAgent = (req.headers["user-agent"] as string | undefined) ?? null;
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
      req.ip ??
      null;

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    // Usamos upsert para mantener una sesión por (userId, deviceId)
    await prisma.userSession.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
      create: {
        userId,
        deviceId,
        userAgent: userAgent ?? undefined,
        ip: ip ?? undefined,
        tokenId: `${userId}-${Date.now()}`,
        refreshToken: `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        expiresAt,
      },
      update: {
        userAgent: userAgent ?? undefined,
        ip: ip ?? undefined,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });
  } catch (error) {
    // No rompemos el flujo de login si falla el log de sesión, solo registramos el error
    console.error("Error al registrar sesión de usuario:", error);
  }
};

/**
 * Register a new user in the system.
 * 
 * @async
 * @function signup
 * @param {Request} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - User email address (required)
 * @param {string} req.body.password - User password (required, min 8 chars, must contain uppercase, lowercase, number, and special char)
 * @param {string} [req.body.nickname] - User nickname (optional)
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with user data and JWT token
 * 
 * @example
 * // Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "Password123!",
 *   "nickname": "johndoe"
 * }
 * 
 * @example
 * // Success response (201):
 * {
 *   "message": "Usuario registrado exitosamente",
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": 1,
 *     "email": "user@example.com",
 *     "nickname": "johndoe",
 *     "createdAt": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 * 
 * @throws {400} If email is already registered
 * @throws {500} If server error occurs
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const { nickname, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "El correo electrónico ya está registrado" });
    }

    // Obtener o crear rol por defecto (usuario)
    let defaultRole = await prisma.role.findUnique({
      where: { name: "user" },
    });

    if (!defaultRole) {
      defaultRole = await prisma.role.create({
        data: { name: "user" },
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Crear nuevo usuario
    const newUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        nickname: nickname,
        roleId: defaultRole.id,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
      },
    });

    // Generar token JWT
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      message: "Usuario registrado exitosamente",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("Error en signup:", error);
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return res.status(500).json({ 
      error: "Error al registrar usuario",
      message: error instanceof Error ? error.message : "Error desconocido"
    });
  }
};

/**
 * Authenticate user and create session.
 * 
 * @async
 * @function login
 * @param {Request} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} [req.body.email] - User email address (or use correoElectronico)
 * @param {string} [req.body.correoElectronico] - User email address (alternative to email)
 * @param {string} [req.body.password] - User password (or use contraseña)
 * @param {string} [req.body.contraseña] - User password (alternative to password)
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with user data and sets HTTP-only cookie with JWT token
 * 
 * @description
 * Supports both English and Spanish field names for compatibility.
 * Sets an HTTP-only cookie named 'authToken' with the JWT token.
 * Cookie expires in 24 hours.
 * 
 * @example
 * // Request body (English):
 * {
 *   "email": "user@example.com",
 *   "password": "Password123!"
 * }
 * 
 * @example
 * // Request body (Spanish):
 * {
 *   "correoElectronico": "user@example.com",
 *   "contraseña": "Password123!"
 * }
 * 
 * @example
 * // Success response (200):
 * {
 *   "message": "Inicio de sesión exitoso",
 *   "user": {
 *     "id": 1,
 *     "email": "user@example.com",
 *     "nickname": "johndoe",
 *     "createdAt": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 * // Also sets cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * 
 * @throws {400} If email or password is missing
 * @throws {401} If credentials are invalid
 * @throws {500} If server error occurs
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { correoElectronico, email, contraseña, password } = req.body ?? {};
    
    // Extract email input with clearer logic
    const emailInput = typeof correoElectronico === "string" 
      ? correoElectronico 
      : (typeof email === "string" ? email : "");
    
    // Extract password input with clearer logic
    const passwordInput = typeof contraseña === "string" 
      ? contraseña 
      : (typeof password === "string" ? password : "");

    if (!emailInput || !passwordInput) {
      return res.status(400).json({
        error: "Correo electrónico y contraseña son requeridos",
      });
    }

    // Buscar usuario activo (no eliminado lógicamente)
    const user = await prisma.user.findUnique({
      where: { email: emailInput.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
        password: true,
        // El campo isDeleted puede no existir en esquemas antiguos; Prisma lo ignora en select si no está
      } as any,
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Forzamos tipado flexible para evitar problemas de tipos generados por Prisma en tests
    const userRecord: any = user;

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(
      passwordInput,
      userRecord.password as string
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar token JWT para usuario normal
    const token = jwt.sign({ userId: userRecord.id as number }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // ✅ GUARDAR TOKEN EN COOKIE HTTP-ONLY
    res.cookie("authToken", token, {
      httpOnly: true, // ✅ NO accesible desde JavaScript (previene XSS)
      secure: process.env.NODE_ENV === "production", // ✅ Solo HTTPS en producción
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // ✅ Para CORS
      maxAge: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
      path: "/",
    });

    // Registrar sesión / log de login
    await registerUserSession(Number(userRecord.id), req);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...safeUser } = userRecord;

    return res.json({
      message: "Inicio de sesión exitoso",
      user: safeUser,
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

/**
 * Logout user by clearing authentication cookie.
 * 
 * @function logout
 * @param {Request} _req - Express request object (unused)
 * @param {Response} res - Express response object
 * @returns {Response} JSON response confirming logout
 * 
 * @description
 * Clears the HTTP-only 'authToken' cookie to invalidate the session.
 * Cookie settings must match those used in login.
 * 
 * @example
 * // Success response (200):
 * {
 *   "message": "Sesión cerrada exitosamente"
 * }
 * 
 * @requires verifyToken middleware should be used before this endpoint
 */
export const logout = (_req: Request, res: Response) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.json({ message: "Sesión cerrada exitosamente" });
};

/**
 * Admin login: similar a `login` pero solo permite el acceso a usuarios con
 * rol `admin` o `super_admin` y genera un token diferente usando otra firma
 * o secreto (`JWT_ADMIN_SECRET`) almacenado en la cookie `adminAuthToken`.
 */
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { correoElectronico, email, contraseña, password: pwd } = req.body ?? {};

    const emailInput =
      typeof correoElectronico === "string"
        ? correoElectronico
        : typeof email === "string"
        ? email
        : "";

    const passwordInput =
      typeof contraseña === "string"
        ? contraseña
        : typeof pwd === "string"
        ? pwd
        : "";

    if (!emailInput || !passwordInput) {
      return res.status(400).json({
        error: "Correo electrónico y contraseña son requeridos",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: emailInput.toLowerCase().trim() },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const userRecord: any = user;

    const isPasswordValid = await bcrypt.compare(
      passwordInput,
      userRecord.password as string
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const roleName = userRecord.role?.name as string | undefined;
    if (roleName !== "admin" && roleName !== "super_admin") {
      return res
        .status(403)
        .json({ error: "Acceso restringido a administradores" });
    }

    const adminSecret = getAdminJwtSecret();
    if (!adminSecret) {
      console.error("❌ JWT_ADMIN_SECRET / JWT_SECRET no están configurados");
      return res
        .status(500)
        .json({ message: "Error de configuración del servidor" });
    }

    const adminToken = jwt.sign(
      { userId: userRecord.id as number, role: roleName, email: userRecord.email },
      adminSecret,
      {
        expiresIn: "1d",
      }
    );

    res.cookie("adminAuthToken", adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    // registrar sesión como log de acceso al panel admin
    await registerUserSession(Number(userRecord.id), req);

    // No devolvemos contraseña
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = userRecord;

    return res.json({
      message: "Inicio de sesión de administrador exitoso",
      user: {
        id: safeUser.id,
        email: safeUser.email,
        nickname: safeUser.nickname,
        createdAt: safeUser.createdAt,
        role: roleName,
      },
    });
  } catch (error) {
    console.error("Error en adminLogin:", error);
    return res
      .status(500)
      .json({ error: "Error al iniciar sesión como administrador" });
  }
};

/**
 * Get authenticated user's profile information.
 * 
 * @async
 * @function getProfile
 * @param {Request} req - Express request object
 * @param {Object} req.user - User object added by verifyToken middleware
 * @param {string|number} req.user.userId - User ID from JWT token
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with user profile data
 * 
 * @description
 * Retrieves user profile from database using userId from authenticated request.
 * Requires authentication via verifyToken middleware.
 * 
 * @example
 * // Success response (200):
 * {
 *   "user": {
 *     "id": 1,
 *     "email": "user@example.com",
 *     "nickname": "johndoe",
 *     "createdAt": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 * 
 * @throws {401} If user is not authenticated or userId is invalid
 * @throws {404} If user is not found in database
 * @throws {500} If server error occurs
 * 
 * @requires verifyToken middleware
 */
// Helper: Convert userId to number
const parseUserId = (userIdValue: unknown): number | null => {
  if (typeof userIdValue === "number") return userIdValue;
  if (typeof userIdValue === "string" || userIdValue) {
    const parsed = Number(userIdValue);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

// Helper: Check if error is a database connection error
const isDatabaseConnectionError = (error: Error): boolean => {
  return error.message.includes("FATAL") || error.message.includes("connection");
};

// Helper: Handle database errors
const handleDatabaseError = (dbError: unknown, res: Response) => {
  console.error("Error de base de datos en getProfile:", dbError);
  
  if (dbError instanceof Error && isDatabaseConnectionError(dbError)) {
    return res.status(503).json({
      error: "Servicio temporalmente no disponible",
      message: "Error de conexión con la base de datos"
    });
  }
  
  throw dbError;
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = parseUserId(req.user?.userId);

    if (!userId) {
      console.error("❌ [getProfile] userId inválido:", req.user?.userId);
      return res.status(401).json({ error: "No autenticado" });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, nickname: true, createdAt: true },
      });

      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      return res.json({ user });
    } catch (dbError) {
      return handleDatabaseError(dbError, res);
    }
  } catch (error) {
    console.error("Error en getProfile:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    return res.status(500).json({
      error: "Error al obtener perfil",
      message: error instanceof Error ? error.message : "Error desconocido"
    });
  }
};

/**
 * Initiate password recovery process by sending reset email.
 * 
 * @async
 * @function recoverPass
 * @param {Request} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - User email address (required)
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response confirming email sent (or generic message for security)
 * 
 * @description
 * Generates a password reset token and sends it via email.
 * Returns generic message regardless of whether email exists to prevent email enumeration attacks.
 * Token expires in 1 hour.
 * 
 * @example
 * // Request body:
 * {
 *   "email": "user@example.com"
 * }
 * 
 * @example
 * // Success response (200):
 * {
 *   "message": "Revisa tu correo para continuar"
 * }
 * 
 * @example
 * // Response if email doesn't exist (202) - same message for security:
 * {
 *   "message": "Si el correo es válido recibirá instrucciones"
 * }
 * 
 * @throws {400} If email is missing or invalid
 * @throws {500} If server error occurs or email sending fails
 * 
 * @see {@link sendEmail} For email sending implementation
 */
export const recoverPass = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validación de campo requerido
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "El email es requerido" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    /**
     * Find user by email.
     * May throw error if user doesn't exist.
     */
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    /**
     * Return generic message if user not found.
     * Prevents email enumeration attacks.
     */
    if (!user) {
      return res.status(202).json({
        message: "Si el correo es válido recibirá instrucciones",
      });
    }

    /**
     * Generate secure reset token.
     * Token expires in 1 hour for security.
     */
    const resetToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Registrar solicitud de reseteo en la tabla PasswordReset para estadísticas
    try {
      await prisma.passwordReset.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
        },
      });
    } catch (logError) {
      // No romper el flujo de usuario si el log falla
      console.error("Error al registrar PasswordReset:", logError);
    }

    /**
     * Create password reset URL.
     * Points to frontend recovery page.
     * Uses production URL in production, dev URL in development.
     */
    const frontendUrl =
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL_PROD
        : process.env.FRONTEND_URL_DEV;

    const resetUrl = `${frontendUrl}/restablecer?token=${resetToken}`;

    /**
     * Send reset email with instructions.
     * Uses email utility service.
     */
    await sendEmail(
      user.email,
      "Restablecer contraseña",
      `Haz clic en este enlace para restablecer tu contraseña: ${resetUrl}`
    );

    /**
     * Return success confirmation.
     */
    return res.status(200).json({
      message: "Revisa tu correo para continuar",
    });
  } catch (error) {
    console.error("Error en recover:", error);
    return res.status(500).json({
      message: "Inténtalo de nuevo más tarde",
    });
  }
};

/**
 * Reset user password using token from recovery email.
 * 
 * @async
 * @function resetPass
 * @param {Request} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.token - JWT reset token from recovery email (required)
 * @param {Object} req.body - Request body
 * @param {string} req.body.password - New password (required, must meet strength requirements)
 * @param {string} req.body.confirmPassword - Password confirmation (required, must match password)
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response confirming password reset
 * 
 * @description
 * Validates reset token, verifies password strength, and updates user password.
 * Password must: be at least 8 characters, contain uppercase, lowercase, number, and special character.
 * Token must be valid and not expired (1 hour expiration).
 * 
 * @example
 * // Request URL: POST /api/auth/reset/:token
 * // Request body:
 * {
 *   "password": "NewPassword123!",
 *   "confirmPassword": "NewPassword123!"
 * }
 * 
 * @example
 * // Success response (200):
 * {
 *   "message": "Contraseña actualizada"
 * }
 * 
 * @throws {400} If password/confirmPassword missing, don't match, or don't meet requirements
 * @throws {400} If token is invalid or expired
 * @throws {404} If user is not found
 * @throws {500} If server error occurs
 */
export const resetPass = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validación de campos requeridos
    if (!password || !confirmPassword) {
      return res.status(400).json({
        error: "La contraseña y confirmación son requeridas",
      });
    }

    /**
     * Validate password confirmation match.
     */
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Las contraseñas no coinciden",
      });
    }

    /**
     * Validate password strength requirements.
     * Must contain: 8+ chars, uppercase, lowercase, number, special char.
     */
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.])[A-Za-z\d@$!%*?&#.]{8,}$/; // Son validos los puntos para las contraseñas
    if (!regex.test(password)) {
      return res.status(400).json({
        message:
          "La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y carácter especial",
      });
    }

    /**
     * Verify and decode reset token.
     * Throws error if token is invalid or expired.
     */
    let decoded: { userId: number };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch (error) {
      console.error("Invalid or expired reset token:", error);
      return res.status(400).json({
        message: "Token inválido o expirado",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    /**
     * Hash new password.
     * Password will be securely hashed before storage.
     */
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    /**
     * Update user password.
     */
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        password: hashedPassword,
      },
    });

    // Marcar como usado cualquier registro de PasswordReset asociado a este token
    try {
      await prisma.passwordReset.updateMany({
        where: { token },
        data: { used: true },
      });
    } catch (logError) {
      console.error("Error al marcar PasswordReset como usado:", logError);
    }

    /**
     * Return success confirmation.
     */
    return res.status(200).json({
      message: "Contraseña actualizada",
    });
  } catch (error) {
    console.error("Error en reset:", error);
    return res.status(500).json({
      message: "Inténtalo de nuevo más tarde",
    });
  }
};