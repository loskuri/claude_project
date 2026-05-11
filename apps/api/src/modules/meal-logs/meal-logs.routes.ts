import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import * as mealLogsService from './meal-logs.service.js';

const router = Router();
router.use(authMiddleware);

function mealLogIdParam(id: string | string[] | undefined): string | undefined {
  if (typeof id === 'string' && id.length > 0) return id;
  if (Array.isArray(id) && typeof id[0] === 'string' && id[0].length > 0) return id[0];
  return undefined;
}

router.post('/from-text', async (req, res, next) => {
  try {
    const { text, date } = req.body as { text?: unknown; date?: unknown };
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ error: 'Se requiere una descripción de la comida' });
      return;
    }
    if (date !== undefined && typeof date !== 'string') {
      res.status(400).json({ error: 'Formato de fecha inválido' });
      return;
    }
    const log = await mealLogsService.logMealFromText(req.user!.id, text.trim(), date as string | undefined);
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
});

router.post('/', validateBody(mealLogsService.logMealSchema), async (req, res, next) => {
  try {
    const log = await mealLogsService.logMeal(req.user!.id, req.body);
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { date } = req.query as { date?: string };
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'El parámetro date debe tener formato YYYY-MM-DD' });
      return;
    }
    const summary = await mealLogsService.getDailySummary(req.user!.id, date);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const { from, to } = req.query as { from?: string; to?: string };
    const isoDay = /^\d{4}-\d{2}-\d{2}$/;
    if (from !== undefined && (typeof from !== 'string' || !isoDay.test(from))) {
      res.status(400).json({ error: 'El parámetro from debe ser YYYY-MM-DD' });
      return;
    }
    if (to !== undefined && (typeof to !== 'string' || !isoDay.test(to))) {
      res.status(400).json({ error: 'El parámetro to debe ser YYYY-MM-DD' });
      return;
    }
    if (from && to && from > to) {
      res.status(400).json({ error: 'from no puede ser posterior a to' });
      return;
    }
    const history = await mealLogsService.getMacroHistory(req.user!.id, from, to);
    res.json({ history });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', validateBody(mealLogsService.updateMealLogSchema), async (req, res, next) => {
  try {
    const id = mealLogIdParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'ID de registro inválido' });
      return;
    }
    const log = await mealLogsService.updateMealLog(req.user!.id, id, req.body);
    res.json(log);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = mealLogIdParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'ID de registro inválido' });
      return;
    }
    await mealLogsService.deleteMealLog(req.user!.id, id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
