'use client';

import { useState, useEffect, useRef } from 'react';
import type { Meal } from '@nutriplan/shared';

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST:       'Desayuno',
  MORNING_SNACK:   'Merienda mañana',
  LUNCH:           'Almuerzo',
  AFTERNOON_SNACK: 'Merienda tarde',
  DINNER:          'Cena',
};

const DOT_COLORS: Record<string, string> = {
  BREAKFAST:       '#F5C542',
  MORNING_SNACK:   '#A78BFA',
  LUNCH:           '#5C7A2C',
  AFTERNOON_SNACK: '#A78BFA',
  DINNER:          '#6B80C4',
};

export type MealStatus = 'logged' | 'next' | 'future';

export const PORTION_STEPS = [0.5, 1, 1.5, 2] as const;

interface WeekMealCardProps {
  meal: Meal;
  status: MealStatus;
  portion: number;
  swapping: boolean;
  onSwap: () => void;
  onPortionChange: (direction: 1 | -1) => void;
}

export function WeekMealCard({
  meal,
  status,
  portion,
  swapping,
  onSwap,
  onPortionChange,
}: WeekMealCardProps) {
  const [recipeOpen, setRecipeOpen] = useState(false);
  const wasSwapping = useRef(false);
  useEffect(() => {
    if (wasSwapping.current && !swapping) setRecipeOpen(false);
    wasSwapping.current = swapping;
  }, [swapping]);

  const adjustedCal  = Math.round(meal.calories  * portion);
  const adjustedProt = Math.round(meal.proteinG  * portion);
  const adjustedCarb = Math.round(meal.carbsG    * portion);
  const adjustedFat  = Math.round(meal.fatG      * portion);

  const dotColor = DOT_COLORS[meal.mealType] ?? '#9A8B7A';
  const label    = MEAL_TYPE_LABELS[meal.mealType] ?? meal.mealType;

  const rawIdx      = PORTION_STEPS.indexOf(portion as typeof PORTION_STEPS[number]);
  const portionIdx  = rawIdx === -1 ? 1 : rawIdx; // default to 1× if value is out of range
  const canDecrease = portionIdx > 0;
  const canIncrease = portionIdx < PORTION_STEPS.length - 1;

  const cardStyle: React.CSSProperties = {
    border:     status === 'next'   ? '2px solid #5C7A2C'
              : status === 'logged' ? '1.5px solid #C0E4A8'
              :                       '1.5px solid #EDE3D2',
    background: status === 'logged' ? '#F5FBF0' : '#FFFFFF',
    boxShadow:  status === 'next'
              ? '0 4px 18px rgba(92,122,44,0.13)'
              : '0 1px 4px rgba(44,36,22,0.04)',
  };

  return (
    <div className="rounded-[16px] p-[15px_18px] transition-all" style={cardStyle}>
      <div className="flex items-start justify-between gap-3">

        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-[5px]">
            <div className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: dotColor }} />
            <span
              className="text-[11px] font-extrabold uppercase tracking-[0.5px]"
              style={{ color: status === 'next' ? '#5C7A2C' : '#9A8B7A' }}
            >
              {label}{status === 'next' ? ' · próxima comida' : ''}
            </span>
          </div>

          <div className="text-[14px] font-extrabold leading-[1.35] mb-2" style={{ color: '#2C2416' }}>
            {swapping ? '⏳ Buscando alternativa...' : meal.name}
          </div>

          <div className="flex flex-wrap gap-[6px]">
            {[
              { icon: '🔥', value: adjustedCal,  unit: 'kcal' },
              { icon: '💪', value: adjustedProt, unit: 'g proteína' },
              { icon: '🌾', value: adjustedCarb, unit: 'g carbos' },
              { icon: '🥑', value: adjustedFat,  unit: 'g grasas' },
            ].map(({ icon, value, unit }) => (
              <span
                key={unit}
                className="inline-flex items-center gap-[3px] rounded-full px-[9px] py-[3px] text-[11px] font-bold"
                style={{ background: '#F7F1E8', border: '1px solid #EDE3D2', color: '#7A6E63' }}
              >
                {icon} <span style={{ color: '#2C2416', fontWeight: 900 }}>{value}</span> {unit}
              </span>
            ))}
          </div>
        </div>

        {/* Right: actions */}
        {status === 'logged' ? (
          <span
            className="text-[11px] font-bold px-[10px] py-[4px] rounded-full shrink-0"
            style={{ background: '#DCFCE7', color: '#16A34A' }}
          >
            ✓ Listo
          </span>
        ) : (
          <div className="flex flex-col gap-[6px] shrink-0">
            <button
              onClick={onSwap}
              disabled={swapping}
              className="text-[11px] font-bold px-3 py-[6px] rounded-[9px] border disabled:opacity-40"
              style={{ background: '#FDF0E6', borderColor: '#F5C9A3', color: '#B04E1F' }}
            >
              🔄 Cambiar
            </button>
            <button
              onClick={() => setRecipeOpen(o => !o)}
              className="text-[11px] font-bold px-3 py-[6px] rounded-[9px] border"
              style={{ background: recipeOpen ? '#E3EDDA' : '#F7F1E8', borderColor: recipeOpen ? '#C0DCA0' : '#E0D4C0', color: '#5C7A2C' }}
            >
              📋 Receta
            </button>
          </div>
        )}
      </div>

      {/* Portion controls — all non-logged meals */}
      {status !== 'logged' && (
        <div
          className="flex items-center gap-2 mt-3 pt-3"
          style={{ borderTop: '1px dashed #EDE3D2' }}
        >
          <span className="text-[12px] font-semibold" style={{ color: '#9A8B7A' }}>Porción</span>
          <button
            onClick={() => onPortionChange(-1)}
            disabled={!canDecrease}
            className="w-[26px] h-[26px] rounded-[7px] text-[15px] font-extrabold flex items-center justify-center border-none disabled:opacity-30"
            style={{ background: '#F0EAE0', color: '#5C7A2C' }}
          >−</button>
          <span className="text-[15px] font-black min-w-[32px] text-center" style={{ color: '#2C2416' }}>
            {portion}×
          </span>
          <button
            onClick={() => onPortionChange(1)}
            disabled={!canIncrease}
            className="w-[26px] h-[26px] rounded-[7px] text-[15px] font-extrabold flex items-center justify-center border-none disabled:opacity-30"
            style={{ background: '#F0EAE0', color: '#5C7A2C' }}
          >+</button>
          <span className="text-[11px] font-semibold" style={{ color: '#B0A090' }}>= {adjustedCal} kcal</span>
        </div>
      )}

      {/* Recipe panel */}
      {recipeOpen && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #EDE3D2' }}>
          {meal.description && (
            <p className="text-[12px] mb-3 leading-relaxed" style={{ color: '#6B5A47' }}>{meal.description}</p>
          )}

          {(meal.prepTimeMins > 0 || meal.cookTimeMins > 0) && (
            <div className="flex gap-4 mb-3">
              {meal.prepTimeMins > 0 && (
                <span className="text-[11px] font-semibold" style={{ color: '#9A8B7A' }}>⏱ Prep: {meal.prepTimeMins} min</span>
              )}
              {meal.cookTimeMins > 0 && (
                <span className="text-[11px] font-semibold" style={{ color: '#9A8B7A' }}>🍳 Cocción: {meal.cookTimeMins} min</span>
              )}
            </div>
          )}

          {meal.ingredients?.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.5px] mb-1.5" style={{ color: '#9A8B7A' }}>
                Ingredientes
              </p>
              {meal.ingredients.map((ing, i) => (
                <p key={i} className="text-[12px]" style={{ color: '#6B5A47' }}>
                  · {ing.name} — {ing.quantity} {ing.unit}
                </p>
              ))}
            </div>
          )}

          {meal.preparationSteps?.length > 0 && (
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.5px] mb-1.5" style={{ color: '#9A8B7A' }}>
                Preparación
              </p>
              {meal.preparationSteps.map((step, i) => (
                <p key={i} className="text-[12px] mb-1 leading-relaxed" style={{ color: '#6B5A47' }}>
                  {i + 1}. {step}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
