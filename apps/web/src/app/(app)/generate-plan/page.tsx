'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { apiStream, apiFetch, ApiError } from '@/lib/api-client';
import { DAY_NAMES_ES } from '@nutriplan/shared';

interface Ingredient {
  name: string; quantity: number; unit: string;
  calories: number; proteinG: number; carbsG: number; fatG: number;
}
interface GeneratedMeal {
  id: string; mealType: string; name: string; description: string;
  calories: number; proteinG: number; carbsG: number; fatG: number;
  ingredients: Ingredient[]; preparationSteps: string[];
}
interface GeneratedDay { date: string; meals: GeneratedMeal[]; }

const MEAL_TYPE_ORDER = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER'];
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

function mealSortIdx(t: string) {
  const i = MEAL_TYPE_ORDER.indexOf(t);
  return i === -1 ? 99 : i;
}

const STEPS = [
  { icon: '🧮', title: 'Calculamos tus macros', desc: 'Basado en tu perfil, peso, altura y objetivo.' },
  { icon: '🌿', title: 'Elegimos ingredientes', desc: 'Priorizamos la cocina argentina con ingredientes accesibles.' },
  { icon: '📅', title: 'Armamos tu plan', desc: 'Un menú completo con desayuno, almuerzo, merienda y cena.' },
  { icon: '🛒', title: 'Lista de compras lista', desc: 'Los ingredientes de la semana se agrupan automáticamente.' },
];

function MealCard({
  meal, swapping, swapStatus, onSwap,
}: {
  meal: GeneratedMeal;
  swapping: boolean;
  swapStatus: string;
  onSwap: () => void;
}) {
  const badge = MEAL_COLORS[meal.mealType] ?? 'bg-gray-100 text-gray-600';
  return (
    <div className={`rounded-2xl border p-4 transition-all ${swapping ? 'opacity-60' : 'border-gray-100 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1.5 ${badge}`}>
            {MEAL_LABELS[meal.mealType] ?? meal.mealType}
          </span>
          <div className="font-bold text-gray-900 text-sm truncate">{meal.name}</div>
          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
            <span>🔥 {meal.calories} kcal</span>
            <span>·</span>
            <span>💪 {meal.proteinG}g prot</span>
          </div>
          {swapping && swapStatus && (
            <p className="text-xs mt-1 font-medium" style={{ color: '#5C7A2C' }}>{swapStatus}</p>
          )}
        </div>
        <button
          onClick={onSwap}
          disabled={swapping}
          className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition disabled:opacity-40"
          style={{ borderColor: '#F5C9A3', color: '#B04E1F', backgroundColor: '#FDF4EE' }}
          title="No me gusta esta comida"
        >
          {swapping ? (
            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : '🔄'} No me gusta
        </button>
      </div>
    </div>
  );
}

export default function GeneratePlanPage() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const todayIndex = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();

  const [mode, setMode] = useState<'idle' | 'generating-day' | 'generating-week' | 'result'>('idle');
  const [genType, setGenType] = useState<'day' | 'week'>('day');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [generatedDays, setGeneratedDays] = useState<GeneratedDay[]>([]);
  const [swappingMealId, setSwappingMealId] = useState<string | null>(null);
  const [swapStatus, setSwapStatus] = useState('');
  const [recipesProgress, setRecipesProgress] = useState({ done: 0, total: 0 });
  const [recipesState, setRecipesState] = useState<'idle' | 'generating' | 'done'>('idle');

  const isBusy = mode === 'generating-day' || mode === 'generating-week';

  const todayMeals = useMemo(
    () => [...(generatedDays.find(d => d.date === today)?.meals ?? generatedDays[0]?.meals ?? [])]
      .sort((a, b) => mealSortIdx(a.mealType) - mealSortIdx(b.mealType)),
    [generatedDays, today],
  );

  const otherDays = useMemo(
    () => generatedDays.filter(d => d.date !== today),
    [generatedDays, today],
  );

  async function autoGenerateRecipes(days: GeneratedDay[]) {
    const allMeals = days.flatMap(d => d.meals);
    if (!allMeals.length) return;
    setRecipesState('generating');
    setRecipesProgress({ done: 0, total: allMeals.length });
    let done = 0;
    for (const meal of allMeals) {
      try {
        await apiFetch('/recipes/auto-generate', {
          method: 'POST',
          body: JSON.stringify({
            mealType: meal.mealType,
            suggestionsText: meal.name,
            ingredientsText: meal.ingredients.map(i => i.name).join(', '),
          }),
        });
      } catch {
        // Rate limit or error — continue
      }
      done++;
      setRecipesProgress({ done, total: allMeals.length });
    }
    setRecipesState('done');
    void qc.invalidateQueries({ queryKey: ['saved-recipes'] });
  }

  async function generateDay() {
    setMode('generating-day');
    setGenType('day');
    setError(null);
    setProgress(0);
    setStatus('Iniciando...');
    try {
      await apiStream(
        '/diet/generate/stream',
        { method: 'POST', body: JSON.stringify({ date: today }) },
        (event) => {
          if (event.type === 'status') setStatus(event.message as string);
          else if (event.type === 'chunk') setProgress(Math.min(95, Math.round(((event.chars as number) / 6500) * 100)));
          else if (event.type === 'done') {
            const plan = event.plan as { meals: GeneratedMeal[] };
            const days: GeneratedDay[] = [{ date: today, meals: plan.meals }];
            setGeneratedDays(days);
            void qc.invalidateQueries({ queryKey: ['diet-by-date', today] });
            void qc.invalidateQueries({ queryKey: ['diet-current'] });
            setProgress(100);
            setMode('result');
            void autoGenerateRecipes(days);
          }
        },
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
      setMode('idle');
    }
  }

  async function generateWeek() {
    setMode('generating-week');
    setGenType('week');
    setError(null);
    setProgress(0);
    setStatus('Iniciando planificación semanal...');
    const collectedDays: GeneratedDay[] = [];
    try {
      await apiStream('/diet/generate/week/stream', { method: 'POST', body: '{}' }, (event) => {
        if (event.type === 'status') {
          setStatus(event.message as string);
          const pct = Math.round(((event.current as number) / (event.total as number)) * 100);
          setProgress(isNaN(pct) ? 0 : pct);
        } else if (event.type === 'day-done') {
          const date = event.date as string;
          const meals = (event.meals ?? []) as GeneratedMeal[];
          collectedDays.push({ date, meals });
          setGeneratedDays([...collectedDays]);
          void qc.invalidateQueries({ queryKey: ['diet-by-date', date] });
        } else if (event.type === 'done') {
          setProgress(100);
          void qc.invalidateQueries({ queryKey: ['diet-current'] });
          setMode('result');
          void autoGenerateRecipes(collectedDays);
        }
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
      setMode('idle');
    }
  }

  async function swapMeal(mealId: string) {
    setSwappingMealId(mealId);
    setSwapStatus('');
    try {
      await apiStream(
        `/diet/meal/${mealId}/swap/stream`,
        { method: 'POST' },
        (event) => {
          if (event.type === 'status') setSwapStatus(event.message as string);
          else if (event.type === 'done') {
            const newMeal = event.meal as GeneratedMeal;
            setGeneratedDays(prev =>
              prev.map(day => ({
                ...day,
                meals: day.meals.map(m => m.id === mealId ? newMeal : m),
              })),
            );
            void autoGenerateRecipes([{ date: today, meals: [newMeal] }]);
          }
        },
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSwappingMealId(null);
      setSwapStatus('');
    }
  }

  // ─── Result view ───────────────────────────────────────────────────────────
  if (mode === 'result') {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {genType === 'week' ? 'Plan semanal generado ✓' : `Plan del ${DAY_NAMES_ES[todayIndex]} listo ✓`}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#9A7B5A' }}>
              {genType === 'week'
                ? `${generatedDays.length} días generados · podés cambiar lo que no te gusta`
                : 'Cambiá lo que no te gusta · las recetas se generan solas'}
            </p>
          </div>
          <Link
            href="/menu"
            className="text-sm font-semibold hover:underline flex items-center gap-1"
            style={{ color: '#5C7A2C' }}
          >
            Ver menú →
          </Link>
        </div>

        {error && (
          <div className="rounded-xl p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {/* Today's meals */}
        {todayMeals.length > 0 && (
          <div className="rounded-2xl shadow-sm p-5 mb-4" style={{ backgroundColor: 'white', border: '1px solid #EDD5B6' }}>
            <h2 className="font-bold text-gray-900 text-sm mb-3">
              Hoy — {DAY_NAMES_ES[todayIndex]} {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
            </h2>
            <div className="space-y-2.5">
              {todayMeals.map(meal => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  swapping={swappingMealId === meal.id}
                  swapStatus={swapStatus}
                  onSwap={() => void swapMeal(meal.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other days (week mode) */}
        {otherDays.length > 0 && (
          <div className="rounded-2xl shadow-sm p-5 mb-4" style={{ backgroundColor: 'white', border: '1px solid #EDD5B6' }}>
            <h2 className="font-bold text-gray-900 text-sm mb-3">Resto de la semana</h2>
            <div className="space-y-2">
              {otherDays.map(day => {
                const jsDate = new Date(day.date + 'T12:00:00Z');
                const jsDay = jsDate.getUTCDay();
                const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
                const label = DAY_NAMES_ES[dayIdx] ?? day.date;
                const formatted = jsDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
                return (
                  <div key={day.date} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ backgroundColor: '#F2F7EC' }}>
                    <span className="text-sm font-semibold text-gray-700">{label} {formatted}</span>
                    <span className="text-xs font-medium" style={{ color: '#5C7A2C' }}>{day.meals.length} comidas ✓</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recipes progress */}
        {recipesState !== 'idle' && (
          <div className="rounded-2xl p-4 mb-3 border" style={{ backgroundColor: '#F2F7EC', borderColor: '#C8DBB5' }}>
            {recipesState === 'generating' ? (
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" style={{ color: '#5C7A2C' }}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: '#4A6020' }}>
                  Generando recetas... ({recipesProgress.done}/{recipesProgress.total})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-base">🍳</span>
                <span className="text-sm font-semibold" style={{ color: '#4A6020' }}>
                  {recipesProgress.total} recetas guardadas
                </span>
                <Link href="/recipes" className="ml-auto text-xs font-bold hover:underline" style={{ color: '#5C7A2C' }}>
                  Ver recetas →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Shopping list card */}
        <div className="rounded-2xl p-4 mb-4 border flex items-center justify-between gap-3" style={{ backgroundColor: '#F0FAF8', borderColor: '#99D6CC' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛒</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">Lista de compras actualizada</p>
              <p className="text-xs" style={{ color: '#4A7B74' }}>Los ingredientes de la semana ya están consolidados.</p>
            </div>
          </div>
          <Link
            href="/shopping-list"
            className="shrink-0 px-3 py-1.5 text-sm font-bold rounded-xl text-white transition"
            style={{ backgroundColor: '#2A9D8F' }}
          >
            Ver lista →
          </Link>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => { setMode('idle'); setGeneratedDays([]); setRecipesState('idle'); setError(null); }}
            className="flex-1 py-3 font-semibold rounded-xl border-2 text-sm transition"
            style={{ borderColor: '#C8DBB5', color: '#4A6020' }}
          >
            Generar otro plan
          </button>
          <Link
            href="/menu"
            className="flex-1 py-3 text-white font-bold rounded-xl text-sm text-center transition"
            style={{ backgroundColor: '#5C7A2C' }}
          >
            Ver mi menú →
          </Link>
        </div>
      </div>
    );
  }

  // ─── Generation / idle view ────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Generar plan con IA</h1>
        <p className="text-sm" style={{ color: '#6B5A47' }}>
          La IA analiza tu perfil nutricional y crea un plan personalizado, adaptado a la cocina argentina.
        </p>
      </div>

      {/* How it works */}
      {!isBusy && (
        <div className="rounded-2xl p-6 mb-8 border" style={{ backgroundColor: '#FEFCF9', borderColor: '#EDD5B6' }}>
          <h2 className="text-sm font-bold mb-4 uppercase tracking-wide" style={{ color: '#6B5A47' }}>Cómo funciona</h2>
          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: '#E3EDDA' }}>{s.icon}</div>
                <div>
                  <div className="text-xs font-bold mb-0.5" style={{ color: '#9A7B5A' }}>Paso {i + 1}</div>
                  <div className="text-sm font-semibold text-gray-900">{s.title}</div>
                  <div className="text-xs" style={{ color: '#6B5A47' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      {isBusy && (
        <div className="rounded-2xl p-6 mb-8 border" style={{ backgroundColor: '#F2F7EC', borderColor: '#C8DBB5' }}>
          <div className="flex items-center gap-3 mb-4">
            <svg className="animate-spin h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" style={{ color: '#5C7A2C' }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm font-medium flex-1" style={{ color: '#4A6020' }}>{status}</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: '#4A6020' }}>{progress}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#C8DBB5' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: '#5C7A2C' }} />
          </div>
          <p className="text-xs mt-3" style={{ color: '#9A7B5A' }}>
            {mode === 'generating-week' ? 'Generando los 7 días, esto puede tomar ~1 minuto...' : 'Generando tu plan de hoy, ~15 segundos...'}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* CTAs */}
      {!isBusy && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => void generateDay()}
            className="rounded-2xl p-6 text-left border-2 transition"
            style={{ backgroundColor: 'white', borderColor: '#C8DBB5' }}
          >
            <div className="text-3xl mb-3">🌅</div>
            <div className="font-bold text-gray-900 mb-1">Plan de hoy</div>
            <div className="text-sm mb-4" style={{ color: '#6B5A47' }}>Generá el menú completo para el día de hoy.</div>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: '#5C7A2C' }}>
              Generar ahora →
            </span>
          </button>
          <button
            onClick={() => void generateWeek()}
            className="rounded-2xl p-6 text-left border-2 transition"
            style={{ backgroundColor: '#F2F7EC', borderColor: '#ACC990' }}
          >
            <div className="text-3xl mb-3">📅</div>
            <div className="font-bold text-gray-900 mb-1">Plan semanal</div>
            <div className="text-sm mb-4" style={{ color: '#6B5A47' }}>Generá los 7 días de la semana de una vez.</div>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: '#4A6020' }}>
              Planificar semana →
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
