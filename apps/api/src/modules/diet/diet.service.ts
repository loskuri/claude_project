import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error.middleware.js';
import { completeMessage } from '../../shared/claude.client.js';
import { getCache, setCache, deleteCachePattern } from '../../shared/cache.service.js';
import { getNutritionTargets } from '../nutrition/nutrition.service.js';
import { buildDietPlanPrompt } from './diet.prompts.js';
import { getWeekStart } from '@nutriplan/shared';

const ingredientSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
});

const mealSchema = z.object({
  mealType: z.enum(['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER']),
  name: z.string(),
  description: z.string(),
  prepTimeMins: z.number(),
  cookTimeMins: z.number(),
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  ingredients: z.array(ingredientSchema),
  preparationSteps: z.array(z.string()),
});

const daySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  dayName: z.string(),
  totalCalories: z.number(),
  totalProteinG: z.number(),
  totalCarbsG: z.number(),
  totalFatG: z.number(),
  meals: z.array(mealSchema),
});

const dietPlanResponseSchema = z.object({
  weeklyPlan: z.array(daySchema).length(7),
});

export async function generateDietPlan(userId: string, weekStartInput?: Date) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) throw new AppError(400, 'Completá tu perfil antes de generar un plan');

  const preferences = await prisma.userPreferences.findUnique({ where: { userId } });
  const targets = await getNutritionTargets(userId);
  const weekStart = weekStartInput ?? getWeekStart();

  const cacheKey = `diet:plan:${userId}:${weekStart.toISOString().split('T')[0]}`;
  const cached = await getCache<ReturnType<typeof formatPlan>>(cacheKey);
  if (cached) return cached;

  const prompt = buildDietPlanPrompt(
    {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName ?? undefined,
      birthDate: profile.birthDate.toISOString(),
      sex: profile.sex as 'MALE' | 'FEMALE',
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel as Parameters<typeof buildDietPlanPrompt>[0]['activityLevel'],
      goal: profile.goal as Parameters<typeof buildDietPlanPrompt>[0]['goal'],
      onboardingComplete: profile.onboardingComplete,
    },
    preferences
      ? {
          id: preferences.id,
          userId: preferences.userId,
          dietaryType: preferences.dietaryType as 'OMNIVORE' | 'VEGETARIAN' | 'VEGAN' | 'PESCATARIAN' | 'KETO' | 'PALEO',
          allergies: preferences.allergies,
          dislikedFoods: preferences.dislikedFoods,
          preferredCuisines: preferences.preferredCuisines,
          mealsPerDay: preferences.mealsPerDay,
        }
      : null,
    targets,
    weekStart,
  );

  let rawResponse: string;
  try {
    rawResponse = await completeMessage({ userMessage: prompt, maxTokens: 8192 });
  } catch (err) {
    throw new AppError(503, 'No se pudo generar el plan. Intentá de nuevo.');
  }

  let parsed: z.infer<typeof dietPlanResponseSchema>;
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    parsed = dietPlanResponseSchema.parse(JSON.parse(jsonMatch[0]));
  } catch {
    throw new AppError(503, 'Respuesta inválida del generador. Intentá de nuevo.');
  }

  // Deactivate previous plans for this week
  await prisma.nutritionPlan.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });

  const plan = await prisma.nutritionPlan.create({
    data: {
      userId,
      weekStart,
      targetCalories: targets.calories,
      targetProteinG: targets.proteinG,
      targetCarbsG: targets.carbsG,
      targetFatG: targets.fatG,
      isActive: true,
      weeklyMenus: {
        create: parsed.weeklyPlan.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          dayName: day.dayName,
          totalCalories: day.totalCalories,
          totalProteinG: day.totalProteinG,
          totalCarbsG: day.totalCarbsG,
          totalFatG: day.totalFatG,
          meals: {
            create: day.meals.map((meal) => ({
              mealType: meal.mealType,
              name: meal.name,
              description: meal.description,
              prepTimeMins: meal.prepTimeMins,
              cookTimeMins: meal.cookTimeMins,
              calories: meal.calories,
              proteinG: meal.proteinG,
              carbsG: meal.carbsG,
              fatG: meal.fatG,
              ingredients: meal.ingredients,
              preparationSteps: meal.preparationSteps,
            })),
          },
        })),
      },
    },
    include: {
      weeklyMenus: {
        include: { meals: true },
        orderBy: { dayOfWeek: 'asc' },
      },
    },
  });

  const result = formatPlan(plan);
  await setCache(cacheKey, result, 60 * 60 * 24);
  return result;
}

export async function getCurrentPlan(userId: string) {
  const plan = await prisma.nutritionPlan.findFirst({
    where: { userId, isActive: true },
    include: {
      weeklyMenus: {
        include: { meals: true },
        orderBy: { dayOfWeek: 'asc' },
      },
    },
    orderBy: { generatedAt: 'desc' },
  });
  if (!plan) throw new AppError(404, 'No hay un plan activo. Generá uno primero.');
  return formatPlan(plan);
}

export async function getPlanById(userId: string, planId: string) {
  const plan = await prisma.nutritionPlan.findFirst({
    where: { id: planId, userId },
    include: {
      weeklyMenus: {
        include: { meals: true },
        orderBy: { dayOfWeek: 'asc' },
      },
    },
  });
  if (!plan) throw new AppError(404, 'Plan no encontrado');
  return formatPlan(plan);
}

export async function deletePlan(userId: string, planId: string) {
  const plan = await prisma.nutritionPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new AppError(404, 'Plan no encontrado');
  await prisma.nutritionPlan.delete({ where: { id: planId } });
  await deleteCachePattern(`diet:plan:${userId}:*`);
}

export async function getAdjustedTargets(userId: string) {
  const targets = await getNutritionTargets(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Solo miramos los últimos 2 días para evitar ajustes extremos
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  const logs = await prisma.mealLog.findMany({
    where: { userId, date: { gte: twoDaysAgo, lt: today } },
  });

  if (logs.length === 0) return { ...targets, adjusted: false, message: null };

  const byDate = new Map<string, { calories: number; proteinG: number; carbsG: number; fatG: number }>();
  for (const log of logs) {
    const key = log.date.toISOString().split('T')[0];
    const existing = byDate.get(key) ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
    byDate.set(key, {
      calories: existing.calories + log.calories,
      proteinG: existing.proteinG + log.proteinG,
      carbsG: existing.carbsG + log.carbsG,
      fatG: existing.fatG + log.fatG,
    });
  }

  const days = Array.from(byDate.values());
  const avgCalDelta = days.reduce((s, d) => s + (d.calories - targets.calories), 0) / days.length;

  // Ajuste máximo: 10% del objetivo diario. Nunca bajar de 1200 kcal (mínimo seguro).
  const MAX_ADJUST_PCT = 0.10;
  const maxAdj = targets.calories * MAX_ADJUST_PCT;
  const calComp = Math.max(-maxAdj, Math.min(maxAdj, -avgCalDelta));
  const newCalories = Math.max(1200, Math.round(targets.calories + calComp));
  const adjusted = Math.abs(avgCalDelta) > 100;

  if (!adjusted) return { ...targets, adjusted: false, message: null };

  // Redistribuir macros proporcionalmente al nuevo total de calorías
  const ratio = newCalories / targets.calories;
  return {
    ...targets,
    calories: newCalories,
    proteinG: Math.round(targets.proteinG * ratio),
    carbsG: Math.round(targets.carbsG * ratio),
    fatG: Math.round(targets.fatG * ratio),
    adjusted: true,
    message: avgCalDelta > 0
      ? `Comiste ${Math.round(avgCalDelta)} kcal extra en promedio los últimos ${days.length} días. Ajustando objetivo de hoy (-${Math.round(-calComp)} kcal).`
      : `Comiste ${Math.round(-avgCalDelta)} kcal menos en promedio los últimos ${days.length} días. Ajustando objetivo de hoy (+${Math.round(calComp)} kcal).`,
  };
}

type PrismaWeeklyMenu = {
  id: string;
  nutritionPlanId: string;
  dayOfWeek: number;
  dayName: string;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  meals: Array<{
    id: string;
    weeklyMenuId: string;
    mealType: string;
    name: string;
    description: string;
    prepTimeMins: number;
    cookTimeMins: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    ingredients: unknown;
    preparationSteps: unknown;
  }>;
};

type PrismaNutritionPlan = {
  id: string;
  userId: string;
  weekStart: Date;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  generatedAt: Date;
  isActive: boolean;
  weeklyMenus: PrismaWeeklyMenu[];
};

function formatPlan(plan: PrismaNutritionPlan) {
  return {
    id: plan.id,
    userId: plan.userId,
    weekStart: plan.weekStart.toISOString(),
    targetCalories: plan.targetCalories,
    targetProteinG: plan.targetProteinG,
    targetCarbsG: plan.targetCarbsG,
    targetFatG: plan.targetFatG,
    generatedAt: plan.generatedAt.toISOString(),
    isActive: plan.isActive,
    weeklyMenus: plan.weeklyMenus.map((menu) => ({
      id: menu.id,
      dayOfWeek: menu.dayOfWeek,
      dayName: menu.dayName,
      totalCalories: menu.totalCalories,
      totalProteinG: menu.totalProteinG,
      totalCarbsG: menu.totalCarbsG,
      totalFatG: menu.totalFatG,
      meals: menu.meals.map((meal) => ({
        id: meal.id,
        mealType: meal.mealType,
        name: meal.name,
        description: meal.description,
        prepTimeMins: meal.prepTimeMins,
        cookTimeMins: meal.cookTimeMins,
        calories: meal.calories,
        proteinG: meal.proteinG,
        carbsG: meal.carbsG,
        fatG: meal.fatG,
        ingredients: meal.ingredients,
        preparationSteps: meal.preparationSteps,
      })),
    })),
  };
}
