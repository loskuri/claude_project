import type { ActivityLevel, NutritionGoal, Sex } from '../types/user.types.js';
import type { MacroBreakdown, NutritionTargets } from '../types/nutrition.types.js';
import { ACTIVITY_MULTIPLIERS, } from '../constants/activity.constants.js';
import { GOAL_CALORIE_ADJUSTMENTS, GOAL_MACRO_RATIOS } from '../constants/goals.constants.js';

/** Mifflin-St Jeor formula */
export function calculateBMR(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  ageYears: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(sex === 'MALE' ? base + 5 : base - 161);
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function distributeMacros(tdee: number, goal: NutritionGoal): MacroBreakdown {
  const adjustment = GOAL_CALORIE_ADJUSTMENTS[goal];
  const ratios = GOAL_MACRO_RATIOS[goal];
  const calories = tdee + adjustment;
  return {
    calories,
    proteinG: Math.round((calories * ratios.proteinPct) / 4),
    carbsG: Math.round((calories * ratios.carbsPct) / 4),
    fatG: Math.round((calories * ratios.fatPct) / 9),
  };
}

export function calculateNutritionTargets(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  birthDate: string,
  activityLevel: ActivityLevel,
  goal: NutritionGoal,
): NutritionTargets {
  const ageYears = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  );
  const bmr = calculateBMR(sex, weightKg, heightCm, ageYears);
  const tdee = calculateTDEE(bmr, activityLevel);
  const macros = distributeMacros(tdee, goal);
  return { bmr, tdee, ...macros };
}
