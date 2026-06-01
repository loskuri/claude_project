import type { ErrorRequestHandler } from 'express';
import { logError } from '../shared/log.js';

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
  const meta = {
    method: req.method,
    path: req.originalUrl,
    ...(req.user?.id ? { userId: req.user.id } : {}),
  };

  if (err instanceof AppError) {
    logError('http', err.message, { ...meta, status: err.statusCode });
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  logError('http', 'Unhandled error', { ...meta, status: 500 }, err);
  res.status(500).json({ error: 'Error interno del servidor' });
};
