/**
 * @fileoverview Account routes for managing financial accounts.
 * @module routes/account.routes
 * @requires express
 * @requires ../controllers/account.controller
 * @requires ../middlewares/auth.middleware
 * 
 * @description
 * Defines all account-related endpoints (all require authentication):
 * - POST /api/account - Create new account
 * - GET /api/account/:userId - Get all accounts for a user
 * - PUT /api/account/:id - Update an account
 * - DELETE /api/account/:id - Delete an account
 */

import { Router } from "express";

import {
    createAccount,
    getAccountsByUser,
    updateAccount,
    deleteAccount
} from "../controllers/account.controller";

import verifyToken from "../middlewares/auth.middleware";

const router = Router();

/**
 * @route POST /api/account
 * @description Create a new financial account
 * @access Private (requires authentication)
 * @middleware verifyToken
 */
router.post("/", verifyToken, createAccount);

/**
 * @route GET /api/accounts
 * @description Get all accounts (optionally filtered by userId query parameter)
 * @access Private (requires authentication)
 * @middleware verifyToken
 * @query {number} [userId] - Optional user ID to filter accounts
 */
router.get("/", verifyToken, getAccountsByUser);

/**
 * @route PUT /api/account/:id
 * @description Update an existing account
 * @access Private (requires authentication)
 * @middleware verifyToken
 * @param {string} id - Account ID to update
 */
router.put("/:id", verifyToken, updateAccount);

/**
 * @route DELETE /api/account/:id
 * @description Delete an account
 * @access Private (requires authentication)
 * @middleware verifyToken
 * @param {string} id - Account ID to delete
 */
router.delete("/:id", verifyToken, deleteAccount);


export default router;
