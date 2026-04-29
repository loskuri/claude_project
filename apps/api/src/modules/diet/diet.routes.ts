import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { AppError } from '../../middleware/error.middleware.js';
import * as dietService from './diet.service.js';

const router = Router();
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

  try {
    for await (const event of dietService.generateWeekPlanStream(req.user!.id)) {
      send(event as Record<string, unknown>);
    }
  } catch (err) {
    const message = err instanceof AppError ? err.message : 'No se pudo generar el plan.';
    const status = err instanceof AppError ? err.statusCode : 503;
    send({ type: 'error', message, status });
  } finally {
    res.end();
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
