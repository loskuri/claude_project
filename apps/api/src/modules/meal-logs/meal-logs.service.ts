import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error.middleware.js';
import { completeMessage } from '../../shared/ai.client.js';

function utcMidnight(dateStr?: string): Date {
  if (dateStr) return new Date(dateStr + 'T00:00:00.000Z');
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export const logMealSchema = z.object({
  date: z.string().optional(),
  mealType: z.enum(['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER']),
  name: z.string().min(1),
  calories: z.number().positive(),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0),
  quantity: z.number().positive().default(1),
  unit: z.string().default('porcion'),
  notes: z.string().optional(),
});

export type LogMealInput = z.infer<typeof logMealSchema>;

export async function logMeal(userId: string, input: LogMealInput) {
  const date = utcMidnight(input.date);
  return prisma.mealLog.create({
    data: {
      userId,
      date,
      mealType: input.mealType,
      name: input.name,
      calories: input.calories,
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatG: input.fatG,
      quantity: input.quantity,
      unit: input.unit,
      notes: input.notes,
    },
  });
}

export async function getMealLogs(userId: string, date?: string) {
  const targetDate = utcMidnight(date);
  const nextDay = new Date(targetDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  return prisma.mealLog.findMany({
    where: { userId, date: { gte: targetDate, lt: nextDay } },
    orderBy: { loggedAt: 'asc' },
  });
}

export async function deleteMealLog(userId: string, logId: string) {
  const log = await prisma.mealLog.findFirst({ where: { id: logId, userId } });
  if (!log) throw new AppError(404, 'Registro no encontrado');
  await prisma.mealLog.delete({ where: { id: logId } });
}

export const updateMealLogSchema = logMealSchema.partial().omit({ date: true, mealType: true });
export type UpdateMealLogInput = z.infer<typeof updateMealLogSchema>;

export async function updateMealLog(userId: string, logId: string, input: UpdateMealLogInput) {
  const log = await prisma.mealLog.findFirst({ where: { id: logId, userId } });
  if (!log) throw new AppError(404, 'Registro no encontrado');
  return prisma.mealLog.update({ where: { id: logId }, data: input });
}

export async function getDailySummary(userId: string, date?: string) {
  const logs = await getMealLogs(userId, date);
  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      proteinG: acc.proteinG + log.proteinG,
      carbsG: acc.carbsG + log.carbsG,
      fatG: acc.fatG + log.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
  const dateStr = date ?? new Date().toISOString().split('T')[0];
  return { date: dateStr, logs, totals };
}

const emptyDay = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

/** Inclusive UTC calendar range for macro totals per day (zeros when no meals). */
export async function getMacroHistory(userId: string, from?: string, to?: string) {
  let start: Date;
  let endDay: Date;

  if (from && to) {
    start = utcMidnight(from);
    endDay = utcMidnight(to);
  } else if (from) {
    start = utcMidnight(from);
    endDay = utcMidnight();
  } else if (to) {
    endDay = utcMidnight(to);
    start = new Date(endDay);
    start.setUTCDate(start.getUTCDate() - 29);
  } else {
    endDay = utcMidnight();
    start = new Date(endDay);
    start.setUTCDate(start.getUTCDate() - 29);
  }

  const rangeEnd = new Date(endDay);
  rangeEnd.setUTCHours(23, 59, 59, 999);

  const logs = await prisma.mealLog.findMany({
    where: { userId, date: { gte: start, lte: rangeEnd } },
    orderBy: { date: 'asc' },
  });

  const byDate = new Map<string, { calories: number; proteinG: number; carbsG: number; fatG: number }>();
  for (const log of logs) {
    const key = log.date.toISOString().split('T')[0];
    const existing = byDate.get(key) ?? { ...emptyDay };
    byDate.set(key, {
      calories: existing.calories + log.calories,
      proteinG: existing.proteinG + log.proteinG,
      carbsG: existing.carbsG + log.carbsG,
      fatG: existing.fatG + log.fatG,
    });
  }

  const history: Array<{ date: string; calories: number; proteinG: number; carbsG: number; fatG: number }> = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= endDay.getTime()) {
    const key = cursor.toISOString().split('T')[0];
    history.push({ date: key, ...(byDate.get(key) ?? { ...emptyDay }) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return history;
}

const customMealResponseSchema = z.object({
  name: z.string(),
  mealType: z.enum(['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER']),
  calories: z.number().positive(),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0),
  quantity: z.number().positive().default(1),
  unit: z.string().default('porcion'),
});

export async function logMealFromText(userId: string, text: string, dateStr?: string) {
  const prompt = `Analiza esta comida y devuelve información nutricional estimada.

Descripción: "${text}"

Devuelve SOLO un JSON con esta estructura exacta (sin markdown ni texto extra):
{
  "name": "nombre descriptivo de la comida",
  "mealType": "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER",
  "calories": número (kcal totales de la porción descrita),
  "proteinG": número (gramos de proteína),
  "carbsG": número (gramos de carbohidratos),
  "fatG": número (gramos de grasa),
  "quantity": 1,
  "unit": "porcion"
}

Reglas:
- Estimá calorías y macros para la cantidad y alimentos descritos
- Si no se especifica cantidad, asumí una porción estándar argentina
- mealType debe ser el más apropiado según la comida (desayuno, almuerzo, etc.)
- Sé realista y conservador con los valores`;

  let rawResponse: string;
  try {
    rawResponse = await completeMessage({ userMessage: prompt, maxTokens: 512 });
  } catch {
    throw new AppError(503, 'No se pudo analizar la comida. Intentá de nuevo.');
  }

  let parsed: z.infer<typeof customMealResponseSchema>;
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    parsed = customMealResponseSchema.parse(JSON.parse(jsonMatch[0]));
  } catch {
    throw new AppError(503, 'No se pudo interpretar la comida. Intentá describir con más detalle.');
  }

  const date = utcMidnight(dateStr);
  return prisma.mealLog.create({
    data: {
      userId,
      date,
      mealType: parsed.mealType,
      name: parsed.name,
      calories: parsed.calories,
      proteinG: parsed.proteinG,
      carbsG: parsed.carbsG,
      fatG: parsed.fatG,
      quantity: parsed.quantity,
      unit: parsed.unit,
      notes: `Descripción original: ${text}`,
    },
  });
}
