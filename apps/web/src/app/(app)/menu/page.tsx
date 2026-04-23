'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { NutritionPlan, Meal } from '@nutriplan/shared';
import { DAY_NAMES_ES } from '@nutriplan/shared';

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: 'Desayuno',
  MORNING_SNACK: 'Merienda mañana',
  LUNCH: 'Almuerzo',
  AFTERNOON_SNACK: 'Merienda tarde',
  DINNER: 'Cena',
};

function MealCard({ meal }: { meal: Meal }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-brand-50 transition" onClick={() => setOpen(!open)}>
      <div className="text-xs text-brand-600 font-medium">{MEAL_TYPE_LABELS[meal.mealType] ?? meal.mealType}</div>
      <div className="font-medium text-gray-800 text-sm mt-0.5">{meal.name}</div>
      <div className="text-xs text-gray-500">{meal.calories} kcal · P:{meal.proteinG}g · C:{meal.carbsG}g · G:{meal.fatG}g</div>
      {open && (
        <div className="mt-3 text-sm text-gray-600 border-t border-gray-200 pt-3 space-y-2">
          <p className="text-gray-500">{meal.description}</p>
          <div>
            <strong className="text-xs uppercase text-gray-400">Ingredientes</strong>
            <ul className="mt-1 space-y-0.5">
              {(meal.ingredients as Array<{ name: string; quantity: number; unit: string }>).map((ing, i) => (
                <li key={i} className="text-xs">{ing.name} — {ing.quantity}{ing.unit}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong className="text-xs uppercase text-gray-400">Preparación</strong>
            <ol className="mt-1 space-y-1 list-decimal list-inside">
              {(meal.preparationSteps as string[]).map((step, i) => (
                <li key={i} className="text-xs">{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  const qc = useQueryClient();
  const [selectedDay, setSelectedDay] = useState(0);

  const { data: plan, isLoading, error } = useQuery<NutritionPlan>({
    queryKey: ['diet-current'],
    queryFn: () => apiFetch('/diet/current'),
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: () => apiFetch('/diet/generate', { method: 'POST', body: '{}' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diet-current'] }),
  });

  const dayMenu = plan?.weeklyMenus?.find((m) => m.dayOfWeek === selectedDay);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mi menú semanal</h1>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition disabled:opacity-60"
        >
          {generateMutation.isPending ? 'Generando con IA...' : '✨ Generar plan'}
        </button>
      </div>

      {generateMutation.isPending && (
        <div className="mb-6 bg-brand-50 border border-brand-200 rounded-xl p-4 text-brand-700 text-sm">
          La IA está creando tu plan personalizado, esto puede tomar hasta 30 segundos...
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : error && !plan ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-6">Todavía no tenés un plan semanal</p>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition"
          >
            Generar mi primer plan
          </button>
        </div>
      ) : plan ? (
        <>
          <div className="grid grid-cols-7 gap-2 mb-6">
            {plan.weeklyMenus.map((menu) => (
              <button
                key={menu.dayOfWeek}
                onClick={() => setSelectedDay(menu.dayOfWeek)}
                className={`p-3 rounded-xl text-center transition border-2 ${selectedDay === menu.dayOfWeek ? 'border-brand-600 bg-brand-50' : 'border-transparent bg-white hover:border-brand-200'}`}
              >
                <div className="text-xs font-medium text-gray-500">{DAY_NAMES_ES[menu.dayOfWeek]?.slice(0, 3)}</div>
                <div className="text-sm font-semibold text-gray-800 mt-1">{Math.round(menu.totalCalories)}</div>
                <div className="text-xs text-gray-400">kcal</div>
              </button>
            ))}
          </div>

          {dayMenu && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{DAY_NAMES_ES[selectedDay]}</h2>
                <div className="text-sm text-gray-500">
                  {dayMenu.totalCalories} kcal · P:{dayMenu.totalProteinG}g · C:{dayMenu.totalCarbsG}g · G:{dayMenu.totalFatG}g
                </div>
              </div>
              <div className="space-y-3">
                {dayMenu.meals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
