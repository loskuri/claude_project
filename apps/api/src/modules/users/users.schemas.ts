import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  sex: z.enum(['MALE', 'FEMALE']).optional(),
  heightCm: z.number().min(50).max(300).optional(),
  weightKg: z.number().min(20).max(500).optional(),
  activityLevel: z
    .enum(['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'])
    .optional(),
  goal: z.enum(['LOSE_WEIGHT', 'MAINTAIN_WEIGHT', 'GAIN_MUSCLE']).optional(),
  onboardingComplete: z.boolean().optional(),
});

export const updatePreferencesSchema = z.object({
  dietaryType: z
    .enum(['OMNIVORE', 'VEGETARIAN', 'VEGAN', 'PESCATARIAN', 'KETO', 'PALEO'])
    .optional(),
  allergies: z.array(z.string()).optional(),
  dislikedFoods: z.array(z.string()).optional(),
  preferredCuisines: z.array(z.string()).optional(),
  mealsPerDay: z.number().min(3).max(6).optional(),
});
