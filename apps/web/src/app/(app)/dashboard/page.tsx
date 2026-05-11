'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import type { NutritionTargets, NutritionPlan, MealType } from '@nutriplan/shared';
import { DAY_NAMES_ES } from '@nutriplan/shared';

interface DailySummary {
  date?: string;
  logs?: { mealType: string }[];
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
}

const MEAL_TYPE_ORDER: MealType[] = [
  'BREAKFAST',
  'MORNING_SNACK',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER',
];

function mealTypeSortIndex(mealType: string): number {
  const i = MEAL_TYPE_ORDER.indexOf(mealType as MealType);
  return i === -1 ? 99 : i;
}

function CalorieRing({ consumed, target }: { consumed: number; target: number }) {
  const pct = target > 0 ? Math.min(1, consumed / target) : 0;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const remaining = Math.max(0, target - consumed);
  return (
    <div className="flex flex-col items-center">
      <svg width="136" height="136" className="-rotate-90">
        <circle cx="68" cy="68" r={r} fill="none" stroke="#f0fdf4" strokeWidth="12" />
        <circle cx="68" cy="68" r={r} fill="none" stroke="#16a34a" strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div className="-mt-[88px] flex flex-col items-center">
        <span className="text-2xl font-bold text-gray-900">{Math.round(consumed)}</span>
        <span className="text-xs text-gray-400">de {target} kcal</span>
      </div>
      <div className="mt-[56px] text-xs text-brand-700 font-medium">{Math.round(remaining)} kcal restantes</div>
    </div>
  );
}

function MacroBar({ label, current, total, color }: { label: string; current: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-400">{Math.round(current)}<span className="text-gray-300">/{total}g</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: 'Desayuno', MORNING_SNACK: 'Media mañana',
  LUNCH: 'Almuerzo', AFTERNOON_SNACK: 'Merienda', DINNER: 'Cena',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();
  const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const { data: targets, isLoading: loadingTargets } = useQuery<NutritionTargets>({
    queryKey: ['nutrition-targets'],
    queryFn: () => apiFetch('/nutrition/targets'),
  });

  const { data: plan, isLoading: loadingPlan } = useQuery<NutritionPlan>({
    queryKey: ['diet-current'],
    queryFn: () => apiFetch('/diet/current'),
    retry: false,
  });

  const { data: dailySummary } = useQuery<DailySummary>({
    queryKey: ['meal-logs-today', today],
    queryFn: () => apiFetch(`/meal-logs?date=${today}`),
  });

  const todayMenu = plan;
  const consumed = dailySummary?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

  const { sortedTodayMeals, loggedMealTypes, nextMealId } = useMemo(() => {
    if (!todayMenu?.meals?.length) {
      return { sortedTodayMeals: [], loggedMealTypes: new Set<string>(), nextMealId: null as string | null };
    }
    const logged = new Set<string>();
    for (const log of dailySummary?.logs ?? []) {
      logged.add(log.mealType);
    }
    const sorted = [...todayMenu.meals].sort(
      (a, b) => mealTypeSortIndex(a.mealType) - mealTypeSortIndex(b.mealType),
    );
    let nextId: string | null = null;
    for (const meal of sorted) {
      if (!logged.has(meal.mealType)) {
        nextId = meal.id;
        break;
      }
    }
    return { sortedTodayMeals: sorted, loggedMealTypes: logged, nextMealId: nextId };
  }, [todayMenu, dailySummary?.logs]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {user?.firstName} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">{DAY_NAMES_ES[todayIndex]}, {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Calorías del día */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center">
          {loadingTargets ? (
            <div className="animate-pulse w-32 h-32 rounded-full bg-gray-100" />
          ) : targets ? (
            <CalorieRing consumed={consumed.calories} target={targets.calories} />
          ) : (
            <div className="text-center text-gray-400 text-sm py-4">
              <p className="mb-3">Completá tu perfil primero</p>
              <Link href="/onboarding" className="text-brand-600 font-medium hover:underline">Ir al onboarding →</Link>
            </div>
          )}
        </div>

        {/* Macros */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Macros de hoy</h2>
          {loadingTargets ? (
            <div className="space-y-4 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-5 bg-gray-100 rounded" />)}
            </div>
          ) : targets ? (
            <div className="space-y-4">
              <MacroBar label="Proteínas" current={consumed.proteinG} total={targets.proteinG} color="bg-brand-500" />
              <MacroBar label="Carbohidratos" current={consumed.carbsG} total={targets.carbsG} color="bg-blue-500" />
              <MacroBar label="Grasas" current={consumed.fatG} total={targets.fatG} color="bg-yellow-400" />
              <p className="text-xs text-gray-400 pt-1">TMB {targets.bmr} · TDEE {targets.tdee} kcal</p>
            </div>
          ) : null}
        </div>

        {/* Objetivos numéricos */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Mis objetivos</h2>
          {targets ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calorías', value: targets.calories, unit: 'kcal', bg: 'bg-orange-50', text: 'text-orange-600' },
                { label: 'Proteínas', value: targets.proteinG, unit: 'g', bg: 'bg-brand-50', text: 'text-brand-700' },
                { label: 'Carbos', value: targets.carbsG, unit: 'g', bg: 'bg-blue-50', text: 'text-blue-700' },
                { label: 'Grasas', value: targets.fatG, unit: 'g', bg: 'bg-yellow-50', text: 'text-yellow-700' },
              ].map((m) => (
                <div key={m.label} className={`${m.bg} rounded-xl p-3 text-center`}>
                  <div className={`text-xl font-bold ${m.text}`}>{m.value}</div>
                  <div className="text-xs text-gray-500">{m.unit}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="animate-pulse space-y-3">
              {[1,2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
            </div>
          )}
        </div>
      </div>

      {/* Comidas de hoy */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Plan para hoy</h2>
          <Link href="/menu" className="text-sm text-brand-600 font-medium hover:underline">Ver menú completo →</Link>
        </div>

        {loadingPlan ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
          </div>
        ) : todayMenu ? (
          <div className="flex flex-col gap-3 max-w-xl">
            {sortedTodayMeals.map((meal) => {
              const isLogged = loggedMealTypes.has(meal.mealType);
              const isNext = !isLogged && meal.id === nextMealId;
              return (
                <div
                  key={meal.id}
                  className={
                    isNext
                      ? 'relative rounded-2xl border-2 border-brand-500 bg-gradient-to-br from-brand-50 to-white p-4 shadow-md shadow-brand-500/15 ring-4 ring-brand-200/60'
                      : isLogged
                        ? 'rounded-xl border border-emerald-100 bg-emerald-50/70 p-4'
                        : 'rounded-xl border border-gray-100 bg-gray-50 p-4'
                  }
                >
                  {isNext ? (
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      <span aria-hidden>→</span> Tu próxima comida
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-brand-700 mb-0.5">
                        {MEAL_LABELS[meal.mealType] ?? meal.mealType}
                      </div>
                      <div className={`font-semibold text-gray-900 truncate ${isNext ? 'text-base' : 'text-sm'}`}>
                        {meal.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {meal.calories} kcal · {meal.proteinG}g prot
                      </div>
                    </div>
                    <div
                      className={
                        isLogged
                          ? 'shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-2.5 py-1 text-xs font-semibold text-emerald-800'
                          : 'shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900'
                      }
                    >
                      {isLogged ? (
                        <>
                          <span aria-hidden>✓</span> Registrada
                        </>
                      ) : (
                        <>Pendiente</>
                      )}
                    </div>
                  </div>
                  {isNext ? (
                    <p className="mt-3 text-sm text-brand-900">
                      <span className="font-medium">Registrá esta comida en el menú</span>
                      {' '}para seguir tu día.{' '}
                      <Link href="/menu" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">
                        Ir al menú
                      </Link>
                    </p>
                  ) : null}
                </div>
              );
            })}
            {!nextMealId && sortedTodayMeals.length > 0 ? (
              <p className="text-center text-sm font-medium text-emerald-800 bg-emerald-50 rounded-xl py-3 px-4 border border-emerald-100">
                ¡Listo! Ya registraste todas las comidas del plan de hoy.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🥗</div>
            <p className="text-gray-500 text-sm mb-4">Todavía no tenés un plan semanal</p>
            <Link href="/menu" className="inline-block px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition text-sm">
              ✨ Generar mi plan con IA
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
