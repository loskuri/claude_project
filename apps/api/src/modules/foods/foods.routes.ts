import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { z } from 'zod';
import { validateQuery } from '../../middleware/validate.middleware.js';
import * as foodsService from './foods.service.js';

const router: ReturnType<typeof Router> = Router();
router.use(authMiddleware);

const searchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  category: z.string().optional(),
});

router.get('/search', validateQuery(searchQuerySchema), async (req, res, next) => {
  try {
    const { q, limit, category } = req.query as unknown as { q: string; limit: number; category?: string };
    const foods = await foodsService.searchFoods(q, limit, category);
    res.json({ foods });
  } catch (err) {
    next(err);
  }
});

router.get('/barcode/:barcode', async (req, res, next) => {
  try {
    const food = await foodsService.getFoodByBarcode(req.params.barcode);
    res.json(food);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const food = await foodsService.getFoodById(req.params.id);
    res.json(food);
  } catch (err) {
    next(err);
  }
});

export default router;
