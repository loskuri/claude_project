'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { NutritionTargets, NutritionPlan } from '@nutriplan/shared';
import { DAY_NAMES_ES } from '@nutriplan/shared';

function MacroBar({ label, current, total, color }: { label: string; current: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{Math.round(current)}/{total}g</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

interface DailySummary {
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
}

export default function DashboardPage() {
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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Hoy, {DAY_NAMES_ES[todayIndex]}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Objetivos nutricionales</h2>
          {loadingTargets ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-6 bg-gray-100 rounded" />)}
            </div>
          ) : targets ? (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Calorías', value: targets.calories, unit: 'kcal', color: 'bg-orange-500' },
                  { label: 'Proteínas', value: targets.proteinG, unit: 'g', color: 'bg-brand-500' },
                  { label: 'Carbos', value: targets.carbsG, unit: 'g', color: 'bg-blue-500' },
                  { label: 'Grasas', value: targets.fatG, unit: 'g', color: 'bg-yellow-500' },
                ].map((m) => (
                  <div key={m.label} className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className={`text-2xl font-bold ${m.color.replace('bg-', 'text-')}`}>{m.value}</div>
                    <div className="text-xs text-gray-500">{m.unit}</div>
                    <div className="text-sm text-gray-700 mt-1">{m.label}</div>
                  </div>
                ))}
              </div>
              <MacroBar label="Proteínas" current={consumed.proteinG} total={targets.proteinG} color="bg-brand-500" />
              <MacroBar label="Carbohidratos" current={consumed.carbsG} total={targets.carbsG} color="bg-blue-500" />
              <MacroBar label="Grasas" current={consumed.fatG} total={targets.fatG} color="bg-yellow-500" />
              <p className="text-xs text-gray-400">
                {Math.round(consumed.calories)} / {targets.calories} kcal consumidas · TMB: {targets.bmr} · TDEE: {targets.tdee}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Completá tu perfil para ver los objetivos</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Comidas de hoy</h2>
          {loadingPlan ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
            </div>
          ) : todayMenu ? (
            <div className="space-y-3">
              {todayMenu.meals.map((meal) => (
                <div key={meal.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-brand-600 font-medium mb-1">{meal.mealType}</div>
                  <div className="font-medium text-gray-800 text-sm">{meal.name}</div>
                  <div className="text-xs text-gray-500">{meal.calories} kcal · P:{meal.proteinG}g · C:{meal.carbsG}g · G:{meal.fatG}g</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-4">Sin plan activo</p>
              <a href="/menu" className="text-brand-600 font-medium text-sm hover:underline">Generar mi plan →</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
