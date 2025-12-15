/**
 * @fileoverview Authentication routes for user management and authentication.
 * @module routes/auth.routes
 * @requires express
 * @requires ../controllers/auth.controller
 * @requires ../validators/auth.validator
 * @requires ../middlewares/auth.middleware
 * 
 * @description
 * Defines all authentication-related endpoints:
 * - POST /api/auth/signup - Register new user
 * - POST /api/auth/login - User login
 * - POST /api/auth/logout - User logout (requires auth)
 * - GET /api/auth/profile - Get user profile (requires auth)
 * - POST /api/auth/recover - Request password recovery
 * - POST /api/auth/reset/:token - Reset password with token
 */

import { Router } from "express";
import {
  signup,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  recoverPass,
  resetPass,
  adminLogin,
} from "../controllers/auth.controller";
import {
  signupValidation,
  loginValidation,
  validate,
} from "../validators/auth.validator";
import verifyToken from "../middlewares/auth.middleware";

const router = Router();

/**
 * @route POST /api/auth/signup
 * @description Register a new user account
 * @access Public
 * @middleware signupValidation, validate
 */
router.post("/signup", signupValidation, validate, signup);

/**
 * @route POST /api/auth/login
 * @description Authenticate user and create session
 * @access Public
 * @middleware loginValidation, validate
 */
router.post("/login", loginValidation, validate, login);

/**
 * @route POST /api/auth/admin/login
 * @description Authenticate admin user and create admin session
 * @access Public (pero solo usuarios con rol admin/super_admin obtendrán token válido)
 * @middleware loginValidation, validate
 */
router.post("/admin/login", loginValidation, validate, adminLogin);

/**
 * @route POST /api/auth/logout
 * @description Logout user and clear session cookie
 * @access Private (requires authentication)
 * @middleware verifyToken
 */
router.post("/logout", verifyToken, logout);

/**
 * @route GET /api/auth/profile
 * @description Get authenticated user's profile information
 * @access Private (requires authentication)
 * @middleware verifyToken
 */
router.get("/profile", verifyToken, getProfile);

/**
 * @route PUT /api/auth/profile
 * @description Update authenticated user's profile (nickname and/or email)
 * @access Private (requires authentication)
 * @middleware verifyToken
 */
router.put("/profile", verifyToken, updateProfile);

/**
 * @route POST /api/auth/change-password
 * @description Change user's password
 * @access Private (requires authentication)
 * @middleware verifyToken
 */
router.post("/change-password", verifyToken, changePassword);

/**
 * @route DELETE /api/auth/account
 * @description Delete user's account permanently
 * @access Private (requires authentication)
 * @middleware verifyToken
 */
router.delete("/account", verifyToken, deleteAccount);

/**
 * @route POST /api/auth/recover
 * @description Request password recovery email
 * @access Public
 */
router.post("/recover", recoverPass);

/**
 * @route POST /api/auth/reset/:token
 * @description Reset password using token from recovery email
 * @access Public
 * @param {string} token - JWT reset token from recovery email
 */
router.post("/reset/:token", resetPass);

export default router;
