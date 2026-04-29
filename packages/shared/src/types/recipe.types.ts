import type { MealIngredient, MealType } from './diet.types.js';

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  description: string;
  ingredients: MealIngredient[];
  steps: string[];
  prepTimeMins: number;
  cookTimeMins: number;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  tags: string[];
  generatedAt: string;
  isSaved: boolean;
}

export interface GenerateRecipeInput {
  inventoryItemIds?: string[];
  mealType?: MealType;
  servings?: number;
  ingredientsText?: string;
  suggestionsText?: string;
}
