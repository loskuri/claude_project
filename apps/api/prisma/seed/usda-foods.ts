import type { PrismaClient } from '@prisma/client';

const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';
const API_KEY = process.env.USDA_API_KEY ?? 'DEMO_KEY';

const NUTRIENT_MAP: Record<number, string> = {
  1008: 'calories',
  1003: 'proteinG',
  1005: 'carbsG',
  1004: 'fatG',
  1079: 'fiberG',
  1093: 'sodiumMg',
};

interface UsdaFood {
  fdcId: number;
  description: string;
  foodCategory?: string | { description?: string };
  foodNutrients: Array<{
    nutrientId?: number;
    nutrient?: { id: number };
    value?: number;
    amount?: number;
  }>;
}

function mapUsdaFood(food: UsdaFood) {
  const macros: Record<string, number> = {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    sodiumMg: 0,
  };

  for (const nutrient of food.foodNutrients) {
    const nutrientId = nutrient.nutrientId ?? nutrient.nutrient?.id;
    const value = nutrient.value ?? nutrient.amount ?? 0;
    if (nutrientId && NUTRIENT_MAP[nutrientId]) {
      macros[NUTRIENT_MAP[nutrientId]] = Math.round(value * 10) / 10;
    }
  }

  const category =
    typeof food.foodCategory === 'string'
      ? food.foodCategory
      : food.foodCategory?.description ?? 'General';

  return {
    fdcId: String(food.fdcId),
    name: food.description,
    nameEs: food.description,
    category,
    source: 'USDA',
    calories: macros.calories,
    proteinG: macros.proteinG,
    carbsG: macros.carbsG,
    fatG: macros.fatG,
    fiberG: macros.fiberG || null,
    sodiumMg: macros.sodiumMg || null,
    servingSizeG: 100,
  };
}

export async function seedUsdaFoods(prisma: PrismaClient): Promise<number> {
  const dataTypes = ['Foundation', 'SR Legacy'];
  let totalSeeded = 0;

  for (const dataType of dataTypes) {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `${USDA_API_BASE}/foods/list?dataType=${encodeURIComponent(dataType)}&pageSize=200&pageNumber=${page}&api_key=${API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
          console.warn(`   USDA API error for ${dataType} page ${page}: ${response.status}`);
          hasMore = false;
          break;
        }

        const foods: UsdaFood[] = await response.json() as UsdaFood[];

        if (!foods.length) {
          hasMore = false;
          break;
        }

        const mapped = foods
          .map(mapUsdaFood)
          .filter((f) => f.calories > 0 && f.proteinG >= 0);

        if (mapped.length > 0) {
          await prisma.food.createMany({
            data: mapped,
            skipDuplicates: true,
          });
          totalSeeded += mapped.length;
        }

        hasMore = foods.length === 200;
        page++;

        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.warn(`   Warning: Could not fetch USDA data (page ${page}):`, (err as Error).message);
        hasMore = false;
      }
    }
  }

  return totalSeeded;
}
