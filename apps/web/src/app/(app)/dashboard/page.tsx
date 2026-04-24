'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import type { NutritionTargets, NutritionPlan } from '@nutriplan/shared';
import { DAY_NAMES_ES } from '@nutriplan/shared';

interface DailySummary {
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
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

  const todayMenu = plan?.weeklyMenus?.find((m) => m.dayOfWeek === todayIndex);
  const consumed = dailySummary?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

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
          <h2 className="font-semibold text-gray-900">Comidas de hoy</h2>
          <Link href="/menu" className="text-sm text-brand-600 font-medium hover:underline">Ver menú completo →</Link>
        </div>

        {loadingPlan ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
          </div>
        ) : todayMenu ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayMenu.meals.map((meal) => (
              <div key={meal.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-brand-600 mb-0.5">{MEAL_LABELS[meal.mealType] ?? meal.mealType}</div>
                  <div className="font-medium text-gray-800 text-sm truncate">{meal.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{meal.calories} kcal · {meal.proteinG}g prot</div>
                </div>
              </div>
            ))}
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
