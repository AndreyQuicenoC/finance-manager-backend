/**
 * @fileoverview Goal routes for managing financial goals.
 * @module routes/goal.routes
 * @requires express
 * @requires ../controllers/goal.controller
 * @requires ../middlewares/auth.middleware
 * 
 * @description
 * Defines all goal-related endpoints (all require authentication):
 * - POST /api/goal - Create new goal
 * - GET /api/goal - Get all goals
 * - GET /api/goal/user/:userId - Get all goals for a user
 * - GET /api/goal/:id - Get a specific goal by ID
 * - PUT /api/goal/:id - Update a goal
 * - PATCH /api/goal/:id/progress - Update goal progress
 * - DELETE /api/goal/:id - Delete a goal
 */

import { Router } from "express";

import {
  createGoal,
  getAllGoals,
  getGoalsByUser,
  getGoalById,
  updateGoal,
  updateGoalProgress,
  deleteGoal
} from "../controllers/goal.controller";

import verifyToken from "../middlewares/auth.middleware";

const router = Router();

/**
 * @route POST /api/goal
 * @description Create a new financial goal
 * @access Private (requires authentication)
 * @middleware verifyToken
 */
router.post("/", verifyToken, createGoal);

/**
 * @route GET /api/goal
 * @description Get all goals in the system
 * @access Private (requires authentication)
 * @middleware verifyToken
 */
router.get("/", verifyToken, getAllGoals);

/**
 * @route GET /api/goal/user/:userId
 * @description Get all goals for a specific user
 * @access Private (requires authentication)
 * @middleware verifyToken
 * @param {string} userId - User ID to get goals for
 */
router.get("/user/:userId", verifyToken, getGoalsByUser);

/**
 * @route GET /api/goal/:id
 * @description Get a specific goal by ID
 * @access Private (requires authentication)
 * @middleware verifyToken
 * @param {string} id - Goal ID to retrieve
 */
router.get("/:id", verifyToken, getGoalById);

/**
 * @route PUT /api/goal/:id
 * @description Update an existing goal
 * @access Private (requires authentication)
 * @middleware verifyToken
 * @param {string} id - Goal ID to update
 */
router.put("/:id", verifyToken, updateGoal);

/**
 * @route PATCH /api/goal/:id/progress
 * @description Update the actual progress of a goal
 * @access Private (requires authentication)
 * @middleware verifyToken
 * @param {string} id - Goal ID to update progress
 */
router.patch("/:id/progress", verifyToken, updateGoalProgress);

/**
 * @route DELETE /api/goal/:id
 * @description Delete a goal
 * @access Private (requires authentication)
 * @middleware verifyToken
 * @param {string} id - Goal ID to delete
 */
router.delete("/:id", verifyToken, deleteGoal);


export default router;