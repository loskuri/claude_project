import type { UserProfile, UserPreferences, NutritionTargets } from '@nutriplan/shared';
import { DAY_NAMES_ES } from '@nutriplan/shared';

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: 'Desayuno',
  MORNING_SNACK: 'Merienda mañana',
  LUNCH: 'Almuerzo',
  AFTERNOON_SNACK: 'Merienda tarde',
  DINNER: 'Cena',
};

function getMealTypes(mealsPerDay: number): string[] {
  const options: Record<number, string[]> = {
    3: ['BREAKFAST', 'LUNCH', 'DINNER'],
    4: ['BREAKFAST', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER'],
    5: ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER'],
    6: ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'AFTERNOON_SNACK', 'DINNER'],
  };
  return options[mealsPerDay] ?? options[4];
}

export function buildDietPlanPrompt(
  profile: UserProfile,
  preferences: UserPreferences | null,
  targets: NutritionTargets,
  weekStart: Date,
  days = 7,
): string {
  const ageYears = Math.floor(
    (Date.now() - new Date(profile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  );
  const mealsPerDay = preferences?.mealsPerDay ?? 4;
  const mealTypes = getMealTypes(mealsPerDay);
  const mealTypeLabels = mealTypes.map((t) => `${MEAL_TYPE_LABELS[t]} (${t})`).join(', ');
  const allergiesList = (preferences?.allergies ?? []).filter((a) => a.trim());
  const allergies = allergiesList.length ? allergiesList.join(', ') : 'ninguna declarada';
  const dislikedList = (preferences?.dislikedFoods ?? []).filter((f) => f.trim());
  const disliked = dislikedList.length ? dislikedList.join(', ') : 'ninguno declarado';
  const cuisinesList = (preferences?.preferredCuisines ?? []).filter((c) => c.trim());
  const preferredCuisines = cuisinesList.length
    ? cuisinesList.join(', ')
    : 'sin preferencias de cocina indicadas';
  const dietaryType = preferences?.dietaryType ?? 'OMNIVORE';

  const weekDays = DAY_NAMES_ES.slice(0, days).map((name, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return `${name} ${d.toISOString().split('T')[0]}`;
  });

  return `Generá un plan de alimentación de ${days} día${days > 1 ? 's' : ''} para:

PERFIL:
- Sexo: ${profile.sex === 'MALE' ? 'Masculino' : 'Femenino'}, Edad: ${ageYears} años
- Altura: ${profile.heightCm}cm, Peso: ${profile.weightKg}kg
- Objetivo nutricional: ${profile.goal}
- Nivel de actividad: ${profile.activityLevel}

PREFERENCIAS ALIMENTARIAS (del usuario):
- Tipo de dieta: ${dietaryType}
- Cocinas o estilos preferidos (orientar el menú hacia ellos cuando sea compatible con el resto): ${preferredCuisines}
- Comidas por día: ${mealsPerDay} (${mealTypeLabels})

RESTRICCIONES (obligatorio cumplir; no incluir alérgenos ni alimentos rechazados):
- Alergias: ${allergies}
- Alimentos a evitar / que no le gustan (no usar como ingredientes ni como plato principal): ${disliked}

OBJETIVOS NUTRICIONALES DIARIOS:
- Calorías: ${targets.calories} kcal
- Proteínas: ${targets.proteinG}g
- Carbohidratos: ${targets.carbsG}g
- Grasas: ${targets.fatG}g

SEMANA DEL: ${weekDays[0]}${days > 1 ? ` al ${weekDays[days - 1]}` : ''}

Devolvé EXACTAMENTE este JSON (sin texto adicional):
{
  "weeklyPlan": [
    {
      "dayOfWeek": 0,
      "dayName": "${DAY_NAMES_ES[0]}",
      "totalCalories": number,
      "totalProteinG": number,
      "totalCarbsG": number,
      "totalFatG": number,
      "meals": [
        {
          "mealType": "BREAKFAST|MORNING_SNACK|LUNCH|AFTERNOON_SNACK|DINNER",
          "name": "nombre en español",
          "description": "descripción breve",
          "prepTimeMins": number,
          "cookTimeMins": number,
          "calories": number,
          "proteinG": number,
          "carbsG": number,
          "fatG": number,
          "ingredients": [
            { "name": "string", "quantity": number, "unit": "g|ml|units", "calories": number, "proteinG": number, "carbsG": number, "fatG": number }
          ],
          "preparationSteps": ["paso 1", "paso 2"]
        }
      ]
    }
  ]
}

Incluí exactamente ${days} día${days > 1 ? 's' : ''} (dayOfWeek 0=Lunes${days > 1 ? ` a ${days - 1}=${DAY_NAMES_ES[days - 1]}` : ' solamente'}). Cada día debe tener exactamente ${mealsPerDay} comidas con los tipos: ${mealTypes.join(', ')}.`;
}
