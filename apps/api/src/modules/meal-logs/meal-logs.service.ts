import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error.middleware.js';

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
  const date = input.date ? new Date(input.date) : new Date();
  date.setHours(0, 0, 0, 0);

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
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

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
  return { date: (date ? new Date(date) : new Date()).toISOString().split('T')[0], logs, totals };
}

export async function getMacroHistory(userId: string, from?: string, to?: string) {
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = to ? new Date(to) : new Date();
  toDate.setHours(23, 59, 59, 999);

  const logs = await prisma.mealLog.findMany({
    where: { userId, date: { gte: fromDate, lte: toDate } },
    orderBy: { date: 'asc' },
  });

  // Group by date
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

  return Array.from(byDate.entries()).map(([date, totals]) => ({ date, ...totals }));
}
