import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
//import sendEmail from "../utils/sendEmail";
import sendEmail from "../utils/validators";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../middlewares/auth.middleware";

const SALT_ROUNDS = 10;

/**
 * Removes sensitive fields from a user object, such as the password.
 *
 * @async
 * @param {Object} user - Full user object retrieved from the database.
 * @param {number} user.id - User ID.
 * @param {string} user.email - User email.
 * @param {string} user.nickname - User nickname.
 * @param {number} user.roleId - Associated role ID.
 * @param {Date} user.createdAt - Creation date.
 * @param {Date} user.updatedAt - Update date.
 * @returns {Promise<Object>} User object without sensitive fields.
 */
export const excludePassword = async (user: any) => {

  const role = await prisma.role.findUnique({ where: { id: user.roleId } });
  const data = {
    "id": user.id,
    "email": user.email,
    "nickname": user.nickname,
    "role": role?.name,
    "createdAt": user.createdAt,
    "updatedAt": user.updatedAt

  };
  return data;
};

/**
 * Generates a new access token using the refresh token stored in cookies and database.
 *
 * @async
 * @route POST /auth/refresh
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Response with new access token or an error.
 */
export const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken)
    return res.status(401).json({ error: "Missing refresh token" });

  const session = await prisma.userSession.findUnique({
    where: { refreshToken },
    include: { user: true },
  });

  if (!session) return res.status(403).json({ error: "Invalid session" });

  if (session.revoke) return res.status(403).json({ error: "Invalid session" });

  try {
    jwt.verify(refreshToken, process.env.REFRESH_SECRET as string);
  } catch {
    return res.status(403).json({ error: "Invalid refresh token" });
  }

  const newAccessToken = generateAccessToken(
    session.user.id,
    session.user.email
  );

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  res.json({ message: "Token refreshed" });
};

/**
 * Registers a new user in the database.
 *
 * @async
 * @route POST /auth/signup
 * @param {Request} req - Request containing registration data.
 * @param {string} req.body.nickname - User nickname.
 * @param {string} req.body.email - User email.
 * @param {string} req.body.password - User password.
 * @param {number} req.body.roleId - Role assigned to the user.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Response containing created user or an error.
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const { nickname, email, password, roleId } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "El correo electrónico ya está registrado" });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        nickname: nickname,
        roleId: roleId
      },
    });

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: await excludePassword(newUser),
    });
  } catch (error) {
    console.error("Error en signup:", error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

/**
 * Logs in a user, validates credentials, generates tokens and manages sessions.
 *
 * @async
 * @route POST /auth/login
 * @param {Request} req - Request containing login credentials.
 * @param {string} req.body.email - User email.
 * @param {string} req.body.password - User password.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} Response with tokens and sanitized user data.
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    let { deviceId } = req.cookies;

    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    if (!deviceId) {
      deviceId = crypto.randomUUID();
    }

    const existingSession = await prisma.userSession.findUnique({
      where: {
        userId_deviceId: { userId: user.id, deviceId },
      },
    });

    if (existingSession) {
      await prisma.userSession.update({
        where: { userId_deviceId: { userId: user.id, deviceId } },
        data: {
          refreshToken,
          lastUsedAt: new Date(),
          userAgent: req.headers["user-agent"] || "Unknown",
          ip: req.ip || "unknown",
        },
      });
    } else {
      await prisma.userSession.create({
        data: {
          tokenId: crypto.randomUUID(),
          refreshToken,
          deviceId,
          userAgent: req.headers["user-agent"] || "Unknown",
          ip: req.ip || "unknown",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
          userId: user.id,
        },
      });
    }

    res.cookie("AccessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 día
    });

    res.cookie("RefreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    res.cookie("deviceId", deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 año
    });

    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      user: await excludePassword(user),
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

/**
 * Logs out the user from all active sessions by deleting all their user sessions.
 *
 * @route POST /auth/logout/all
 * @param {Request} req - HTTP request containing cookies.
 * @param {Response} res - HTTP response.
 * @returns {Response} Confirmation message.
 */
export const allLogout = (req: Request, res: Response) => {
  prisma.userSession.deleteMany({
    where: { refreshToken: req.cookies.RefreshToken },
  });

  res.clearCookie("AccessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  res.clearCookie("RefreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.json({ message: "Sesión cerrada exitosamente" });
};

/**
 * Logs out the user from the current session by invalidating their refresh token.
 *
 * @route POST /auth/logout
 * @param {Request} req - HTTP request containing cookies.
 * @param {Response} res - HTTP response.
 * @returns {Response} Confirmation message.
 */
export const logout = (req: Request, res: Response) => {
  prisma.userSession.update({
    where: { refreshToken: req.cookies.RefreshToken },
    data: {
      revoke: true,
    },
  });

  res.clearCookie("AccessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  res.clearCookie("RefreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.json({ message: "Sesión cerrada exitosamente" });
};


/**
 * Retrieves the profile information of the authenticated user.
 *
 * @async
 * @route GET /auth/profile
 * @param {Request} req - HTTP request containing authenticated user data.
 * @param {Response} res - HTTP response.
 * @returns {Promise<Response>} Sanitized user profile or an error.
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const role = await prisma.role.findUnique({
      where: {id: user.roleId}
    });

    if (!role){
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    res.json({ user: await excludePassword(user) });
  } catch (error) {
    console.error("Error en getProfile:", error);
    res.status(500).json({ error: "Error al obtener perfil" });
  }
};

/**
 * Sends a password reset email with a temporary token.
 *
 * @async
 * @route POST /auth/recover
 * @param {Request} req - HTTP request containing the user's email.
 * @param {string} req.body.email - User email.
 * @param {Response} res - HTTP response.
 * @returns {Promise<Response>} Message indicating whether the email was sent.
 */
export const recoverPass = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "El email es requerido" });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(202).json({
        message: "Si el correo es válido, recibirá instrucciones",
      });
    }

    const token = generateAccessToken(user.id, user.email);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.passwordReset.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const frontendUrl =
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL_PROD
        : process.env.FRONTEND_URL_DEV;

    const resetUrl = `${frontendUrl}/restablecer?token=${token}`;

    await sendEmail(
      user.email,
      "Restablecer contraseña",
      `Haz clic en este enlace para restablecer tu contraseña (válido por 1 hora): ${resetUrl}`
    );

    return res.status(200).json({
      message: "Revisa tu correo para continuar",
    });
  } catch (error) {
    console.error("Error en recoverPass:", error);
    return res.status(500).json({
      message: "Inténtalo de nuevo más tarde",
    });
  }
};

/**
 * Resets the user's password using a valid reset token.
 *
 * @async
 * @route POST /auth/reset/:token
 * @param {Request} req - HTTP request containing the reset token and new passwords.
 * @param {string} req.params.token - Password reset token.
 * @param {string} req.body.password - New password.
 * @param {string} req.body.confirmPassword - Password confirmation.
 * @param {Response} res - HTTP response.
 * @returns {Promise<Response>} Success message or error depending on validation.
 */
export const resetPass = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        error: "La contraseña y confirmación son requeridas",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Las contraseñas no coinciden",
      });
    }

    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.])[A-Za-z\d@$!%*?&#.]{8,}$/;
    if (!regex.test(password)) {
      return res.status(400).json({
        message:
          "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial",
      });
    }

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (
      !resetRecord ||
      resetRecord.used ||
      resetRecord.expiresAt < new Date()
    ) {
      return res.status(400).json({
        message: "Token inválido o expirado",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    return res.status(200).json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("Error en resetPass:", error);
    return res.status(500).json({
      message: "Inténtalo de nuevo más tarde",
    });
  }
};

/**
 * Updates the authenticated user's profile (nickname and/or email).
 *
 * @async
 * @route PUT /auth/profile
 * @param {Request} req - HTTP request containing new profile data.
 * @param {string} [req.body.nickname] - New nickname.
 * @param {string} [req.body.email] - New email.
 * @param {Response} res - HTTP response.
 * @returns {Promise<Response>} Updated user data or error.
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { nickname, email } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    // Validar que al menos un campo sea proporcionado
    if (!nickname && !email) {
      return res.status(400).json({
        error: "Debes proporcionar al menos un campo para actualizar",
      });
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          error: "El correo electrónico ya está en uso",
        });
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    if (nickname) updateData.nickname = nickname;
    if (email) updateData.email = email;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({
      message: "Perfil actualizado exitosamente",
      user: await excludePassword(updatedUser),
    });
  } catch (error) {
    console.error("Error en updateProfile:", error);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
};

/**
 * Changes the authenticated user's password.
 *
 * @async
 * @route PUT /auth/change-password
 * @param {Request} req - HTTP request containing password information.
 * @param {string} req.body.currentPassword - Current password.
 * @param {string} req.body.newPassword - New password.
 * @param {string} req.body.confirmPassword - Password confirmation.
 * @param {Response} res - HTTP response.
 * @returns {Promise<Response>} Success message or error.
 */

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: "Todos los campos son requeridos",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: "Las contraseñas nuevas no coinciden",
      });
    }

    // Validar formato de la nueva contraseña
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.])[A-Za-z\d@$!%*?&#.]{8,}$/;
    if (!regex.test(newPassword)) {
      return res.status(400).json({
        error:
          "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial",
      });
    }

    // Obtener usuario y verificar contraseña actual
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("Error en changePassword:", error);
    return res.status(500).json({
      error: "Error al cambiar contraseña",
    });
  }
};

/**
 * Permanently deletes the authenticated user's account and all related records.
 *
 * @async
 * @route DELETE /auth/delete-account
 * @param {Request} req - HTTP request containing user authentication and password.
 * @param {string} req.body.password - Password required for confirmation.
 * @param {Response} res - HTTP response.
 * @returns {Promise<Response>} Confirmation of account deletion or error.
 */

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { password } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    if (!password) {
      return res.status(400).json({
        error: "La contraseña es requerida para eliminar la cuenta",
      });
    }

    // Obtener usuario y verificar contraseña
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Eliminar todas las sesiones del usuario
    await prisma.userSession.deleteMany({
      where: { userId },
    });

    // Eliminar todos los registros de reseteo de contraseña
    await prisma.passwordReset.deleteMany({
      where: { userId },
    });

    // Eliminar todas las cuentas del usuario
    await prisma.account.deleteMany({
      where: { userId },
    });

    // Eliminar el usuario
    await prisma.user.delete({
      where: { id: userId },
    });

    // Limpiar cookies
    res.clearCookie("AccessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.clearCookie("RefreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.clearCookie("deviceId", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Cuenta eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error en deleteAccount:", error);
    return res.status(500).json({
      error: "Error al eliminar cuenta",
    });
  }
};
