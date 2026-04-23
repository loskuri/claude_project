import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import * as dietService from './diet.service.js';

const router = Router();
router.use(authMiddleware);

router.post('/generate', async (req, res, next) => {
  try {
    const weekStart = req.body.weekStart ? new Date(req.body.weekStart) : undefined;
    const plan = await dietService.generateDietPlan(req.user!.id, weekStart);
    res.json(plan);
  } catch (err) {
    next(err);
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
