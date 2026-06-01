import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorMiddleware } from './middleware/error.middleware.js';
import { requestLogMiddleware } from './middleware/request-log.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import nutritionRoutes from './modules/nutrition/nutrition.routes.js';
import dietRoutes from './modules/diet/diet.routes.js';
import foodsRoutes from './modules/foods/foods.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import recipesRoutes from './modules/recipes/recipes.routes.js';
import progressRoutes from './modules/progress/progress.routes.js';
import mealLogsRoutes from './modules/meal-logs/meal-logs.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  const devCorsOrigins = [
    'http://localhost:3000',
    'http://localhost:4003',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4003',
    'http://localhost:8081',
    'http://localhost:19006',
    ...(process.env.ALLOWED_ORIGINS?.split(',') ?? [])
      .map((o) => o.trim())
      .filter(Boolean),
  ];
  const prodCorsOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);

  app.use(
    cors({
      origin: process.env.NODE_ENV === 'production' ? prodCorsOrigins : devCorsOrigins,
      credentials: true,
    }),
  );

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Esperá 15 minutos.' },
  });

  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogMiddleware);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const api = express.Router();
  api.use('/auth/login', authLimiter);
  api.use('/auth/register', authLimiter);
  api.use('/auth', authRoutes);
  api.use('/users', usersRoutes);
  api.use('/nutrition', nutritionRoutes);
  api.use('/diet', dietRoutes);
  api.use('/foods', foodsRoutes);
  api.use('/inventory', inventoryRoutes);
  api.use('/recipes', recipesRoutes);
  api.use('/progress', progressRoutes);
  api.use('/meal-logs', mealLogsRoutes);

  app.use('/api/v1', api);

  app.use(errorMiddleware);

  return app;
}
