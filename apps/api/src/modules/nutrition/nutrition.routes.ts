import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { getNutritionTargets } from './nutrition.service.js';

const router = Router();

router.use(authMiddleware);

router.get('/targets', async (req, res, next) => {
  try {
    const targets = await getNutritionTargets(req.user!.id);
    res.json(targets);
  } catch (err) {
    next(err);
  }
});

export default router;
