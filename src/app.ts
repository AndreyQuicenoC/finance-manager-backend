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
import cookieParser from "cookie-parser";
import categoryRoutes from "./routes/category.routes";
import transactionsRoutes from "./routes/transactions.routes";
import tagPocketRoutes from "./routes/tagPocket.routes";
import goalRoutes from "./routes/goal.routes";
import chatRoutes from "./routes/chat.routes";
import adminRoutes from "./routes/admin.routes";

const app: Application = express();

/**
 * CORS configuration with security best practices
 * Only allow requests from trusted origins
 */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ✅ cookie parser MUST be before routes that use cookies
app.use(cookieParser());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes); // ✅ Cambiado a plural para coincidir con frontend
app.use("/api/categories", categoryRoutes); // ✅ Cambiado a plural para coincidir con frontend
app.use("/api/transactions", transactionsRoutes);
app.use("/api/tags", tagPocketRoutes); // ✅ Cambiado a plural para coincidir con frontend
app.use("/api/admin", adminRoutes);
app.use("/api/goal", goalRoutes);
app.use("/api/chat", chatRoutes);

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


// Health check endpoint
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
