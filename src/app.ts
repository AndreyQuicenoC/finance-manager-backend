/**
 * @fileoverview Express application configuration and setup.
 * @module app
 * @requires express
 * @requires cors
 * @requires ./routes/account.routes
 * @requires ./routes/auth.routes
 * 
 * @description
 * Configures Express application with:
 * - CORS middleware (configured for production/development)
 * - JSON and URL-encoded body parsers
 * - Authentication routes (/api/auth)
 * - Account routes (/api/account)
 * - Health check endpoint (/health)
 * - Root endpoint (/)
 */

import express, { Application, Request, Response } from "express";
import cors from "cors";
import accountRoutes from "./routes/account.routes";
import authRoutes from "./routes/auth.routes";

const app: Application = express();

/**
 * CORS configuration for cross-origin requests.
 * 
 * @constant {Object} corsOptions
 * @property {string|string[]} origin - Allowed origin(s) based on environment
 * @property {boolean} credentials - Allow cookies to be sent
 * @property {number} optionsSuccessStatus - HTTP status for OPTIONS requests
 * 
 * @description
 * - Production: Uses FRONTEND_URL_PROD or CORS_ORIGIN from environment
 * - Development: Uses FRONTEND_URL_DEV or defaults to http://localhost:3000
 */
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL_PROD || process.env.CORS_ORIGIN
    : process.env.FRONTEND_URL_DEV || 'http://localhost:3000',
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);

/**
 * Health check endpoint.
 * 
 * @route GET /health
 * @description Check if server is running
 * @access Public
 * @returns {Object} Server status
 * 
 * @example
 * // Response (200):
 * {
 *   "status": "ok",
 *   "message": "Server is running"
 * }
 */
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

/**
 * Root endpoint.
 * 
 * @route GET /
 * @description API information endpoint
 * @access Public
 * @returns {Object} API name
 * 
 * @example
 * // Response (200):
 * {
 *   "message": "Finance Manager Backend API"
 * }
 */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Finance Manager Backend API" });
});

export default app;
