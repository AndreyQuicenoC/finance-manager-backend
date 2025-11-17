/**
 * @fileoverview Account controller for managing financial accounts (CRUD operations).
 * @module controllers/account.controller
 * @requires express
 * @requires ../config/db
 */

import { Request, Response } from "express";
import prisma from "../config/db";

/**
 * Create a new financial account for a user.
 * 
 * @async
 * @function createAccount
 * @param {Request} req - Express request object
 * @param {Object} req.body - Request body
 * @param {number} req.body.userId - User ID who owns the account (required)
 * @param {number} req.body.categoryId - Category ID for the account (required)
 * @param {string} [req.body.name] - Account name (optional)
 * @param {number} [req.body.money] - Initial balance (optional, default: 0)
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with created account data
 * 
 * @example
 * // Request body:
 * {
 *   "name": "Cuenta de Ahorros",
 *   "money": 1000.50,
 *   "userId": 1,
 *   "categoryId": 1
 * }
 * 
 * @example
 * // Success response (201):
 * {
 *   "message": "Cuenta creada exitosamente",
 *   "account": {
 *     "id": 1,
 *     "name": "Cuenta de Ahorros",
 *     "money": 1000.50,
 *     "userId": 1,
 *     "categoryId": 1,
 *     "createdAt": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 * 
 * @throws {400} If userId or categoryId is missing
 * @throws {401} If user is not authenticated
 * @throws {500} If server error occurs
 * 
 * @requires verifyToken middleware
 */
export const createAccount = async (req: Request, res: Response) => {
  try {
    const { name, money, userId, categoryId } = req.body;

    if (!userId || !categoryId) {
      return res.status(400).json({ error: "Faltan userId o categoryId" });
    }

    const account = await prisma.account.create({
      data: {
        name,
        money: money ?? 0,
        userId,
        categoryId,
      },
    });

    return res.status(201).json({ message: "Cuenta creada exitosamente", account });
  } catch (error) {
    console.error("Error creando cuenta:", error);
    return res.status(500).json({ error: "Error al crear cuenta" });
  }
};

/**
 * Get all financial accounts for a specific user.
 * 
 * @async
 * @function getAccountsByUser
 * @param {Request} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.userId - User ID to get accounts for (required)
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with array of accounts including category and tags
 * 
 * @description
 * Retrieves all accounts for a user, including related category and tags information.
 * 
 * @example
 * // Request URL: GET /api/account/:userId
 * 
 * @example
 * // Success response (200):
 * [
 *   {
 *     "id": 1,
 *     "name": "Cuenta de Ahorros",
 *     "money": 1000.50,
 *     "userId": 1,
 *     "categoryId": 1,
 *     "category": {
 *       "id": 1,
 *       "tipo": "Ahorros"
 *     },
 *     "tags": [
 *       {
 *         "id": 1,
 *         "name": "principal"
 *       }
 *     ],
 *     "createdAt": "2024-01-01T00:00:00.000Z"
 *   }
 * ]
 * 
 * @throws {401} If user is not authenticated
 * @throws {500} If server error occurs
 * 
 * @requires verifyToken middleware
 */
export const getAccountsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const accounts = await prisma.account.findMany({
      where: { userId: Number(userId) },
      include: { category: true, tags: true },
    });

    res.json(accounts);
  } catch (error) {
    console.error("Error obteniendo cuentas:", error);
    res.status(500).json({ error: "Error al obtener cuentas" });
  }
};

/**
 * Update an existing financial account.
 * 
 * @async
 * @function updateAccount
 * @param {Request} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Account ID to update (required)
 * @param {Object} req.body - Request body
 * @param {string} [req.body.name] - New account name (optional)
 * @param {number} [req.body.money] - New balance (optional)
 * @param {number} [req.body.categoryId] - New category ID (optional)
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with updated account data
 * 
 * @description
 * Updates account fields. Only provided fields are updated; others remain unchanged.
 * 
 * @example
 * // Request URL: PUT /api/account/:id
 * // Request body:
 * {
 *   "name": "Cuenta Actualizada",
 *   "money": 2000.00
 * }
 * 
 * @example
 * // Success response (200):
 * {
 *   "message": "Cuenta actualizada",
 *   "account": {
 *     "id": 1,
 *     "name": "Cuenta Actualizada",
 *     "money": 2000.00,
 *     "userId": 1,
 *     "categoryId": 1,
 *     "createdAt": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 * 
 * @throws {400} If account ID is missing
 * @throws {401} If user is not authenticated
 * @throws {404} If account is not found
 * @throws {500} If server error occurs
 * 
 * @requires verifyToken middleware
 */
export const updateAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, money, categoryId } = req.body;

    // Search for existing account
    const existing = await prisma.account.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: "Cuenta no encontrada" });
    }

    const updated = await prisma.account.update({
      where: { id: Number(id) },
      data: {
        name: name ?? existing.name,
        money: money !== undefined ? money : existing.money,
        categoryId: categoryId ?? existing.categoryId,
      },
    });

    return res.json({ message: "Cuenta actualizada", account: updated });
  } catch (error) {
    console.error("Error actualizando cuenta:", error);
    return res.status(500).json({ error: "Error al actualizar cuenta" });
  }
};

/**
 * Delete a financial account.
 * 
 * @async
 * @function deleteAccount
 * @param {Request} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Account ID to delete (required)
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response confirming deletion
 * 
 * @description
 * Permanently deletes an account from the database.
 * 
 * @example
 * // Request URL: DELETE /api/account/:id
 * 
 * @example
 * // Success response (200):
 * {
 *   "message": "Cuenta eliminada"
 * }
 * 
 * @throws {400} If account ID is missing
 * @throws {401} If user is not authenticated
 * @throws {500} If server error occurs or account doesn't exist
 * 
 * @requires verifyToken middleware
 */
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.account.delete({ where: { id: Number(id) } });
    res.json({ message: "Cuenta eliminada" });
  } catch (error) {
    console.error("Error eliminando cuenta:", error);
    res.status(500).json({ error: "Error al eliminar cuenta" });
  }
};
