import type { Response } from 'express';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error.middleware.js';
import { streamMessage } from '../../shared/ai.client.js';
import { incrementCounter } from '../../shared/cache.service.js';
import { buildRecipePrompt } from './recipes.prompts.js';
import type { MealType } from '@nutriplan/shared';

export async function streamRecipe(
  userId: string,
  params: {
    inventoryItemIds?: string[];
    mealType?: MealType;
    servings?: number;
    ingredientsText?: string;
    suggestionsText?: string;
  },
  res: Response,
): Promise<void> {
  let inventoryItems: Array<{ name: string; quantity: number; unit: string }> = [];

  if (params.inventoryItemIds?.length) {
    const items = await prisma.inventoryItem.findMany({
      where: { id: { in: params.inventoryItemIds }, userId },
      include: { food: { select: { nameEs: true } } },
    });
    inventoryItems = items.map((item) => ({
      name: item.food?.nameEs ?? item.customName ?? 'ingrediente',
      quantity: item.quantity,
      unit: item.unit,
    }));
  }

  const today = new Date().toISOString().split('T')[0];
  const genCount = await incrementCounter(`rate:recipe:gen:${userId}:${today}`, 86400);
  if (genCount > 10) {
    res.status(429).json({ error: 'Límite diario de generación de recetas alcanzado (10/día).' });
    return;
  }

  const prompt = buildRecipePrompt({
    inventoryItems,
    mealType: params.mealType,
    servings: params.servings ?? 2,
    ingredientsText: params.ingredientsText,
    suggestionsText: params.suggestionsText,
  });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  let fullText = '';
  try {
    for await (const chunk of streamMessage({ userMessage: prompt, maxTokens: 2048 })) {
      fullText += chunk;
      res.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`);
    }
  } catch {
    res.write(`data: ${JSON.stringify({ error: 'Error generando la receta' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // Persist the recipe temporarily (unsaved)
  try {
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const recipe = await prisma.recipe.create({
        data: {
          userId,
          name: parsed.name ?? 'Receta generada',
          description: parsed.description ?? '',
          ingredients: parsed.ingredients ?? [],
          steps: parsed.steps ?? [],
          prepTimeMins: parsed.prepTimeMins ?? 0,
          cookTimeMins: parsed.cookTimeMins ?? 0,
          servings: parsed.servings ?? 2,
          calories: parsed.calories ?? 0,
          proteinG: parsed.proteinG ?? 0,
          carbsG: parsed.carbsG ?? 0,
          fatG: parsed.fatG ?? 0,
          tags: parsed.tags ?? [],
          isSaved: false,
        },
      });
      res.write(`data: ${JSON.stringify({ recipeId: recipe.id })}\n\n`);
    }
  } catch {
    // Recipe parsing is best-effort
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

export async function saveRecipe(userId: string, recipeId: string) {
  const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId } });
  if (!recipe) throw new AppError(404, 'Receta no encontrada');
  return prisma.recipe.update({ where: { id: recipeId }, data: { isSaved: true } });
}

export async function getSavedRecipes(userId: string, nameSearch?: string) {
  const q = nameSearch?.trim();
  return prisma.recipe.findMany({
    where: {
      userId,
      isSaved: true,
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: { generatedAt: 'desc' },
  });
}

export async function deleteSavedRecipe(userId: string, recipeId: string) {
  const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId, isSaved: true } });
  if (!recipe) throw new AppError(404, 'Receta no encontrada');
  await prisma.recipe.delete({ where: { id: recipeId } });
}
