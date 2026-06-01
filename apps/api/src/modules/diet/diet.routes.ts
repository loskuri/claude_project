import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { AppError } from '../../middleware/error.middleware.js';
import { logError, logInfo } from '../../shared/log.js';
import * as dietService from './diet.service.js';
import { getShoppingList } from './diet.shopping.js';

const router: ReturnType<typeof Router> = Router();
router.use(authMiddleware);

router.post('/generate', async (req, res, next) => {
  try {
    const date = req.body.date ? new Date(req.body.date) : undefined;
    const plan = await dietService.generateDietPlan(req.user!.id, date);
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

router.post('/generate/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: Record<string, unknown>) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const date = req.body.date ? new Date(req.body.date) : undefined;
    for await (const event of dietService.generateDietPlanStream(req.user!.id, date)) {
      send(event as Record<string, unknown>);
    }
  } catch (err) {
    const message = err instanceof AppError ? err.message : 'No se pudo generar el plan.';
    const status = err instanceof AppError ? err.statusCode : 503;
    res.status(status);
    logError('diet:stream', 'POST /diet/generate/stream failed', {
      userId: req.user?.id,
      status,
      clientMessage: message,
    }, err);
    send({ type: 'error', message, status });
  } finally {
    res.end();
  }
});

router.get('/current', async (req, res, next) => {
  try {
    const plan = await dietService.getCurrentPlan(req.user!.id);
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

router.get('/targets/adjusted', async (req, res, next) => {
  try {
    const targets = await dietService.getAdjustedTargets(req.user!.id);
    res.json(targets);
  } catch (err) {
    next(err);
  }
});

router.get('/by-date/:dateStr', async (req, res, next) => {
  try {
    const plan = await dietService.getPlanByDate(req.user!.id, req.params.dateStr);
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

router.post('/generate/week/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: Record<string, unknown>) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const userId = req.user!.id;

  logInfo('diet:week', 'POST /diet/generate/week/stream started', { userId });

  try {
    for await (const event of dietService.generateWeekPlanStream(userId)) {
      if (event.type === 'done') {
        logInfo('diet:week', 'POST /diet/generate/week/stream finished', {
          userId,
          generated: event.generated,
          skipped: event.skipped,
        });
      }
      send(event as Record<string, unknown>);
    }
  } catch (err) {
    const message = err instanceof AppError ? err.message : 'No se pudo generar el plan.';
    const status = err instanceof AppError ? err.statusCode : 503;
    res.status(status);
    logError('diet:week', 'POST /diet/generate/week/stream failed', {
      userId,
      status,
      clientMessage: message,
    }, err);
    send({ type: 'error', message, status });
  } finally {
    res.end();
  }
});

router.post('/meal/:mealId/swap/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: Record<string, unknown>) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    for await (const event of dietService.swapMealStream(req.user!.id, req.params.mealId)) {
      send(event as Record<string, unknown>);
    }
  } catch (err) {
    const message = err instanceof AppError ? err.message : 'No se pudo generar el reemplazo.';
    const status = err instanceof AppError ? err.statusCode : 503;
    res.status(status);
    logError('diet:stream', 'POST /diet/meal/swap/stream failed', {
      userId: req.user?.id,
      mealId: req.params.mealId,
      status,
      clientMessage: message,
    }, err);
    send({ type: 'error', message, status });
  } finally {
    res.end();
  }
});

router.get('/shopping-list', async (req, res, next) => {
  try {
    const dateStr = typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
      ? req.query.date
      : undefined;
    const list = await getShoppingList(req.user!.id, dateStr);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post('/preferences/dislike', async (req, res, next) => {
  try {
    const { mealName } = req.body as { mealName?: string };
    if (!mealName?.trim()) throw new AppError(400, 'mealName requerido');
    await dietService.addDislike(req.user!.id, mealName);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/:planId', async (req, res, next) => {
  try {
    const plan = await dietService.getPlanById(req.user!.id, req.params.planId);
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

router.delete('/:planId', async (req, res, next) => {
  try {
    await dietService.deletePlan(req.user!.id, req.params.planId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
