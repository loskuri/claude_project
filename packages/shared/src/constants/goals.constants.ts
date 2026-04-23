import type { NutritionGoal } from '../types/user.types.js';

export const GOAL_LABELS: Record<NutritionGoal, string> = {
  LOSE_WEIGHT: 'Perder peso',
  MAINTAIN_WEIGHT: 'Mantener peso',
  GAIN_MUSCLE: 'Ganar músculo',
};

export const GOAL_CALORIE_ADJUSTMENTS: Record<NutritionGoal, number> = {
  LOSE_WEIGHT: -500,
  MAINTAIN_WEIGHT: 0,
  GAIN_MUSCLE: 300,
};

export const GOAL_MACRO_RATIOS: Record<
  NutritionGoal,
  { proteinPct: number; carbsPct: number; fatPct: number }
> = {
  LOSE_WEIGHT: { proteinPct: 0.35, carbsPct: 0.35, fatPct: 0.3 },
  MAINTAIN_WEIGHT: { proteinPct: 0.25, carbsPct: 0.5, fatPct: 0.25 },
  GAIN_MUSCLE: { proteinPct: 0.3, carbsPct: 0.45, fatPct: 0.25 },
};
