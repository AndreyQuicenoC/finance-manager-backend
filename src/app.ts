import express, { Application, Request, Response } from 'express';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Finance Manager Backend API' });
});

export default app;
