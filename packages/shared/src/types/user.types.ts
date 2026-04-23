export type Sex = 'MALE' | 'FEMALE';

export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE'
  | 'EXTRA_ACTIVE';

export type NutritionGoal = 'LOSE_WEIGHT' | 'MAINTAIN_WEIGHT' | 'GAIN_MUSCLE';

export type DietaryType =
  | 'OMNIVORE'
  | 'VEGETARIAN'
  | 'VEGAN'
  | 'PESCATARIAN'
  | 'KETO'
  | 'PALEO';

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string;
  birthDate: string;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
  onboardingComplete: boolean;
}

export interface UserPreferences {
  id: string;
  userId: string;
  dietaryType: DietaryType;
  allergies: string[];
  dislikedFoods: string[];
  preferredCuisines: string[];
  mealsPerDay: number;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  sex?: Sex;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  goal?: NutritionGoal;
  onboardingComplete?: boolean;
}

export interface UpdatePreferencesInput {
  dietaryType?: DietaryType;
  allergies?: string[];
  dislikedFoods?: string[];
  preferredCuisines?: string[];
  mealsPerDay?: number;
}
