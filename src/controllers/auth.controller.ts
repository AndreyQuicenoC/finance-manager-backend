import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
//import { UserResponse } from "../types";
import sendEmail from "../utils/sendEmail";

const JWT_SECRET = process.env.JWT_SECRET as string;
const SALT_ROUNDS = 10;

// Función para excluir campos sensibles
//const excludePassword = (user: any): UserResponse => {
//  const { contraseña: _, ...userWithoutPassword } = user;
//  return userWithoutPassword;
//};

export const signup = async (req: Request, res: Response) => {
  try {
    const { nickname, email, password, roleId } = req.body;

    // Verificar si el usuario ya existe
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

    // Crear nuevo usuario
    const newUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        nickname: nickname,
        roleId: roleId,
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
    return res.status(500).json({ error: "Error al registrar usuario" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { correoElectronico, contraseña } = req.body;

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { correoElectronico },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(contraseña, user.contraseña);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar token JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
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

    return res.json({
      message: "Inicio de sesión exitoso",
      user: user,
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.json({ message: "Sesión cerrada exitosamente" });
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json({ user: user });
  } catch (error) {
    console.error("Error en getProfile:", error);
    return res.status(500).json({ error: "Error al obtener perfil" });
  }
};

export const recoverPass = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validación de campo requerido
    if (!email) {
      return res.status(400).json({ error: "El email es requerido" });
    }

    /**
     * Find user by email.
     * May throw error if user doesn't exist.
     */
    const user = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
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
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    /**
     * Store reset token and expiration in user document.
     * Token expires in 1 hour (3600000 ms).
     */
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    // Cambiar la tabla

    await prisma.userToken.update({
      where: { userId: user.id },
      data: {
        resetPasswordExpires: resetPasswordExpires,
        resetPasswordToken: resetToken,
      },
    });

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
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
      return res.status(400).json({
        message: "Token inválido o expirado",
      });
    }

    /**
     * Find user with valid reset token.
     * Ensures token hasn't been used and hasn't expired.
     */
    const user = await prisma.userToken.findFirst({
      where: {
        userId: decoded.userId,
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(), // Greater than current date
        },
      },
    });

    /**
     * Reject if user not found or token invalid.
     */
    if (!user) {
      return res.status(400).json({
        message: "Token inválido o expirado",
      });
    }

    /**
     * Hash new password.
     * Password will be securely hashed before storage.
     */
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    /**
     * Update user password and invalidate reset token.
     * Prevents token reuse for security.
     */
    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.userToken.update({
      where: { userId: user.id },
      data: {
        resetPasswordExpires: null, //poner para fecha actual
        resetPasswordToken: null, // poner para string por defecto
      },
    });

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
