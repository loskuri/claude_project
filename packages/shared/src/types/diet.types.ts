export type MealType =
  | 'BREAKFAST'
  | 'MORNING_SNACK'
  | 'LUNCH'
  | 'AFTERNOON_SNACK'
  | 'DINNER';

export interface MealIngredient {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface Meal {
  id: string;
  mealType: MealType;
  name: string;
  description: string;
  prepTimeMins: number;
  cookTimeMins: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  ingredients: MealIngredient[];
  preparationSteps: string[];
}

export interface DayMenu {
  dayOfWeek: number;
  dayName: string;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  meals: Meal[];
}

export interface NutritionPlan {
  id: string;
  userId: string;
  weekStart: string;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  generatedAt: string;
  weeklyMenus: DayMenu[];
  isActive: boolean;
}
