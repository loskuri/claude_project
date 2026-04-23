import type { ActivityLevel } from '../types/user.types.js';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTRA_ACTIVE: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: 'Sedentario (poco o ningún ejercicio)',
  LIGHTLY_ACTIVE: 'Levemente activo (ejercicio 1-3 días/semana)',
  MODERATELY_ACTIVE: 'Moderadamente activo (ejercicio 3-5 días/semana)',
  VERY_ACTIVE: 'Muy activo (ejercicio 6-7 días/semana)',
  EXTRA_ACTIVE: 'Extra activo (trabajo físico intenso + ejercicio)',
};
