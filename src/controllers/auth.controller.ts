import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
import { UserCreateInput, UserResponse } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_super_seguro_aqui";
const SALT_ROUNDS = 10;

// Función para excluir campos sensibles
const excludePassword = (user: any): UserResponse => {
  const { contraseña, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { nombres, apellidos, edad, correoElectronico, contraseña } =
      req.body;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { correoElectronico },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "El correo electrónico ya está registrado" });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(contraseña, SALT_ROUNDS);

    // Crear nuevo usuario
    const newUser = await prisma.user.create({
      data: {
        nombres,
        apellidos,
        edad: parseInt(edad),
        correoElectronico,
        contraseña: hashedPassword,
      },
    });

    // Generar token JWT
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      message: "Usuario registrado exitosamente",
      token,
      user: excludePassword(newUser),
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
      user: excludePassword(user),
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
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json({ user: excludePassword(user) });
  } catch (error) {
    console.error("Error en getProfile:", error);
    return res.status(500).json({ error: "Error al obtener perfil" });
  }
};
