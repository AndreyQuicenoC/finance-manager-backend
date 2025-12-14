/**
 * @fileoverview Goal controller for managing financial goals (CRUD operations).
 * @module controllers/goal.controller
 * @requires express
 * @requires ../config/db
 */

import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/db";

/**
 * Create a new financial goal with its target (account or tag).
 * 
 * @async
 * @function createGoal
 * @param {Request} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.description - Brief description of the financial goal (required)
 * @param {string} req.body.init_date - Start date for tracking progress (required, ISO 8601 format)
 * @param {string} req.body.final_date - End date for the goal (required, ISO 8601 format)
 * @param {number} req.body.max_money - Maximum amount of money to spend (required)
 * @param {number} [req.body.actual_progress] - Current progress amount (optional, default: 0)
 * @param {Object} req.body.target - Target object to link goal (required)
 * @param {string} req.body.target.targetType - Type of target: "account" or "tag" (required)
 * @param {number} req.body.target.targetId - ID of the account or tag (required)
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with created goal data
 * 
 * @example
 * // Request body:
 * {
 *   "description": "No gastar más de $500 en restaurantes este mes",
 *   "init_date": "2024-01-01T00:00:00.000Z",
 *   "final_date": "2024-01-31T23:59:59.999Z",
 *   "max_money": 500.00,
 *   "actual_progress": 0,
 *   "target": {
 *     "targetType": "tag",
 *     "targetId": 5
 *   }
 * }
 * 
 * @example
 * // Success response (201):
 * {
 *   "message": "Meta creada exitosamente",
 *   "goal": {
 *     "id": 1,
 *     "description": "No gastar más de $500 en restaurantes este mes",
 *     "init_date": "2024-01-01T00:00:00.000Z",
 *     "final_date": "2024-01-31T23:59:59.999Z",
 *     "max_money": 500.00,
 *     "actual_progress": 0,
 *     "target": [
 *       {
 *         "id": 1,
 *         "goalId": 1,
 *         "targetType": "tag",
 *         "targetId": 5
 *       }
 *     ]
 *   }
 * }
 * 
 * @throws {400} If required fields are missing or target is invalid
 * @throws {401} If user is not authenticated
 * @throws {500} If server error occurs
 * 
 * @requires verifyToken middleware
 */
export const createGoal = async (req: Request, res: Response) => {
  try {
    const { description, init_date, final_date, max_money, actual_progress, target } = req.body;

    if (!description || !init_date || !final_date || max_money === undefined) {
      return res.status(400).json({ 
        error: "Faltan campos requeridos: description, init_date, final_date, max_money" 
      });
    }

    if (!target || typeof target !== 'object') {
      return res.status(400).json({ 
        error: "Debe proporcionar un target (cuenta o tag)" 
      });
    }

    // Validate target
    if (!target.targetType || !target.targetId) {
      return res.status(400).json({ 
        error: "El target debe tener targetType y targetId" 
      });
    }
    
    if (target.targetType !== "account" && target.targetType !== "tag") {
      return res.status(400).json({ 
        error: "targetType debe ser 'account' o 'tag'" 
      });
    }

    const goal = await prisma.goal.create({
      data: {
        description,
        init_date: new Date(init_date),
        final_date: new Date(final_date),
        max_money: Number(max_money),
        actual_progress: actual_progress !== undefined ? Number(actual_progress) : 0,
        target: {
          create: {
            targetType: target.targetType,
            targetId: Number(target.targetId),
          },
        },
      },
      include: {
        target: true,
      },
    });

    return res.status(201).json({ message: "Meta creada exitosamente", goal });
  } catch (error) {
    console.error("Error creando meta:", error);
    return res.status(500).json({ error: "Error al crear meta" });
  }
};

/**
 * Get all financial goals with their target.
 * 
 * @async
 * @function getAllGoals
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with array of goals including target
 * 
 * @description
 * Retrieves all goals in the system, including related target information.
 * 
 * @example
 * // Request URL: GET /api/goal
 * 
 * @example
 * // Success response (200):
 * [
 *   {
 *     "id": 1,
 *     "description": "No gastar más de $500 en restaurantes",
 *     "init_date": "2024-01-01T00:00:00.000Z",
 *     "final_date": "2024-01-31T23:59:59.999Z",
 *     "max_money": 500.00,
 *     "actual_progress": 150.00,
 *     "target": [
 *       {
 *         "id": 1,
 *         "goalId": 1,
 *         "targetType": "tag",
 *         "targetId": 5
 *       }
 *     ]
 *   }
 * ]
 * 
 * @throws {401} If user is not authenticated
 * @throws {500} If server error occurs
 * 
 * @requires verifyToken middleware
 */
export const getAllGoals = async (res: Response) => {
  try {
    const goals = await prisma.goal.findMany({
      include: { target: true },
    });

    return res.json(goals);
  } catch (error) {
    console.error("Error obteniendo metas:", error);
    return res.status(500).json({ error: "Error al obtener metas" });
  }
};

/**
 * Get all financial goals for a specific user.
 * 
 * @async
 * @function getGoalsByUser
 * @param {Request} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.userId - User ID to get goals for (required)
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with array of goals including their GoalTarget entries
 * 
 * @description
 * Retrieves all goals associated with a user's accounts or tags.
 * The function:
 * - obtains the IDs of the user's accounts,
 * - obtains the IDs of the tags belonging to those accounts,
 * - searches for goals that have at least one GoalTarget where:
 *     - targetType = ‘account’ and targetId is in the list of accountIds, or
 *     - targetType = ‘tag’ and targetId is in the list of tagIds.
 * If the user has no accounts or tags, it returns an empty array.

Translated with DeepL.com (free version)
 * 
 * @example
 * // Request URL: GET /api/goal/user/1
 * 
 * @example
 * // Success response (200):
 * [
 *   {
 *     "id": 1,
 *     "description": "No gastar más de $500 en restaurantes",
 *     "init_date": "2024-01-01T00:00:00.000Z",
 *     "final_date": "2024-01-31T23:59:59.999Z",
 *     "max_money": 500.00,
 *     "actual_progress": 150.00,
 *     "target": [
 *       {
 *         "id": 1,
 *         "goalId": 1,
 *         "targetType": "tag",
 *         "targetId": 5
 *       }
 *     ]
 *   }
 * ]
 * 
 * @throws {400} If userId is invalid
 * @throws {500} If server error occurs
 * 
 * @requires verifyToken middleware
 */
export const getGoalsByUser = async (req: Request, res: Response) => {
  try {
    const userIdNum = Number(req.params.userId);
    if (Number.isNaN(userIdNum)) {
      return res.status(400).json({ error: "userId inválido" });
    }

    // Obtener los ids de las cuentas del usuario
    const accounts = await prisma.account.findMany({
      where: { userId: userIdNum },
      select: { id: true },
    });
    const accountIds = accounts.map(a => a.id);

    // Obtener los ids de los tags que pertenecen a esas cuentas
    const tagIds: number[] = accountIds.length
      ? (await prisma.tagPocket.findMany({
          where: { accountId: { in: accountIds } },
          select: { id: true },
        })).map(t => t.id)
      : [];

    // Construir condiciones OR sólo con listas no vacías
    const orConditions: any[] = [];
    if (accountIds.length) {
      orConditions.push({ targetType: "account", targetId: { in: accountIds } });
    }
    if (tagIds.length) {
      orConditions.push({ targetType: "tag", targetId: { in: tagIds } });
    }

    if (orConditions.length === 0) {
      return res.json([]); // usuario sin cuentas ni tags -> sin goals
    }

    const goals = await prisma.goal.findMany({
      where: {
        target: {
          some: {
            OR: orConditions,
          },
        },
      },
      include: { target: true },
    });

    return res.json(goals);
  } catch (error) {
    console.error("Error obteniendo metas del usuario:", error);
    return res.status(500).json({ error: "Error al obtener metas del usuario" });
  }
};

/**
 * Get a specific financial goal by ID.
 * 
 * @async
 * @function getGoalById
 * @param {Request} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Goal ID to retrieve (required)
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with goal data including target
 * 
 * @example
 * // Request URL: GET /api/goal/:id
 * 
 * @example
 * // Success response (200):
 * {
 *   "id": 1,
 *   "description": "No gastar más de $500 en restaurantes",
 *   "init_date": "2024-01-01T00:00:00.000Z",
 *   "final_date": "2024-01-31T23:59:59.999Z",
 *   "max_money": 500.00,
 *   "actual_progress": 150.00,
 *   "target": [
 *     {
 *       "id": 1,
 *       "goalId": 1,
 *       "targetType": "tag",
 *       "targetId": 5
 *     }
 *   ]
 * }
 * 
 * @throws {401} If user is not authenticated
 * @throws {404} If goal is not found
 * @throws {500} If server error occurs
 * 
 * @requires verifyToken middleware
 */
export const getGoalById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const goal = await prisma.goal.findUnique({
      where: { id: Number(id) },
      include: { target: true },
    });

    if (!goal) {
      return res.status(404).json({ error: "Meta no encontrada" });
    }

    return res.json(goal);
  } catch (error) {
    console.error("Error obteniendo meta:", error);
    return res.status(500).json({ error: "Error al obtener meta" });
  }
};

/**
 * Update an existing financial goal and optionally its target.
 * 
 * @async
 * @function updateGoal
 * @param {Request} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Goal ID to update (required)
 * @param {Object} req.body - Request body
 * @param {string} [req.body.description] - New description (optional)
 * @param {string} [req.body.init_date] - New start date (optional, ISO 8601 format)
 * @param {string} [req.body.final_date] - New end date (optional, ISO 8601 format)
 * @param {number} [req.body.max_money] - New maximum spending limit (optional)
 * @param {number} [req.body.actual_progress] - New progress amount (optional)
 * @param {Object} [req.body.target] - New target object (optional, replaces existing)
 * @param {string} req.body.target.targetType - Type: "account" or "tag"
 * @param {number} req.body.target.targetId - ID of the account or tag
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with updated goal data
 * 
 * @description
 * Updates goal fields. Only provided fields are updated; others remain unchanged.
 * If target is provided, it replaces the existing target for the goal.
 * 
 * @example
 * // Request URL: PUT /api/goal/:id
 * // Request body:
 * {
 *   "description": "No gastar más de $300 en restaurantes",
 *   "max_money": 300.00,
 *   "actual_progress": 120.00
 * }
 * 
 * @example
 * // Success response (200):
 * {
 *   "message": "Meta actualizada",
 *   "goal": {
 *     "id": 1,
 *     "description": "No gastar más de $300 en restaurantes",
 *     "init_date": "2024-01-01T00:00:00.000Z",
 *     "final_date": "2024-01-31T23:59:59.999Z",
 *     "max_money": 300.00,
 *     "actual_progress": 120.00,
 *     "target": [...]
 *   }
 * }
 * 
 * @throws {400} If goal ID is missing or invalid target data
 * @throws {401} If user is not authenticated
 * @throws {404} If goal is not found
 * @throws {500} If server error occurs
 * 
 * @requires verifyToken middleware
 */
export const updateGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, init_date, final_date, max_money, actual_progress, target } = req.body;

    const existing = await prisma.goal.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: "Meta no encontrada" });
    }

    if (target !== undefined) {
      if (typeof target !== 'object') {
        return res.status(400).json({ error: "El target debe ser un objeto" });
      }
      if (target.targetType !== "account" && target.targetType !== "tag") {
        return res.status(400).json({ error: "targetType debe ser 'account' o 'tag'" });
      }
      if (target.targetId === undefined || Number.isNaN(Number(target.targetId))) {
        return res.status(400).json({ error: "targetId debe ser un número válido" });
      }
    }

    const updateData: Partial<Record<string, unknown>> = {};

    if (description !== undefined) updateData.description = description;
    if (init_date !== undefined) updateData.init_date = new Date(init_date);
    if (final_date !== undefined) updateData.final_date = new Date(final_date);
    if (max_money !== undefined) {
      const parsed = Number(max_money);
      if (Number.isNaN(parsed)) return res.status(400).json({ error: "max_money debe ser un número válido" });
      updateData.max_money = parsed; // Prisma Float <- number
    }
    if (actual_progress !== undefined) {
      const parsed = Number(actual_progress);
      if (Number.isNaN(parsed)) return res.status(400).json({ error: "actual_progress debe ser un número válido" });
      updateData.actual_progress = parsed;
    }

    if (target) {
      updateData.target = {
        deleteMany: {},
        create: {
          targetType: target.targetType,
          targetId: Number(target.targetId),
        },
      };
    }

    const updated = await prisma.goal.update({
      where: { id: Number(id) },
      data: updateData as Prisma.GoalUpdateInput,
      include: { target: true },
    });

    return res.json({ message: "Meta actualizada", goal: updated });
  } catch (error) {
    console.error("Error actualizando meta:", error);
    return res.status(500).json({ error: "Error al actualizar meta" });
  }
};

/**
 * Update the actual progress of a financial goal.
 * 
 * @async
 * @function updateGoalProgress
 * @param {Request} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Goal ID to update (required)
 * @param {Object} req.body - Request body
 * @param {number} req.body.actual_progress - New progress amount (required)
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with updated goal data
 * 
 * @description
 * Simplified endpoint specifically for updating the progress tracking of a goal.
 * 
 * @example
 * // Request URL: PATCH /api/goal/:id/progress
 * // Request body:
 * {
 *   "actual_progress": 250.00
 * }
 * 
 * @example
 * // Success response (200):
 * {
 *   "message": "Progreso actualizado",
 *   "goal": {
 *     "id": 1,
 *     "description": "No gastar más de $500 en restaurantes",
 *     "actual_progress": 250.00,
 *     "max_money": 500.00,
 *     ...
 *   }
 * }
 * 
 * @throws {400} If actual_progress is missing
 * @throws {401} If user is not authenticated
 * @throws {404} If goal is not found
 * @throws {500} If server error occurs
 * 
 * @requires verifyToken middleware
 */
export const updateGoalProgress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { actual_progress } = req.body;

    if (actual_progress === undefined) {
      return res.status(400).json({ error: "Falta actual_progress" });
    }

    const existing = await prisma.goal.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: "Meta no encontrada" });
    }

    const updated = await prisma.goal.update({
      where: { id: Number(id) },
      data: { actual_progress: Number(actual_progress) },
      include: { target: true },
    });

    return res.json({ message: "Progreso actualizado", goal: updated });
  } catch (error) {
    console.error("Error actualizando progreso:", error);
    return res.status(500).json({ error: "Error al actualizar progreso" });
  }
};

/**
 * Delete a financial goal and its associated target.
 * 
 * @async
 * @function deleteGoal
 * @param {Request} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Goal ID to delete (required)
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response confirming deletion
 * 
 * @description
 * Permanently deletes a goal and its related target from the database.
 * 
 * @example
 * // Request URL: DELETE /api/goal/:id
 * 
 * @example
 * // Success response (200):
 * {
 *   "message": "Meta eliminada"
 * }
 * 
 * @throws {400} If goal ID is missing
 * @throws {401} If user is not authenticated
 * @throws {500} If server error occurs or goal doesn't exist
 * 
 * @requires verifyToken middleware
 */
export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.goal.delete({ where: { id: Number(id) } });
    return res.json({ message: "Meta eliminada" });
  } catch (error) {
    console.error("Error eliminando meta:", error);
    return res.status(500).json({ error: "Error al eliminar meta" });
  }
};