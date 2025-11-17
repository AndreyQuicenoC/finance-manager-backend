/**
 * @fileoverview JWT Token verification middleware for Express.js routes.
 * Provides authentication functionality by validating JWT tokens in request headers.
 * @author Tudu Development Team
 * @version 1.0.0
 * @requires jsonwebtoken
 */

import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

// Extend Express Request interface to include 'user' property
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string;
      email: string;
    };
  }
}

// functions for generate tokens, a token for access, and other one for refresh the access one

export function generateAccessToken(userId: number, email: string) {
  const ACCESS_SECRET = process.env.ACCESS_SECRET as string;
  return jwt.sign({ id: userId, email }, ACCESS_SECRET, { expiresIn: "15m" });
}

// Genera refresh tokens (válidos por 7 días)
export function generateRefreshToken(userId: number) {
  const REFRESH_SECRET = process.env.REFRESH_SECRET as string;
  return jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: "7d" });
}

/**
 * Middleware function to verify and validate JWT tokens from HTTP-only cookies.
 * Extracts token from cookie, verifies it, and adds user data to request.
 * Must run BEFORE the request reaches protected route controllers.
 *
 * @function verifyToken
 * @param {Object} req - Express request object
 * @param {Object} req.cookies - Request cookies object
 * @param {string} req.cookies.authToken - JWT token stored in HTTP-only cookie
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with error message or calls next() if valid
 * @description Validates JWT token from cookie and adds decoded user info to req.user
 *
 * @example
 * // Usage in routes:
 * router.get('/protected', verifyToken, protectedController);
 *
 * @example
 * // After successful verification, req.user contains:
 * req.user = {
 *   userId: "userId123",
 *   email: "user@example.com",
 *   iat: 1672531200,
 *   exp: 1672617600
 * }
 */
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    /**
     * Extract JWT token from HTTP-only cookie.
     * Cookie name must match what's set in login route.
     */
    const token = req.cookies.authToken;

    /**
     * Check if token exists in cookies.
     * Return 401 if missing.
     */
    if (!token) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    /**
     * Verify and decode JWT token using secret.
     * Throws error if token is invalid or expired.
     */
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    /**
     * Add decoded user information to request object.
     * Makes user data available in subsequent middleware/controllers.
     */
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "userId" in decoded &&
      "email" in decoded
    ) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };
    } else {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    /**
     * Continue to next middleware or route handler.
     */
    return next();
  } catch (error) {
    /**
     * Handle specific JWT errors with appropriate responses.
     */
    if (error && typeof error === "object" && "name" in error) {
      if ((error as { name: string }).name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token has expired" });
      } else if ((error as { name: string }).name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      }
    }
    return res.status(500).json({ message: "Inténtalo de nuevo más tarde" });
  }
};

/**
 * Export the verifyToken middleware function.
 * @type {Function}
 * @see verifyToken
 */
export default verifyToken;
