import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import categoryRoutes from "./routes/category.routes";

const app: Application = express();

// Middleware

// cors configuration added
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", 
    credentials: true, 
    optionsSuccessStatus: 200
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cookie parser added for send to fronted cookie
app.use(cookieParser());

// Rotes
app.use("/api/category",categoryRoutes);

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Root endpoint
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Finance Manager Backend API" });
});

export default app;
