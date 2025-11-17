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
    const { name, description, accountId } = req.body;

    if (!accountId || !name) {
      return res.status(400).json({ error: "Faltan accountId o name" });
    }

    const tag = await prisma.tagPocket.create({
      data: {
        name,
        description,
        accountId,
      },
    });

    res.status(201).json({ message: "TagPocket creado", tag });
  } catch (error) {
    console.error("Error creando TagPocket:", error);
    res.status(500).json({ error: "Error al crear TagPocket" });
  }
};

/**
 * Retrieves all TagPockets associated with a specific account.
 *
 * @async
 * @route GET /tag-pockets/account/:accountId
 * @param {Request} req - Express request object containing the account ID in params.
 * @param {string} req.params.accountId - ID of the account to retrieve tags from.
 * @param {Response} res - Express response object returning the list of TagPockets.
 * @returns {Promise<void>}
 */
export const getTagsByAccount = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    const tags = await prisma.tagPocket.findMany({
      where: { accountId: Number(accountId) },
      include: { transactions: true},
    });

    res.json(tags);
  } catch (error) {
    console.error("Error obteniendo TagPockets:", error);
    res.status(500).json({ error: "Error al obtener TagPockets" });
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
      const { id } = req.params;
      const { name, description } = req.body;
  
      // Buscar el tag actual
      const existing = await prisma.tagPocket.findUnique({
        where: { id: Number(id) },
      });
  
      if (!existing) {
        return res.status(404).json({ error: "TagPocket no encontrado" });
      }
  
      const updated = await prisma.tagPocket.update({
        where: { id: Number(id) },
        data: {
          name: name ?? existing.name,
          description: description ?? existing.description,
        },
      });
  
      res.json({ message: "TagPocket actualizado", tag: updated });
    } catch (error) {
      console.error("Error actualizando TagPocket:", error);
      res.status(500).json({ error: "Error al actualizar TagPocket" });
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
    const { id } = req.params;

    await prisma.tagPocket.delete({ where: { id: Number(id) } });
    res.json({ message: "TagPocket eliminado" });
  } catch (error) {
    console.error("Error eliminando TagPocket:", error);
    res.status(500).json({ error: "Error al eliminar TagPocket" });
  }
};
