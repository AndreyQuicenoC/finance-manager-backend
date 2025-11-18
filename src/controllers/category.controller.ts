import { Request, Response } from "express";
import prisma from "../config/db";

/**
 * Creates a new category.
 *
 * @async
 * @route POST /categories
 * @param {Request} req - Express request object containing the category data.
 * @param {string} req.body.tipo - Category name or type.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>}
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { tipo } = req.body;

    if (!tipo || typeof tipo !== 'string') {
      return res.status(400).json({ error: "Falta el campo 'tipo'" });
    }

    const category = await prisma.category.create({
      data: {
        tipo: tipo as string,
      },
    });

    return res
      .status(201)
      .json({ message: "Categoría creada exitosamente", category });
  } catch (error) {
    console.error("Error creando categoría:", error);
    return res.status(500).json({ error: "Error al crear categoría" });
  }
};

/**
 * Retrieves all categories, including their associated accounts.
 *
 * @async
 * @route GET /categories
 * @param {Request} _req - Express request object (unused).
 * @param {Response} res - Express response object containing the list of categories.
 * @returns {Promise<void>}
 */
export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { accounts: true },
    });

    res.json(categories);
  } catch (error) {
    console.error("Error obteniendo categorías:", error);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
};

/**
 * Retrieves a category by its ID.
 *
 * @async
 * @route GET /categories/:id
 * @param {Request} req - Express request object containing the category ID.
 * @param {string} req.params.id - Category ID.
 * @param {Response} res - Express response object containing the category data.
 * @returns {Promise<void>}
 */
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
      include: { accounts: true },
    });

    if (!category) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    return res.json(category);
  } catch (error) {
    console.error("Error obteniendo categoría:", error);
    return res.status(500).json({ error: "Error al obtener categoría" });
  }
};

/**
 * Updates an existing category.
 *
 * Only the provided fields will be updated.
 *
 * @async
 * @route PUT /categories/:id
 * @param {Request} req - Express request object containing update data.
 * @param {string} req.params.id - Category ID.
 * @param {string} [req.body.tipo] - New value for the category type.
 * @param {Response} res - Express response object containing the updated category.
 * @returns {Promise<void>}
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tipo } = req.body;

    const existing = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    const updated = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        tipo: tipo ?? existing.tipo,
      },
    });

    return res.json({ message: "Categoría actualizada", category: updated });
  } catch (error) {
    console.error("Error actualizando categoría:", error);
    return res.status(500).json({ error: "Error al actualizar categoría" });
  }
};

/**
 * Deletes a category by its ID.
 *
 * @async
 * @route DELETE /categories/:id
 * @param {Request} req - Express request object containing the category ID.
 * @param {string} req.params.id - Category ID.
 * @param {Response} res - Express response object confirming the deletion.
 * @returns {Promise<void>}
 */
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Categoría eliminada correctamente" });
  } catch (error) {
    console.error("Error eliminando categoría:", error);
    res.status(500).json({ error: "Error al eliminar categoría" });
  }
};
