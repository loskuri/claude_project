import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error.middleware.js';

export async function logWeight(
  userId: string,
  data: { weightKg: number; date?: string; bodyFatPct?: number; notes?: string },
) {
  const date = data.date ? new Date(data.date) : new Date();
  date.setHours(0, 0, 0, 0);

  return prisma.progressLog.upsert({
    where: { userId_date: { userId, date } },
    update: { weightKg: data.weightKg, bodyFatPct: data.bodyFatPct, notes: data.notes },
    create: {
      userId,
      date,
      weightKg: data.weightKg,
      bodyFatPct: data.bodyFatPct,
      notes: data.notes,
    },
  });
}

export async function getWeightLogs(userId: string, from?: string, to?: string) {
  const where: Record<string, unknown> = { userId };

  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, Date>).gte = new Date(from);
    if (to) (where.date as Record<string, Date>).lte = new Date(to);
  }

  return prisma.progressLog.findMany({
    where,
    orderBy: { date: 'asc' },
    select: { id: true, date: true, weightKg: true, bodyFatPct: true, notes: true },
  });
}
