// apps/web/src/app/(app)/mi-semana/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiStream, ApiError } from '@/lib/api-client';
import { getWeekDates, toDateStr, formatDateLong } from '@/lib/week-utils';
import { WeekDayTabs, type DayTabInfo } from '@/components/week-day-tabs';
import { DayMacroSummary } from '@/components/day-macro-summary';
import { WeekMealCard, type MealStatus, PORTION_STEPS } from '@/components/week-meal-card';
import { AddCustomMealModal, type CustomMealInput } from '@/components/add-custom-meal-modal';
import type { NutritionPlan, NutritionTargets, Meal } from '@nutriplan/shared';

const MEAL_TYPE_ORDER = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER'];

function sortMeals(meals: Meal[]): Meal[] {
  return [...meals].sort(
    (a, b) => MEAL_TYPE_ORDER.indexOf(a.mealType) - MEAL_TYPE_ORDER.indexOf(b.mealType),
  );
}

export default function MiSemanaPage() {
  const qc = useQueryClient();
  const today = toDateStr(new Date());
  const weekDates = useMemo(() => getWeekDates(), []);

  const [activeDate, setActiveDate]         = useState(today);
  const [portions, setPortions]             = useState<Record<string, number>>({});
  const [swappingMealId, setSwappingMealId] = useState<string | null>(null);
  const [generating, setGenerating]         = useState(false);
  const [genProgress, setGenProgress]       = useState(0);
  const [genStatus, setGenStatus]           = useState('');
  const [addMealOpen, setAddMealOpen]       = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  const { data: targets } = useQuery<NutritionTargets>({
    queryKey: ['nutrition-targets'],
    queryFn: () => apiFetch('/nutrition/targets'),
  });

  const dayPlans = useQueries({
    queries: weekDates.map(date => {
      const dateStr = toDateStr(date);
      return {
        queryKey: ['diet-by-date', dateStr],
        queryFn: () => apiFetch<NutritionPlan>(`/diet/by-date/${dateStr}`).catch(() => null) as Promise<NutritionPlan | null>,
        retry: false,
      };
    }),
  });

  const { data: dailySummary } = useQuery({
    queryKey: ['meal-logs', activeDate],
    queryFn: () => apiFetch<{ totals: { calories: number; proteinG: number; carbsG: number; fatG: number }; logs: { mealType: string }[] }>(`/meal-logs?date=${activeDate}`),
  });

  const dayTabInfos: DayTabInfo[] = useMemo(() =>
    weekDates.map((date, i) => {
      const plan = dayPlans[i]?.data;
      return {
        date,
        dateStr: toDateStr(date),
        calories: plan?.totalCalories,
        hasPlan: !!(plan?.meals?.length),
      };
    }),
    [weekDates, dayPlans],
  );

  const activeDayIdx = weekDates.findIndex(d => toDateStr(d) === activeDate);
  const activePlan = dayPlans[activeDayIdx]?.data;
  const activeMeals = useMemo(() => sortMeals(activePlan?.meals ?? []), [activePlan]);

  const consumed = dailySummary?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

  const loggedMealIds = useMemo(() => {
    const countsByType = new Map<string, number>();
    for (const log of dailySummary?.logs ?? []) {
      countsByType.set(log.mealType, (countsByType.get(log.mealType) ?? 0) + 1);
    }
    const ids = new Set<string>();
    const byType = new Map<string, Meal[]>();
    for (const meal of activeMeals) {
      const arr = byType.get(meal.mealType) ?? [];
      arr.push(meal);
      byType.set(meal.mealType, arr);
    }
    for (const [type, meals] of byType) {
      const count = countsByType.get(type) ?? 0;
      for (let i = 0; i < Math.min(count, meals.length); i++) {
        ids.add(meals[i].id);
      }
    }
    return ids;
  }, [dailySummary, activeMeals]);

  function getMealStatus(meal: Meal): MealStatus {
    if (loggedMealIds.has(meal.id)) return 'logged';
    const firstUnlogged = activeMeals.find(m => !loggedMealIds.has(m.id));
    if (firstUnlogged?.id === meal.id) return 'next';
    return 'future';
  }

  function getPortion(mealId: string): number {
    return portions[mealId] ?? 1;
  }

  function handlePortionChange(mealId: string, direction: 1 | -1) {
    const current = getPortion(mealId);
    const raw = PORTION_STEPS.indexOf(current as typeof PORTION_STEPS[number]);
    const idx = raw === -1 ? 1 : raw; // default to 1× if value is out of range
    const nextIdx = Math.max(0, Math.min(PORTION_STEPS.length - 1, idx + direction));
    setPortions(prev => ({ ...prev, [mealId]: PORTION_STEPS[nextIdx] }));
  }

  async function handleSwap(mealId: string) {
    setSwappingMealId(mealId);
    setError(null);
    try {
      await apiStream(
        `/diet/meal/${mealId}/swap/stream`,
        { method: 'POST' },
        (event) => {
          if (event.type === 'done') {
            void qc.invalidateQueries({ queryKey: ['diet-by-date', activeDate] });
            void qc.invalidateQueries({ queryKey: ['diet-current'] });
          }
        },
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSwappingMealId(null);
    }
  }

  async function handleGenerateWeek() {
    setGenerating(true);
    setGenProgress(0);
    setGenStatus('Iniciando planificación semanal...');
    setError(null);
    try {
      await apiStream('/diet/generate/week/stream', { method: 'POST', body: '{}' }, (event) => {
        if (event.type === 'status') {
          setGenStatus(event.message as string);
          const total = event.total as number;
          const pct = total > 0 ? Math.round(((event.current as number) / total) * 100) : 0;
          setGenProgress(pct);
        } else if (event.type === 'day-done') {
          void qc.invalidateQueries({ queryKey: ['diet-by-date', event.date as string] });
        } else if (event.type === 'done') {
          setGenProgress(100);
          console.info('[mi-semana] week generation done', event);
          if ((event.generated as number) === 0 && (event.skipped as number) === 7) {
            setError('La semana ya está completa. No hay días nuevos para generar.');
          }
          void qc.invalidateQueries({ queryKey: ['diet-current'] });
        }
      });
    } catch (err) {
      console.error('[mi-semana] Generar semana failed', err);
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  const addCustomMutation = useMutation({
    mutationFn: (input: CustomMealInput) =>
      apiFetch('/meal-logs', {
        method: 'POST',
        body: JSON.stringify({
          date: activeDate,
          mealType: input.mealType,
          name: input.name,
          calories: input.calories,
          proteinG: input.proteinG,
          carbsG: input.carbsG,
          fatG: input.fatG,
          quantity: 1,
          unit: 'porcion',
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['meal-logs', activeDate] });
      setAddMealOpen(false);
    },
    onError: (err) => {
      setError((err as Error).message);
    },
  });

  const activeDate_d = weekDates[activeDayIdx] ?? new Date();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="bg-white rounded-t-[20px] px-6 pt-5 pb-0" style={{ border: '1px solid #EDE3D2', borderBottom: 'none' }}>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[20px] font-black" style={{ color: '#2C2416' }}>Mi Semana</h1>
          <button
            onClick={() => void handleGenerateWeek()}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-white text-[13px] font-extrabold disabled:opacity-60"
            style={{ background: '#5C7A2C', boxShadow: '0 4px 12px rgba(92,122,44,0.25)' }}
          >
            {generating ? `${genProgress}%` : '🌱 Generar semana'}
          </button>
        </div>

        {generating && (
          <div className="mb-3">
            <div className="text-[12px] font-semibold mb-1" style={{ color: '#5C7A2C' }}>{genStatus}</div>
            <div className="h-[5px] rounded-full overflow-hidden" style={{ background: '#F0EAE0' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${genProgress}%`, background: '#5C7A2C' }}
              />
            </div>
          </div>
        )}

        <WeekDayTabs
          days={dayTabInfos}
          activeDate={activeDate}
          onSelect={setActiveDate}
        />
      </div>

      {/* Content */}
      <div
        className="rounded-b-[20px] p-5"
        style={{ background: '#F7F1E8', border: '1px solid #EDE3D2', borderTop: 'none' }}
      >
        {error && (
          <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
            {error}
          </div>
        )}

        {targets && (
          <DayMacroSummary
            consumed={consumed}
            targets={targets}
            dateLabel={formatDateLong(activeDate_d)}
            onAddCustomMeal={() => setAddMealOpen(true)}
          />
        )}

        {activeMeals.length > 0 ? (
          <div className="flex flex-col gap-[10px]">
            {activeMeals.map(meal => (
              <WeekMealCard
                key={meal.id}
                meal={meal}
                status={getMealStatus(meal)}
                portion={getPortion(meal.id)}
                swapping={swappingMealId === meal.id}
                onSwap={() => void handleSwap(meal.id)}
                onPortionChange={(dir) => handlePortionChange(meal.id, dir)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🥗</div>
            <p className="text-[14px] font-bold mb-1" style={{ color: '#6B5A47' }}>
              Sin plan para este día
            </p>
            <p className="text-[12px]" style={{ color: '#9A8B7A' }}>
              Usá &quot;Generar semana&quot; para crear el plan completo.
            </p>
          </div>
        )}
      </div>

      <AddCustomMealModal
        open={addMealOpen}
        onSubmit={(input) => addCustomMutation.mutate(input)}
        onClose={() => setAddMealOpen(false)}
        loading={addCustomMutation.isPending}
      />
    </div>
  );
}
