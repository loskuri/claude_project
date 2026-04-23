import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import * as progressService from './progress.service.js';

const router = Router();
router.use(authMiddleware);

const logWeightSchema = z.object({
  weightKg: z.number().positive().max(500),
  date: z.string().datetime().optional(),
  bodyFatPct: z.number().min(1).max(60).optional(),
  notes: z.string().max(500).optional(),
});

router.post('/weight', validateBody(logWeightSchema), async (req, res, next) => {
  try {
    const log = await progressService.logWeight(req.user!.id, req.body);
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
});

router.get('/weight', async (req, res, next) => {
  try {
    const { from, to } = req.query as { from?: string; to?: string };
    const logs = await progressService.getWeightLogs(req.user!.id, from, to);
    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

export default router;
