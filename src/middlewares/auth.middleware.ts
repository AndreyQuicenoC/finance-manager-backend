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
      /**
       * Optional role of the authenticated user.
       * Used mainly for admin / super-admin middlewares.
       */
      role?: string;
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
 * This middleware is intended for **regular users** and validates tokens
 * stored in the `authToken` cookie using the `JWT_SECRET`.
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
      return res
        .status(500)
        .json({ message: "Error de configuración del servidor" });
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
    if (typeof decoded === "object" && decoded !== null && "userId" in decoded) {
      // Keep userId as number since that's what the token has and what the database expects
      const userId =
        typeof (decoded as jwt.JwtPayload).userId === "number"
          ? (decoded as jwt.JwtPayload).userId
          : Number((decoded as jwt.JwtPayload).userId);

      req.user = {
        userId: String(userId), // Convert to string for the interface
        email:
          "email" in (decoded as jwt.JwtPayload)
            ? String((decoded as jwt.JwtPayload).email)
            : "",
      };
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

/**
 * Internal helper to validate an admin or super-admin token coming from cookies.
 * It reads the token from the `adminAuthToken` cookie and verifies it using a
 * dedicated secret (`JWT_ADMIN_SECRET`). If that env var is not defined it will
 * fall back to `JWT_SECRET` to avoid breaking existing environments, but the
 * recommendation is to configure a separate secret in production.
 */
const verifyAdminTokenBase = (
  req: Request,
  res: Response,
  next: NextFunction,
  options: { requireSuperAdmin: boolean }
) => {
  try {
    const token = req.cookies?.adminAuthToken;

    if (!token) {
      return res.status(401).json({ message: "Autenticación de administrador requerida" });
    }

    const baseSecret = process.env.JWT_SECRET;
    const adminSecret = process.env.JWT_ADMIN_SECRET || baseSecret;

    if (!adminSecret) {
      console.error("❌ JWT_ADMIN_SECRET / JWT_SECRET no están configurados");
      return res
        .status(500)
        .json({ message: "Error de configuración del servidor" });
    }

    let decoded: string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, adminSecret);
    } catch (jwtError) {
      if (jwtError && typeof jwtError === "object" && "name" in jwtError) {
        const errorName = (jwtError as { name: string }).name;
        if (errorName === "TokenExpiredError") {
          return res.status(401).json({ message: "Token has expired" });
        } else if (errorName === "JsonWebTokenError") {
          return res.status(401).json({ message: "Invalid token" });
        }
      }
      throw jwtError;
    }

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("userId" in decoded)
    ) {
      console.error("❌ [verifyAdminTokenBase] Token payload inválido:", decoded);
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const payload = decoded as jwt.JwtPayload & {
      userId: number | string;
      role?: string;
      email?: string;
    };

    const userId =
      typeof payload.userId === "number"
        ? payload.userId
        : Number(payload.userId);

    const role = payload.role;

    req.user = {
      userId: String(userId),
      email: payload.email ?? "",
      role,
    };

    // Role checks
    if (!role) {
      return res.status(403).json({ message: "Rol de administrador requerido" });
    }

    const isAdmin = role === "admin" || role === "super_admin";
    const isSuperAdmin = role === "super_admin";

    if (!isAdmin) {
      return res.status(403).json({ message: "Acceso de administrador requerido" });
    }

    if (options.requireSuperAdmin && !isSuperAdmin) {
      return res.status(403).json({ message: "Acceso de súper administrador requerido" });
    }

    return next();
  } catch (error) {
    console.error("Error in verifyAdminTokenBase middleware:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return res.status(500).json({ message: "Inténtalo de nuevo más tarde" });
  }
};

/**
 * Middleware to protect routes that require an **administrator** (or super-admin).
 * Validates a token generated specifically for admins using a different secret
 * or signature (`JWT_ADMIN_SECRET`) and ensures the payload has role `admin`
 * or `super_admin`.
 */
export const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
  return verifyAdminTokenBase(req, res, next, { requireSuperAdmin: false });
};

/**
 * Middleware to protect routes that require a **super administrator**.
 * It uses the same admin token infrastructure but enforces that the role in
 * the payload is exactly `super_admin`.
 */
export const verifySuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return verifyAdminTokenBase(req, res, next, { requireSuperAdmin: true });
};
