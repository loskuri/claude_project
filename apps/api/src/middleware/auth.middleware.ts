import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, isTokenBlacklisted } from '../shared/token.service.js';
import { AppError } from './error.middleware.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'Token de acceso requerido');
    }

    const token = authHeader.slice(7);

    if (await isTokenBlacklisted(token)) {
      throw new AppError(401, 'Token inválido');
    }

    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError(401, 'Token inválido o expirado'));
    }
  }
}
