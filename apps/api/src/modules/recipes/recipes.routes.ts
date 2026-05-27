import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import * as recipesService from './recipes.service.js';

const router = Router();
router.use(authMiddleware);

const generateSchema = z.object({
  inventoryItemIds: z.array(z.string()).optional(),
  mealType: z.enum(['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER']).optional(),
  servings: z.coerce.number().int().min(1).max(10).default(2),
  ingredientsText: z.string().trim().max(2000).optional(),
  suggestionsText: z.string().trim().max(2000).optional(),
});

const autoGenerateSchema = z.object({
  mealType: z.string().optional(),
  suggestionsText: z.string().trim().max(2000).optional(),
  ingredientsText: z.string().trim().max(2000).optional(),
});

router.post('/auto-generate', validateBody(autoGenerateSchema), async (req, res, next) => {
  try {
    const result = await recipesService.autoSaveRecipe(req.user!.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/generate', validateBody(generateSchema), async (req, res, next) => {
  try {
    await recipesService.streamRecipe(req.user!.id, req.body, res);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/save', async (req, res, next) => {
  try {
    const recipe = await recipesService.saveRecipe(req.user!.id, req.params.id);
    res.json(recipe);
  } catch (err) {
    next(err);
  }
});

router.get('/saved', async (req, res, next) => {
  try {
    const raw = req.query.q;
    const q = typeof raw === 'string' ? raw.trim().slice(0, 200) : undefined;
    const recipes = await recipesService.getSavedRecipes(req.user!.id, q || undefined);
    res.json({ recipes });
  } catch (err) {
    next(err);
  }
});

router.delete('/saved/:id', async (req, res, next) => {
  try {
    await recipesService.deleteSavedRecipe(req.user!.id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
