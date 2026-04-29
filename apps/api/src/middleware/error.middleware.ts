import type { ErrorRequestHandler } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    console.error(`[AppError] ${req.method} ${req.path} → ${err.statusCode}: ${err.message}`);
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error(`[UnhandledError] ${req.method} ${req.path}`, err);
  res.status(500).json({ error: 'Error interno del servidor' });
};
