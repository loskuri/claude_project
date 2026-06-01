import type { Request, Response, NextFunction } from 'express';
import { logError, logInfo, logWarn } from '../shared/log.js';

const SKIP_PATHS = new Set(['/health']);

export function requestLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  const path = req.originalUrl.split('?')[0];
  if (SKIP_PATHS.has(path)) {
    next();
    return;
  }

  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const meta: Record<string, unknown> = {
      method: req.method,
      path,
      status: res.statusCode,
      durationMs,
      ...(req.user?.id ? { userId: req.user.id } : {}),
    };

    if (res.statusCode >= 500) {
      logError('http', 'request completed', meta);
    } else if (res.statusCode >= 400) {
      logWarn('http', 'request completed', meta);
    } else {
      logInfo('http', 'request completed', meta);
    }
  });

  next();
}
