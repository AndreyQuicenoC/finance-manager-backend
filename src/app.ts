import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import tagPocketRoutes from "./routes/tagPocket.routes";

const app: Application = express();

// Middleware

// CORS configuration with whitelist for security
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cookie parser added for send to fronted cookie
app.use(cookieParser());

// Rotes
app.use("/api/tag",tagPocketRoutes);


// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Root endpoint
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Finance Manager Backend API" });
});

export default app;
