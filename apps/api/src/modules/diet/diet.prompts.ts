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
): string {
  const ageYears = Math.floor(
    (Date.now() - new Date(profile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  );
  const mealsPerDay = preferences?.mealsPerDay ?? 4;
  const mealTypes = getMealTypes(mealsPerDay);
  const mealTypeLabels = mealTypes.map((t) => `${MEAL_TYPE_LABELS[t]} (${t})`).join(', ');
  const allergies = preferences?.allergies?.join(', ') || 'ninguna';
  const disliked = preferences?.dislikedFoods?.join(', ') || 'ninguno';
  const dietaryType = preferences?.dietaryType ?? 'OMNIVORE';

  const weekDays = DAY_NAMES_ES.map((name, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return `${name} ${d.toISOString().split('T')[0]}`;
  });

  return `Generá un plan de alimentación de 7 días para:
- Sexo: ${profile.sex === 'MALE' ? 'Masculino' : 'Femenino'}, Edad: ${ageYears} años
- Altura: ${profile.heightCm}cm, Peso: ${profile.weightKg}kg
- Objetivo: ${profile.goal}
- Tipo de dieta: ${dietaryType}
- Nivel de actividad: ${profile.activityLevel}

OBJETIVOS NUTRICIONALES DIARIOS:
- Calorías: ${targets.calories} kcal
- Proteínas: ${targets.proteinG}g
- Carbohidratos: ${targets.carbsG}g
- Grasas: ${targets.fatG}g

RESTRICCIONES:
- Alergias: ${allergies}
- Alimentos a evitar: ${disliked}
- Comidas por día: ${mealsPerDay} (${mealTypeLabels})

SEMANA DEL: ${weekDays[0]} al ${weekDays[6]}

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

Incluí exactamente 7 días (dayOfWeek 0=Lunes a 6=Domingo). Cada día debe tener exactamente ${mealsPerDay} comidas con los tipos: ${mealTypes.join(', ')}.`;
}
