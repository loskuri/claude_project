import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { UpdateProfileInput, UpdatePreferencesInput } from '@nutriplan/shared';

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      profile: true,
      preferences: true,
    },
  });
  if (!user) throw new AppError(404, 'Usuario no encontrado');
  return user;
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const profile = await prisma.userProfile.upsert({
    where: { userId },
    update: {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
    },
    create: {
      userId,
      firstName: data.firstName ?? '',
      birthDate: data.birthDate ? new Date(data.birthDate) : new Date('1990-01-01'),
      sex: data.sex ?? 'MALE',
      heightCm: data.heightCm ?? 170,
      weightKg: data.weightKg ?? 70,
      activityLevel: data.activityLevel ?? 'MODERATELY_ACTIVE',
      goal: data.goal ?? 'MAINTAIN_WEIGHT',
    },
  });
  return profile;
}

export async function updatePreferences(userId: string, data: UpdatePreferencesInput) {
  const preferences = await prisma.userPreferences.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      dietaryType: data.dietaryType ?? 'OMNIVORE',
      allergies: data.allergies ?? [],
      dislikedFoods: data.dislikedFoods ?? [],
      preferredCuisines: data.preferredCuisines ?? [],
      mealsPerDay: data.mealsPerDay ?? 4,
    },
  });
  return preferences;
}
