import type { MealType } from '@nutriplan/shared';

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: 'desayuno',
  MORNING_SNACK: 'merienda de mañana',
  LUNCH: 'almuerzo',
  AFTERNOON_SNACK: 'merienda de tarde',
  DINNER: 'cena',
};

export function buildRecipePrompt(params: {
  inventoryItems: Array<{ name: string; quantity: number; unit: string }>;
  mealType?: MealType;
  servings?: number;
  targetCalories?: number;
  targetProteinG?: number;
}): string {
  const { inventoryItems, mealType, servings = 2, targetCalories, targetProteinG } = params;

  const ingredientsList =
    inventoryItems.length > 0
      ? inventoryItems.map((i) => `- ${i.name}: ${i.quantity}${i.unit}`).join('\n')
      : '- Ingredientes básicos de cocina argentina disponibles';

  const mealLabel = mealType ? `para ${MEAL_LABELS[mealType]}` : '';
  const calorieTarget = targetCalories ? `~${Math.round(targetCalories / servings)} kcal por porción` : '';
  const proteinTarget = targetProteinG ? `, proteínas ~${Math.round(targetProteinG / servings)}g` : '';

  return `Generá una receta ${mealLabel} usando principalmente estos ingredientes disponibles:
${ingredientsList}

Requisitos:
- Porciones: ${servings}
${calorieTarget}${proteinTarget}
- Receta práctica, con pasos claros
- Nombres y medidas en español argentino

Devolvé EXACTAMENTE este JSON (sin texto adicional):
{
  "name": "nombre de la receta",
  "description": "descripción breve y apetitosa",
  "servings": ${servings},
  "prepTimeMins": number,
  "cookTimeMins": number,
  "calories": number,
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "ingredients": [
    { "name": "string", "quantity": number, "unit": "g|ml|units|cdas|cditas|tazas", "calories": number, "proteinG": number, "carbsG": number, "fatG": number }
  ],
  "steps": ["paso 1", "paso 2", "..."],
  "tags": ["tag1", "tag2"]
}`;
}
