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

const MEAL_TYPE_ORDER: MealType[] = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER'];
const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: 'Desayuno', MORNING_SNACK: 'Media mañana',
  LUNCH: 'Almuerzo', AFTERNOON_SNACK: 'Merienda', DINNER: 'Cena',
};

const MEAL_COLORS: Record<string, string> = {
  BREAKFAST: 'bg-yellow-100 text-yellow-700',
  MORNING_SNACK: 'bg-orange-100 text-orange-700',
  LUNCH: 'bg-blue-100 text-blue-700',
  AFTERNOON_SNACK: 'bg-purple-100 text-purple-700',
  DINNER: 'bg-indigo-100 text-indigo-700',
};

function mealTypeSortIndex(t: string) {
  const i = MEAL_TYPE_ORDER.indexOf(t as MealType);
  return i === -1 ? 99 : i;
}

function StatCard({ icon, label, value, target, unit, bg, border, barColor, textColor }: {
  icon: string; label: string; value: number; target: number; unit: string;
  bg: string; border: string; barColor: string; textColor: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: textColor }}>{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="mb-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{Math.round(value)}</span>
        <span className="text-xs font-semibold" style={{ color: textColor }}>/ {target}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      <span className="text-xs font-semibold" style={{ color: textColor }}>{pct}% completado</span>
    </div>
  );
}

function CalorieRing({ consumed, target }: { consumed: number; target: number }) {
  const pct = target > 0 ? Math.min(1, consumed / target) : 0;
  const pctDisplay = Math.round(pct * 100);
  const r = 60;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const ringColor = pct >= 1 ? '#dc2626' : pct >= 0.8 ? '#D4622A' : '#5C7A2C';
  const remaining = Math.max(0, target - consumed);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-40 h-40">
        <svg width="160" height="160" className="-rotate-90 absolute inset-0">
          <circle cx="80" cy="80" r={r} fill="none" stroke="#E3EDDA" strokeWidth="14" />
          <circle cx="80" cy="80" r={r} fill="none" stroke={ringColor} strokeWidth="14"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{Math.round(consumed)}</span>
          <span className="text-xs" style={{ color: '#9A7B5A' }}>de {target} kcal</span>
          <span className="text-sm font-bold mt-0.5" style={{ color: ringColor }}>{pctDisplay}%</span>
        </div>
      </div>
      <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ color: '#4A6020', backgroundColor: '#E3EDDA' }}>
        {Math.round(remaining)} kcal restantes
      </span>
    </div>
  );
}

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

  const consumed = dailySummary?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

  const { sortedTodayMeals, loggedMealTypes, nextMealId } = useMemo(() => {
    if (!plan?.meals?.length) return { sortedTodayMeals: [], loggedMealTypes: new Set<string>(), nextMealId: null as string | null };
    const logged = new Set<string>();
    for (const log of dailySummary?.logs ?? []) logged.add(log.mealType);
    const sorted = [...plan.meals].sort((a, b) => mealTypeSortIndex(a.mealType) - mealTypeSortIndex(b.mealType));
    let nextId: string | null = null;
    for (const meal of sorted) { if (!logged.has(meal.mealType)) { nextId = meal.id; break; } }
    return { sortedTodayMeals: sorted, loggedMealTypes: logged, nextMealId: nextId };
  }, [plan, dailySummary?.logs]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const MACRO_CARDS = targets ? [
    { icon: '💪', label: 'Proteínas',     value: consumed.proteinG, target: targets.proteinG, unit: 'g',    bg: '#F2F7EC', border: '#C8DBB5', barColor: '#5C7A2C', textColor: '#4A6020' },
    { icon: '🌾', label: 'Carbohidratos', value: consumed.carbsG,   target: targets.carbsG,   unit: 'g',    bg: '#FEF9EC', border: '#FDE68A', barColor: '#D97706', textColor: '#92400E' },
    { icon: '🥑', label: 'Grasas',        value: consumed.fatG,     target: targets.fatG,     unit: 'g',    bg: '#F2F7EC', border: '#C8DBB5', barColor: '#6B8F35', textColor: '#374814' },
  ] : [];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {greeting}, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {DAY_NAMES_ES[todayIndex]}, {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* 4 Stat Cards */}
      {loadingTargets ? (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1,2,3].map(i => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-28" />)}
        </div>
      ) : targets ? (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {MACRO_CARDS.map(card => (
            <StatCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              target={card.target}
              unit={card.unit}
              bg={card.bg}
              border={card.border}
              barColor={card.barColor}
              textColor={card.textColor}
            />
          ))}
        </div>
      ) : null}

      {/* Calorie Ring */}
      {targets && (
        <div className="rounded-2xl shadow-sm p-6 flex items-center justify-center mb-6" style={{ backgroundColor: 'white', border: '1px solid #EDD5B6' }}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <CalorieRing consumed={consumed.calories} target={targets.calories} />
            <p className="text-xs text-center sm:text-left" style={{ color: '#9A7B5A' }}>
              TMB {targets.bmr} kcal &nbsp;·&nbsp; TDEE {targets.tdee} kcal
            </p>
          </div>
        </div>
      )}

      {/* Plan para hoy */}
      <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: 'white', border: '1px solid #EDD5B6' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-base">Plan para hoy</h2>
          <Link href="/menu" className="text-sm font-semibold hover:underline flex items-center gap-1" style={{ color: '#5C7A2C' }}>
            Ver menú completo <span aria-hidden>→</span>
          </Link>
        </div>

        {loadingPlan ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
          </div>
        ) : sortedTodayMeals.length > 0 ? (
          <div className="space-y-3">
            {sortedTodayMeals.map((meal) => {
              const isLogged = loggedMealTypes.has(meal.mealType);
              const isNext = !isLogged && meal.id === nextMealId;
              const badgeColor = MEAL_COLORS[meal.mealType] ?? 'bg-gray-100 text-gray-600';
              return (
                <div key={meal.id} className={`rounded-2xl border-2 p-4 transition-all ${
                  isNext ? 'border-brand-400 bg-gradient-to-r from-brand-50 to-white shadow-md shadow-brand-500/10'
                  : isLogged ? 'border-emerald-100 bg-emerald-50/60'
                  : 'border-gray-100 bg-gray-50'
                }`}>
                  {isNext && (
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white uppercase tracking-wide">
                      ⚡ Tu próxima comida
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1.5 ${badgeColor}`}>
                        {MEAL_LABELS[meal.mealType] ?? meal.mealType}
                      </span>
                      <div className={`font-bold text-gray-900 truncate ${isNext ? 'text-base' : 'text-sm'}`}>{meal.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                        <span>🔥 {meal.calories} kcal</span>
                        <span>·</span>
                        <span>💪 {meal.proteinG}g prot</span>
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                      isLogged ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isLogged ? '✓ Lista' : 'Pendiente'}
                    </span>
                  </div>
                  {isNext && (
                    <Link href="/menu" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
                      Registrar en el menú →
                    </Link>
                  )}
                </div>
              );
            })}
            {!nextMealId && sortedTodayMeals.length > 0 && (
              <div className="text-center py-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="text-2xl mb-1">🎉</div>
                <p className="text-sm font-bold text-emerald-800">¡Completaste todas las comidas del día!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-5xl mb-3">🥗</div>
            <p className="text-sm mb-2 font-medium" style={{ color: '#6B5A47' }}>Todavía no tenés un plan para hoy</p>
            <p className="text-xs mb-5" style={{ color: '#9A7B5A' }}>Generá tu plan semanal con IA y empezá a comer mejor</p>
            <Link href="/generate-plan" className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl transition text-sm shadow-sm" style={{ backgroundColor: '#D4622A' }}>
              🌱 Generar mi plan con IA
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
