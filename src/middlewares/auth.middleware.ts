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
    // Ensure cookies object exists (cookie-parser should handle this, but add safety check)
    const token = req.cookies?.authToken;

    /**
     * Check if token exists in cookies.
     * Return 401 if missing.
     */
    if (!token) {
      return res.status(401).json({ message: "Autenticación requerida" });
    }

    /**
     * Check if JWT_SECRET is configured.
     */
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("❌ JWT_SECRET no está configurado");
      return res.status(500).json({ message: "Error de configuración del servidor" });
    }

    /**
     * Verify and decode JWT token using secret.
     * Throws error if token is invalid or expired.
     */
    let decoded: string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      // Handle JWT-specific errors
      if (jwtError && typeof jwtError === "object" && "name" in jwtError) {
        const errorName = (jwtError as { name: string }).name;
        if (errorName === "TokenExpiredError") {
          return res.status(401).json({ message: "Token has expired" });
        } else if (errorName === "JsonWebTokenError") {
          return res.status(401).json({ message: "Invalid token" });
        }
      }
      throw jwtError; // Re-throw if it's not a known JWT error
    }

    /**
     * Add decoded user information to request object.
     * Makes user data available in subsequent middleware/controllers.
     */
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "userId" in decoded
    ) {
      // Keep userId as number since that's what the token has and what the database expects
      const userId = typeof decoded.userId === "number" 
        ? decoded.userId 
        : Number(decoded.userId);
      
      req.user = {
        userId: String(userId), // Convert to string for the interface
        email: "email" in decoded ? String(decoded.email) : "",
      };
      
      console.log("✅ [verifyToken] Token verificado, userId:", userId);
    } else {
      console.error("❌ [verifyToken] Token payload inválido:", decoded);
      return res.status(401).json({ message: "Invalid token payload" });
    }

    /**
     * Continue to next middleware or route handler.
     */
    return next();
  } catch (error) {
    /**
     * Handle unexpected errors.
     */
    console.error("Error in verifyToken middleware:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
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
