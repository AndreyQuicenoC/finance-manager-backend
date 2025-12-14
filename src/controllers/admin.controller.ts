import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../config/db";

const SALT_ROUNDS = 10;

/**
 * Obtener historial de logeos / sesiones de usuario.
 * Permite opcionalmente filtrar por userId.
 */
export const getLoginLogs = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    let userIdNumber: number | undefined;
    if (typeof userId === "string" && userId.trim() !== "") {
      const parsed = Number(userId);
      if (!Number.isNaN(parsed)) {
        userIdNumber = parsed;
      }
    }

    const logs = await prisma.userSession.findMany({
      where: userIdNumber ? { userId: userIdNumber } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        deviceId: true,
        userAgent: true,
        ip: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        revoke: true,
      },
    });

    return res.json({ logs });
  } catch (error) {
    console.error("Error en getLoginLogs:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener historial de logeos" });
  }
};

/**
 * Eliminar (lógicamente) un usuario de la base de datos.
 * Un administrador marca el usuario como inactivo en lugar de borrarlo físicamente.
 */
export const deleteUserByAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = Number(id);

    if (!id || Number.isNaN(userId)) {
      return res.status(400).json({ message: "ID de usuario inválido" });
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        // borrado lógico
        isDeleted: true,
      } as any,
    });

    return res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error en deleteUserByAdmin:", error);
    return res
      .status(500)
      .json({ message: "Error al eliminar usuario por administrador" });
  }
};

/**
 * Obtener todos los usuarios de la aplicación con su rol asociado.
 */
export const getAllUsersForAdmin = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        // En esquemas antiguos isDeleted puede no existir, Prisma lo ignora
      } as any,
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    return res.json({ users });
  } catch (error) {
    console.error("Error en getAllUsersForAdmin:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener usuarios para administración" });
  }
};

/**
 * Obtener estadísticas sobre reseteos de contraseña.
 */
export const getPasswordResetStats = async (_req: Request, res: Response) => {
  try {
    const totalResets = await prisma.passwordReset.count();

    const resetsByUser = await prisma.passwordReset.groupBy({
      by: ["userId"],
      _count: {
        _all: true,
      },
    });

    return res.json({
      totalResets,
      byUser: resetsByUser.map((item) => ({
        userId: item.userId,
        resetCount: item._count._all,
      })),
    });
  } catch (error) {
    console.error("Error en getPasswordResetStats:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener estadísticas de reseteos" });
  }
};

/**
 * Obtener estadísticas generales: transacciones en un rango de fechas y
 * número de administradores.
 */
export const getOverviewStats = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    if (typeof from !== "string" || typeof to !== "string") {
      return res.status(400).json({
        message: "Parámetros 'from' y 'to' son requeridos",
      });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return res.status(400).json({
        message: "Parámetros de fecha inválidos",
      });
    }

    const transactionsCount = await prisma.transaction.count({
      where: {
        transactionDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    const totalUsers = await prisma.user.count({
      where: {} as any,
    });

    const adminCount = await prisma.user.count({
      where: {
        role: {
          name: {
            in: ["admin", "super_admin"],
          },
        },
      },
    });

    return res.json({
      transactionsCount,
      totalUsers,
      adminCount,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    });
  } catch (error) {
    console.error("Error en getOverviewStats:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener estadísticas generales" });
  }
};

/**
 * Crear un nuevo usuario administrador.
 * Solo puede ser llamado por un súper administrador (middleware).
 */
export const createAdminUser = async (req: Request, res: Response) => {
  try {
    const { email, password, nickname } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseña son requeridos",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado" });
    }

    // Obtener o crear rol admin
    let adminRole = await prisma.role.findUnique({
      where: { name: "admin" },
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: { name: "admin" },
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
        roleId: adminRole.id,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Administrador creado exitosamente",
      user: newAdmin,
    });
  } catch (error) {
    console.error("Error en createAdminUser:", error);
    return res
      .status(500)
      .json({ message: "Error al crear usuario administrador" });
  }
};

/**
 * Eliminar (lógicamente) un usuario administrador.
 * Solo puede ser llamado por un súper administrador.
 */
export const deleteAdminUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = Number(id);

    if (!id || Number.isNaN(userId)) {
      return res.status(400).json({ message: "ID de usuario inválido" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (!user.role || user.role.name !== "admin") {
      return res.status(400).json({
        message: "Solo se pueden eliminar cuentas con rol administrador",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
      } as any,
    });

    return res.json({ message: "Administrador eliminado correctamente" });
  } catch (error) {
    console.error("Error en deleteAdminUser:", error);
    return res
      .status(500)
      .json({ message: "Error al eliminar usuario administrador" });
  }
};


