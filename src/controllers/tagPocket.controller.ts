// src/controllers/tagPocket.controller.ts
import { Request, Response } from "express";
import prisma from "../config/db";

/**
 * Creates a new TagPocket associated with an account.
 *
 * @async
 * @route POST /tag-pockets
 * @param {Request} req - Express request object containing `name`, `description`, and `accountId` in the body.
 * @param {string} req.body.name - Name of the tag.
 * @param {string} [req.body.description] - Optional description of the tag.
 * @param {number} req.body.accountId - ID of the account this tag belongs to.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>}
 */
export const createTagPocket = async (req: Request, res: Response) => {
  try {
    // Obtener userId del token
    const userIdValue = req.user?.userId;
    const userId = typeof userIdValue === "number" 
      ? userIdValue 
      : userIdValue 
      ? Number(userIdValue) 
      : undefined;

    if (!userId || Number.isNaN(userId)) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { name, description, accountId } = req.body;

    if (!accountId || !name) {
      return res.status(400).json({ error: "Faltan accountId o name" });
    }

    // Verificar que la cuenta pertenece al usuario autenticado
    const account = await prisma.account.findFirst({
      where: {
        id: Number(accountId),
        userId: userId,
      },
    });

    if (!account) {
      return res.status(403).json({ error: "La cuenta no existe o no pertenece a tu usuario" });
    }

    const tag = await prisma.tagPocket.create({
      data: {
        name,
        description,
        accountId: Number(accountId),
      },
    });

    return res.status(201).json({ message: "TagPocket creado", tag });
  } catch (error) {
    console.error("Error creando TagPocket:", error);
    return res.status(500).json({ error: "Error al crear TagPocket" });
  }
};

/**
 * Retrieves all TagPockets for the authenticated user.
 *
 * @async
 * @route GET /tags
 * @param {Request} req - Express request object (with user from verifyToken middleware).
 * @param {Response} res - Express response object returning the list of TagPockets.
 * @returns {Promise<void>}
 */
export const getAllTags = async (req: Request, res: Response) => {
  try {
    // Obtener userId del token
    const userIdValue = req.user?.userId;
    const userId = typeof userIdValue === "number" 
      ? userIdValue 
      : userIdValue 
      ? Number(userIdValue) 
      : undefined;

    if (!userId || Number.isNaN(userId)) {
      return res.status(401).json({ error: "No autenticado" });
    }

    // Filtrar tags por usuario a través de account -> user
    const tags = await prisma.tagPocket.findMany({
      where: {
        account: {
          userId: userId,
        },
      },
      include: { 
        transactions: true, 
        account: true 
      },
    });

    return res.json(tags);
  } catch (error) {
    console.error("Error obteniendo todos los TagPockets:", error);
    return res.status(500).json({ error: "Error al obtener TagPockets" });
  }
};

/**
 * Retrieves all TagPockets associated with a specific account (only if account belongs to authenticated user).
 *
 * @async
 * @route GET /tags/:id
 * @param {Request} req - Express request object containing the account ID in params.
 * @param {string} req.params.id - ID of the account to retrieve tags from.
 * @param {Response} res - Express response object returning the list of TagPockets.
 * @returns {Promise<void>}
 */
export const getTagsByAccount = async (req: Request, res: Response) => {
  try {
    // Obtener userId del token
    const userIdValue = req.user?.userId;
    const userId = typeof userIdValue === "number" 
      ? userIdValue 
      : userIdValue 
      ? Number(userIdValue) 
      : undefined;

    if (!userId || Number.isNaN(userId)) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { id } = req.params;

    // Verificar que la cuenta pertenece al usuario autenticado
    const account = await prisma.account.findFirst({
      where: {
        id: Number(id),
        userId: userId,
      },
    });

    if (!account) {
      return res.status(404).json({ error: "Cuenta no encontrada o no pertenece a tu usuario" });
    }

    const tags = await prisma.tagPocket.findMany({
      where: { 
        accountId: Number(id),
        account: {
          userId: userId,
        },
      },
      include: { 
        transactions: true,
        account: true,
      },
    });

    return res.json(tags);
  } catch (error) {
    console.error("Error obteniendo TagPockets:", error);
    return res.status(500).json({ error: "Error al obtener TagPockets" });
  }
};

/**
 * Updates an existing TagPocket's name or description.
 * Only provided fields will be updated.
 *
 * @async
 * @route PUT /tag-pockets/:id
 * @param {Request} req - Express request object containing update data in the body.
 * @param {string} req.params.id - ID of the TagPocket to update.
 * @param {string} [req.body.name] - New tag name (optional).
 * @param {string} [req.body.description] - New tag description (optional).
 * @param {Response} res - Express response object returning the updated tag.
 * @returns {Promise<void>}
 */
export const updateTagPocket = async (req: Request, res: Response) => {
    try {
      // Obtener userId del token
      const userIdValue = req.user?.userId;
      const userId = typeof userIdValue === "number" 
        ? userIdValue 
        : userIdValue 
        ? Number(userIdValue) 
        : undefined;

      if (!userId || Number.isNaN(userId)) {
        return res.status(401).json({ error: "No autenticado" });
      }

      const { id } = req.params;
      const { name, description } = req.body;
  
      // Buscar el tag y verificar que pertenece al usuario autenticado
      const existing = await prisma.tagPocket.findFirst({
        where: { 
          id: Number(id),
          account: {
            userId: userId,
          },
        },
      });
  
      if (!existing) {
        return res.status(404).json({ error: "TagPocket no encontrado o no pertenece a tu usuario" });
      }
  
      const updated = await prisma.tagPocket.update({
        where: { id: Number(id) },
        data: {
          name: name ?? existing.name,
          description: description ?? existing.description,
        },
      });
  
      return res.json({ message: "TagPocket actualizado", tag: updated });
    } catch (error) {
      console.error("Error actualizando TagPocket:", error);
      return res.status(500).json({ error: "Error al actualizar TagPocket" });
    }
  };
  

/**
 * Deletes a TagPocket by its ID.
 *
 * @async
 * @route DELETE /tag-pockets/:id
 * @param {Request} req - Express request object containing the tag ID in params.
 * @param {string} req.params.id - ID of the TagPocket to delete.
 * @param {Response} res - Express response object confirming deletion.
 * @returns {Promise<void>}
 */
export const deleteTagPocket = async (req: Request, res: Response) => {
  try {
    // Obtener userId del token
    const userIdValue = req.user?.userId;
    const userId = typeof userIdValue === "number" 
      ? userIdValue 
      : userIdValue 
      ? Number(userIdValue) 
      : undefined;

    if (!userId || Number.isNaN(userId)) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { id } = req.params;

    // Verificar que el tag pertenece al usuario autenticado
    const existing = await prisma.tagPocket.findFirst({
      where: { 
        id: Number(id),
        account: {
          userId: userId,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "TagPocket no encontrado o no pertenece a tu usuario" });
    }

    await prisma.tagPocket.delete({ where: { id: Number(id) } });
    return res.json({ message: "TagPocket eliminado" });
  } catch (error) {
    console.error("Error eliminando TagPocket:", error);
    return res.status(500).json({ error: "Error al eliminar TagPocket" });
  }
};
