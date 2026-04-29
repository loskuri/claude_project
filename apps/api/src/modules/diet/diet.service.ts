import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error.middleware.js';
import { completeMessage, streamMessage } from '../../shared/ai.client.js';
import { getCache, setCache, deleteCachePattern, incrementCounter } from '../../shared/cache.service.js';
import { getNutritionTargets } from '../nutrition/nutrition.service.js';
import { buildDietPlanPrompt } from './diet.prompts.js';

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
  weeklyPlan: z.array(daySchema).min(1).max(7),
});

function getTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// JS: 0=Sun,1=Mon...6=Sat  →  schema: 0=Mon...6=Sun
function jsDayToSchema(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

export async function generateDietPlan(userId: string, dateInput?: Date) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) throw new AppError(400, 'Completá tu perfil antes de generar un plan');

  const preferences = await prisma.userPreferences.findUnique({ where: { userId } });
  const targets = await getNutritionTargets(userId);
  const actualToday = getTodayUTC();
  const today = dateInput ?? actualToday;

  if (today.getTime() < actualToday.getTime()) {
    throw new AppError(400, 'No podés crear planes para días anteriores.');
  }

  const maxAllowed = new Date(actualToday);
  maxAllowed.setUTCDate(actualToday.getUTCDate() + 6);
  if (today.getTime() > maxAllowed.getTime()) {
    throw new AppError(400, 'No podés crear planes con más de una semana de anticipación.');
  }

  const dateStr = today.toISOString().split('T')[0];
  const cacheKey = `diet:plan:${userId}:${dateStr}`;

  const cached = await getCache<ReturnType<typeof formatPlan>>(cacheKey);
  if (cached) return cached;

  // Return existing plan without regenerating
  const existingPlan = await prisma.nutritionPlan.findFirst({
    where: { userId, date: today },
    include: { meals: true },
  });
  if (existingPlan) {
    const result = formatPlan(existingPlan);
    await setCache(cacheKey, result, 60 * 60 * 24);
    return result;
  }

  const genCount = await incrementCounter(`rate:diet:gen:${userId}:${dateStr}`, 86400);
  if (genCount > 3) throw new AppError(429, 'Límite diario de generación de planes alcanzado (3/día).');

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
    today,
    1,
  );

  let rawResponse: string;
  try {
    rawResponse = await completeMessage({ userMessage: prompt, maxTokens: 8192 });
  } catch (err) {
    console.error(err);
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

  const day = parsed.weeklyPlan[0];
  const dayOfWeek = jsDayToSchema(today.getUTCDay());

  await prisma.nutritionPlan.deleteMany({ where: { userId, date: today } });

  const plan = await prisma.nutritionPlan.create({
    data: {
      userId,
      date: today,
      dayOfWeek,
      totalCalories: day.totalCalories,
      totalProteinG: day.totalProteinG,
      totalCarbsG: day.totalCarbsG,
      totalFatG: day.totalFatG,
      targetCalories: targets.calories,
      targetProteinG: targets.proteinG,
      targetCarbsG: targets.carbsG,
      targetFatG: targets.fatG,
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
    },
    include: { meals: true },
  });

  const result = formatPlan(plan);
  await setCache(cacheKey, result, 60 * 60 * 24);
  return result;
}

type StreamEvent =
  | { type: 'status'; message: string }
  | { type: 'chunk'; chars: number }
  | { type: 'done'; plan: ReturnType<typeof formatPlan> };

export async function* generateDietPlanStream(
  userId: string,
  dateInput?: Date,
): AsyncGenerator<StreamEvent> {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) throw new AppError(400, 'Completá tu perfil antes de generar un plan');

  const preferences = await prisma.userPreferences.findUnique({ where: { userId } });
  const targets = await getNutritionTargets(userId);
  const actualToday = getTodayUTC();
  const today = dateInput ?? actualToday;

  if (today.getTime() < actualToday.getTime()) {
    throw new AppError(400, 'No podés crear planes para días anteriores.');
  }

  const maxAllowed = new Date(actualToday);
  maxAllowed.setUTCDate(actualToday.getUTCDate() + 6);
  if (today.getTime() > maxAllowed.getTime()) {
    throw new AppError(400, 'No podés crear planes con más de una semana de anticipación.');
  }

  const dateStr = today.toISOString().split('T')[0];
  const cacheKey = `diet:plan:${userId}:${dateStr}`;

  const cached = await getCache<ReturnType<typeof formatPlan>>(cacheKey);
  if (cached) {
    yield { type: 'status', message: 'Plan encontrado en caché.' };
    yield { type: 'done', plan: cached };
    return;
  }

  // Return existing DB plan without regenerating
  const existingPlan = await prisma.nutritionPlan.findFirst({
    where: { userId, date: today },
    include: { meals: true },
  });
  if (existingPlan) {
    yield { type: 'status', message: 'Ya tenés un plan para este día.' };
    const result = formatPlan(existingPlan);
    await setCache(cacheKey, result, 60 * 60 * 24);
    yield { type: 'done', plan: result };
    return;
  }

  const genCount = await incrementCounter(`rate:diet:gen:${userId}:${dateStr}`, 86400);
  if (genCount > 3) throw new AppError(429, 'Límite diario de generación de planes alcanzado (3/día).');

  yield { type: 'status', message: 'Calculando tu plan...' };

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
    today,
    1,
  );

  yield { type: 'status', message: 'Generando menú con IA...' };

  let accumulated = '';
  try {
    for await (const chunk of streamMessage({ userMessage: prompt, maxTokens: 8192 })) {
      accumulated += chunk;
      yield { type: 'chunk', chars: accumulated.length };
    }
  } catch (err) {
    console.error(err);
    throw new AppError(503, 'No se pudo generar el plan. Intentá de nuevo.');
  }

  yield { type: 'status', message: 'Guardando tu plan...' };

  let parsed: z.infer<typeof dietPlanResponseSchema>;
  try {
    const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    parsed = dietPlanResponseSchema.parse(JSON.parse(jsonMatch[0]));
  } catch {
    throw new AppError(503, 'Respuesta inválida del generador. Intentá de nuevo.');
  }

  const day = parsed.weeklyPlan[0];
  const dayOfWeek = jsDayToSchema(today.getUTCDay());

  await prisma.nutritionPlan.deleteMany({ where: { userId, date: today } });

  const plan = await prisma.nutritionPlan.create({
    data: {
      userId,
      date: today,
      dayOfWeek,
      totalCalories: day.totalCalories,
      totalProteinG: day.totalProteinG,
      totalCarbsG: day.totalCarbsG,
      totalFatG: day.totalFatG,
      targetCalories: targets.calories,
      targetProteinG: targets.proteinG,
      targetCarbsG: targets.carbsG,
      targetFatG: targets.fatG,
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
    },
    include: { meals: true },
  });

  const streamResult = formatPlan(plan);
  await setCache(cacheKey, streamResult, 60 * 60 * 24);
  yield { type: 'done', plan: streamResult };
}

export async function getCurrentPlan(userId: string) {
  const plan = await prisma.nutritionPlan.findFirst({
    where: { userId },
    include: { meals: true },
    orderBy: { generatedAt: 'desc' },
  });
  if (!plan) throw new AppError(404, 'No hay un plan activo. Generá uno primero.');
  return formatPlan(plan);
}

export async function getPlanById(userId: string, planId: string) {
  const plan = await prisma.nutritionPlan.findFirst({
    where: { id: planId, userId },
    include: { meals: true },
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

export async function getPlanByDate(userId: string, dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00.000Z');
  const plan = await prisma.nutritionPlan.findFirst({
    where: { userId, date },
    include: { meals: true },
  });
  if (!plan) throw new AppError(404, 'No hay plan para ese día');
  return formatPlan(plan);
}

type WeekPlanEvent =
  | { type: 'status'; message: string; current: number; total: number }
  | { type: 'day-done'; date: string }
  | { type: 'done'; generated: number; skipped: number };

export async function* generateWeekPlanStream(userId: string): AsyncGenerator<WeekPlanEvent> {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) throw new AppError(400, 'Completá tu perfil antes de generar un plan');

  const today = getTodayUTC();
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() + i);
    return d;
  });

  const existingPlans = await prisma.nutritionPlan.findMany({
    where: { userId, date: { gte: days[0], lte: days[6] } },
    select: { date: true },
  });
  const existingDates = new Set(existingPlans.map((p) => p.date.toISOString().split('T')[0]));
  const missingDays = days.filter((d) => !existingDates.has(d.toISOString().split('T')[0]));

  if (missingDays.length === 0) {
    yield { type: 'done', generated: 0, skipped: 7 };
    return;
  }

  const weekGenKey = `rate:diet:week:${userId}:${today.toISOString().split('T')[0]}`;
  const weekGenCount = await incrementCounter(weekGenKey, 86400);
  if (weekGenCount > 1) throw new AppError(429, 'Solo podés generar la semana una vez por día.');

  const preferences = await prisma.userPreferences.findUnique({ where: { userId } });
  const targets = await getNutritionTargets(userId);
  const total = missingDays.length;
  let generated = 0;

  for (const day of missingDays) {
    const dayLabel = day.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' });
    yield { type: 'status', message: `Generando ${dayLabel}...`, current: generated + 1, total };

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
      day,
      1,
    );

    let rawResponse: string;
    try {
      rawResponse = await completeMessage({ userMessage: prompt, maxTokens: 8192 });
    } catch (err) {
      console.error(`Error generating plan for ${dayLabel}:`, err);
      continue;
    }

    let parsed: z.infer<typeof dietPlanResponseSchema>;
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      parsed = dietPlanResponseSchema.parse(JSON.parse(jsonMatch[0]));
    } catch {
      continue;
    }

    const dayData = parsed.weeklyPlan[0];
    const dayOfWeek = jsDayToSchema(day.getUTCDay());

    await prisma.nutritionPlan.deleteMany({ where: { userId, date: day } });
    const plan = await prisma.nutritionPlan.create({
      data: {
        userId,
        date: day,
        dayOfWeek,
        totalCalories: dayData.totalCalories,
        totalProteinG: dayData.totalProteinG,
        totalCarbsG: dayData.totalCarbsG,
        totalFatG: dayData.totalFatG,
        targetCalories: targets.calories,
        targetProteinG: targets.proteinG,
        targetCarbsG: targets.carbsG,
        targetFatG: targets.fatG,
        meals: {
          create: dayData.meals.map((meal) => ({
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
      },
      include: { meals: true },
    });

    const dateStr = day.toISOString().split('T')[0];
    await setCache(`diet:plan:${userId}:${dateStr}`, formatPlan(plan), 60 * 60 * 24);
    generated++;
    yield { type: 'day-done', date: dateStr };
  }

  yield { type: 'done', generated, skipped: total - generated };
}

export async function getAdjustedTargets(userId: string) {
  const targets = await getNutritionTargets(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

  const MAX_ADJUST_PCT = 0.10;
  const maxAdj = targets.calories * MAX_ADJUST_PCT;
  const calComp = Math.max(-maxAdj, Math.min(maxAdj, -avgCalDelta));
  const newCalories = Math.max(1200, Math.round(targets.calories + calComp));
  const adjusted = Math.abs(avgCalDelta) > 100;

  if (!adjusted) return { ...targets, adjusted: false, message: null };

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

type PrismaMeal = {
  id: string;
  nutritionPlanId: string;
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
};

type PrismaNutritionPlan = {
  id: string;
  userId: string;
  date: Date;
  dayOfWeek: number;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  generatedAt: Date;
  meals: PrismaMeal[];
};

function formatPlan(plan: PrismaNutritionPlan) {
  return {
    id: plan.id,
    userId: plan.userId,
    date: plan.date.toISOString(),
    dayOfWeek: plan.dayOfWeek,
    totalCalories: plan.totalCalories,
    totalProteinG: plan.totalProteinG,
    totalCarbsG: plan.totalCarbsG,
    totalFatG: plan.totalFatG,
    targetCalories: plan.targetCalories,
    targetProteinG: plan.targetProteinG,
    targetCarbsG: plan.targetCarbsG,
    targetFatG: plan.targetFatG,
    generatedAt: plan.generatedAt.toISOString(),
    meals: plan.meals.map((meal) => ({
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
  };
}
