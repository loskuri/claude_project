import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error.middleware.js';
import { calculateNutritionTargets } from '@nutriplan/shared';

export async function getNutritionTargets(userId: string) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) throw new AppError(400, 'Completá tu perfil primero');

  return calculateNutritionTargets(
    profile.sex as 'MALE' | 'FEMALE',
    profile.weightKg,
    profile.heightCm,
    profile.birthDate.toISOString(),
    profile.activityLevel as Parameters<typeof calculateNutritionTargets>[4],
    profile.goal as Parameters<typeof calculateNutritionTargets>[5],
  );
}
