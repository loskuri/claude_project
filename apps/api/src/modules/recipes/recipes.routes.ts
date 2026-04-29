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
    const recipes = await recipesService.getSavedRecipes(req.user!.id);
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
