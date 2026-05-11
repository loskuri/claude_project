'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiStream, ApiError } from '@/lib/api-client';
import type { NutritionPlan, Meal, NutritionTargets } from '@nutriplan/shared';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: 'Desayuno',
  MORNING_SNACK: 'Merienda mañana',
  LUNCH: 'Almuerzo',
  AFTERNOON_SNACK: 'Merienda tarde',
  DINNER: 'Cena',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface MealLogEntry {
  id: string;
  date: string;
  mealType: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  quantity: number;
  unit: string;
  notes: string | null;
  loggedAt: string;
}

interface DailySummary {
  date: string;
  logs: MealLogEntry[];
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
}

interface AdjustedTargets {
  calories: number; proteinG: number; carbsG: number; fatG: number;
  adjusted: boolean; message: string | null;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getUTCDateAtOffset(offset: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** e.g. "Lunes 24/5" (UTC, es-AR weekday) */
function formatWeekdayDayMonth(d: Date): string {
  const weekday = d.toLocaleDateString('es-AR', { weekday: 'long', timeZone: 'UTC' });
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${cap} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>{Math.round(value)}g / {Math.round(target)}g</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LogModal({
  meal,
  initialPortions = 1,
  isEdit = false,
  onConfirm,
  onClose,
}: {
  meal: Meal;
  initialPortions?: number;
  isEdit?: boolean;
  onConfirm: (meal: Meal, portions: number, notes: string) => void;
  onClose: () => void;
}) {
  const [portions, setPortions] = useState(initialPortions);
  const [notes, setNotes] = useState('');
  const scaled = (v: number) => Math.round(v * portions);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-semibold text-gray-900 mb-1">{isEdit ? 'Editar registro' : 'Registrar comida'}</h3>
        <p className="text-sm text-gray-500 mb-4">{meal.name}</p>
        <label className="text-sm font-medium text-gray-700 block mb-2">Porciones</label>
        <div className="flex gap-2 mb-4">
          {[0.5, 1, 1.5, 2].map((n) => (
            <button key={n} onClick={() => setPortions(n)}
              className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition ${portions === n ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}>
              {n}x
            </button>
          ))}
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 mb-4">
          {scaled(meal.calories)} kcal · P:{scaled(meal.proteinG)}g · C:{scaled(meal.carbsG)}g · G:{scaled(meal.fatG)}g
        </div>
        <input
          type="text" placeholder="Nota opcional..." value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700">Cancelar</button>
          <button onClick={() => onConfirm(meal, portions, notes)} className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold">
            {isEdit ? 'Actualizar' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomMealModal({
  onConfirm,
  onClose,
  isLoading,
  error,
}: {
  onConfirm: (text: string) => void;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [text, setText] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-semibold text-gray-900 mb-1">Agregar comida</h3>
        <p className="text-sm text-gray-500 mb-4">
          Describí la comida y la IA calculará sus macros automáticamente.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ej: 2 milanesas de pollo con puré de papa y ensalada de tomate"
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
          disabled={isLoading}
        />
        {error && (
          <p className="text-xs text-red-600 mb-3">{error}</p>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} disabled={isLoading} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={() => text.trim() && onConfirm(text.trim())}
            disabled={isLoading || text.trim().length === 0}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Analizando...
              </>
            ) : '✨ Analizar con IA'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MealCard({
  meal,
  onLog,
  loggedPortions,
}: {
  meal: Meal;
  onLog: (meal: Meal) => void;
  loggedPortions?: number;
}) {
  const [open, setOpen] = useState(false);
  const isLogged = loggedPortions !== undefined;

  return (
    <div className={`p-3 rounded-xl ${isLogged ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 cursor-pointer" onClick={() => setOpen(!open)}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-brand-600 font-medium">{MEAL_TYPE_LABELS[meal.mealType] ?? meal.mealType}</span>
            {isLogged && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Registrado · {loggedPortions}x
              </span>
            )}
          </div>
          <div className="font-medium text-gray-800 text-sm mt-0.5">{meal.name}</div>
          <div className="text-xs text-gray-500">{meal.calories} kcal · P:{meal.proteinG}g · C:{meal.carbsG}g · G:{meal.fatG}g</div>
        </div>
        <button
          onClick={() => onLog(meal)}
          className="flex-shrink-0 px-2.5 py-1 text-xs font-medium text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition"
        >
          {isLogged ? 'Editar' : 'Registrar'}
        </button>
      </div>
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

function MealLogItem({
  log,
  onDelete,
}: {
  log: MealLogEntry;
  onDelete: (logId: string) => void;
}) {
  const isCustom = log.notes?.startsWith('Descripción original:');
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">{MEAL_TYPE_LABELS[log.mealType] ?? log.mealType}</span>
          {isCustom && (
            <span className="text-xs bg-purple-100 text-purple-700 font-medium px-1.5 py-0.5 rounded-full">IA</span>
          )}
        </div>
        <div className="text-sm font-medium text-gray-800 truncate">{log.name}</div>
        <div className="text-xs text-gray-400">{Math.round(log.calories)} kcal · {log.quantity}x</div>
      </div>
      <button
        onClick={() => onDelete(log.id)}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
        aria-label="Eliminar registro"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const qc = useQueryClient();
  const [dateOffset, setDateOffsetState] = useState(0);
  const setDateOffset = (n: number) => setDateOffsetState(Math.max(0, Math.min(6, n)));
  const [logModal, setLogModal] = useState<{ meal: Meal; isEdit: boolean } | null>(null);
  const [customMealModal, setCustomMealModal] = useState(false);
  const [customMealError, setCustomMealError] = useState<string | null>(null);
  const [logSuccess, setLogSuccess] = useState<string | null>(null);

  // Single-day generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<string | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Week generation state
  const [isWeekGenerating, setIsWeekGenerating] = useState(false);
  const [weekProgress, setWeekProgress] = useState<{ message: string; current: number; total: number } | null>(null);
  const [weekResult, setWeekResult] = useState<{ generated: number; skipped: number } | null>(null);
  const [weekError, setWeekError] = useState<string | null>(null);

  const ESTIMATED_TOTAL_CHARS = 6500;
  const selectedDate = getUTCDateAtOffset(dateOffset);
  const dateStr = toDateStr(selectedDate);
  const isToday = dateOffset === 0;
  const canGenerate = dateOffset >= 0 && dateOffset <= 6; // allow only today + next 6 days
  const isBusy = isGenerating || isWeekGenerating;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = getUTCDateAtOffset(i);
    return { offset: i, date: d, dateStr: toDateStr(d) };
  });

  // ─── Queries ──────────────────────────────────────────────────────────────

  const weekPlanQueries = useQueries({
    queries: weekDays.map(({ dateStr: ds }) => ({
      queryKey: ['diet-by-date', ds] as const,
      queryFn: async (): Promise<NutritionPlan | null> => {
        try {
          return await apiFetch<NutritionPlan>(`/diet/by-date/${ds}`);
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) return null;
          throw err;
        }
      },
      retry: false,
    })),
  });

  const planQuery = weekPlanQueries[dateOffset];
  const plan = planQuery?.data ?? null;
  const isPlanLoading = planQuery?.isLoading ?? true;

  const { data: dayLogs } = useQuery<DailySummary>({
    queryKey: ['meal-logs', dateStr],
    queryFn: () => apiFetch(`/meal-logs?date=${dateStr}`),
    refetchInterval: 30_000,
  });

  const { data: baseTargets } = useQuery<NutritionTargets>({
    queryKey: ['nutrition-targets'],
    queryFn: () => apiFetch('/nutrition/targets'),
  });

  const { data: adjustedTargets } = useQuery<AdjustedTargets>({
    queryKey: ['diet-adjusted-targets'],
    queryFn: () => apiFetch('/diet/targets/adjusted'),
  });

  // ─── Derived state ────────────────────────────────────────────────────────

  // Build a name → {logId, portions} map from the loaded logs so we can detect dupes
  const loggedMap = useMemo(() => {
    const map: Record<string, { logId: string; portions: number }> = {};
    for (const log of dayLogs?.logs ?? []) {
      map[log.name] = { logId: log.id, portions: log.quantity };
    }
    return map;
  }, [dayLogs]);

  const targets = adjustedTargets ?? baseTargets ?? { calories: 2000, proteinG: 150, carbsG: 200, fatG: 60 };
  const totals = dayLogs?.totals;

  // ─── Mutations ────────────────────────────────────────────────────────────

  const logMealMutation = useMutation({
    mutationFn: ({
      meal, portions, notes, existingLogId,
    }: { meal: Meal; portions: number; notes: string; existingLogId?: string }) => {
      const body = {
        mealType: meal.mealType,
        name: meal.name,
        calories: Math.round(meal.calories * portions),
        proteinG: Math.round(meal.proteinG * portions),
        carbsG: Math.round(meal.carbsG * portions),
        fatG: Math.round(meal.fatG * portions),
        quantity: portions,
        notes: notes || undefined,
      };
      if (existingLogId) {
        return apiFetch(`/meal-logs/${existingLogId}`, { method: 'PATCH', body: JSON.stringify(body) });
      }
      return apiFetch('/meal-logs', { method: 'POST', body: JSON.stringify({ ...body, date: dateStr }) });
    },
    onSuccess: (_: unknown, { meal }: { meal: Meal; portions: number; notes: string; existingLogId?: string }) => {
      void qc.invalidateQueries({ queryKey: ['meal-logs', dateStr] });
      void qc.invalidateQueries({ queryKey: ['meal-logs-history'] });
      setLogModal(null);
      setLogSuccess(meal.name);
      setTimeout(() => setLogSuccess(null), 3000);
    },
  });

  const deleteMealLogMutation = useMutation({
    mutationFn: (logId: string) => apiFetch(`/meal-logs/${logId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['meal-logs', dateStr] });
      void qc.invalidateQueries({ queryKey: ['meal-logs-history'] });
    },
  });

  const customMealMutation = useMutation({
    mutationFn: (text: string) =>
      apiFetch('/meal-logs/from-text', {
        method: 'POST',
        body: JSON.stringify({ text, date: dateStr }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['meal-logs', dateStr] });
      void qc.invalidateQueries({ queryKey: ['meal-logs-history'] });
      setCustomMealModal(false);
      setCustomMealError(null);
      setLogSuccess('Comida agregada');
      setTimeout(() => setLogSuccess(null), 3000);
    },
    onError: (err) => {
      setCustomMealError((err as Error).message);
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratingStatus('Iniciando...');
    setGeneratingProgress(0);
    try {
      await apiStream(
        '/diet/generate/stream',
        { method: 'POST', body: JSON.stringify({ date: dateStr }) },
        (event) => {
          if (event.type === 'status') {
            setGeneratingStatus(event.message as string);
          } else if (event.type === 'chunk') {
            const pct = Math.min(95, Math.round(((event.chars as number) / ESTIMATED_TOTAL_CHARS) * 100));
            setGeneratingProgress(pct);
          } else if (event.type === 'done') {
            setGeneratingProgress(100);
            qc.setQueryData(['diet-by-date', dateStr], event.plan);
            void qc.invalidateQueries({ queryKey: ['diet-by-date', dateStr] });
          }
        },
      );
    } catch (err) {
      setGenerateError((err as Error).message);
    } finally {
      setIsGenerating(false);
      setGeneratingStatus(null);
      setGeneratingProgress(0);
    }
  }

  async function handleGenerateWeek() {
    setIsWeekGenerating(true);
    setWeekError(null);
    setWeekResult(null);
    setWeekProgress(null);
    try {
      await apiStream('/diet/generate/week/stream', { method: 'POST', body: '{}' }, (event) => {
        if (event.type === 'status') {
          setWeekProgress({ message: event.message as string, current: event.current as number, total: event.total as number });
        } else if (event.type === 'day-done') {
          void qc.invalidateQueries({ queryKey: ['diet-by-date', event.date as string] });
        } else if (event.type === 'done') {
          setWeekResult({ generated: event.generated as number, skipped: event.skipped as number });
          setWeekProgress(null);
        }
      });
    } catch (err) {
      setWeekError((err as Error).message);
    } finally {
      setIsWeekGenerating(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      {/* Modals */}
      {logModal && (
        <LogModal
          meal={logModal.meal}
          isEdit={logModal.isEdit}
          initialPortions={loggedMap[logModal.meal.name]?.portions ?? 1}
          onClose={() => setLogModal(null)}
          onConfirm={(meal, portions, notes) =>
            logMealMutation.mutate({
              meal, portions, notes,
              existingLogId: loggedMap[meal.name]?.logId,
            })
          }
        />
      )}
      {customMealModal && (
        <CustomMealModal
          isLoading={customMealMutation.isPending}
          error={customMealError}
          onClose={() => { setCustomMealModal(false); setCustomMealError(null); }}
          onConfirm={(text) => customMealMutation.mutate(text)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Mi menú</h1>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => void handleGenerateWeek()}
            disabled={isBusy}
            className="px-4 py-2 bg-white border-2 border-brand-200 text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition disabled:opacity-50 text-sm flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Planificar semana
          </button>
          {canGenerate && (
            <button
              onClick={() => void handleGenerate()}
              disabled={isBusy}
              className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition disabled:opacity-50 text-sm"
            >
              {isGenerating ? 'Generando...' : '✨ Generar plan'}
            </button>
          )}
        </div>
      </div>

      {/* Week day strip: hoy … +6 días */}
      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-2 font-medium">Elegí el día</p>
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-7 snap-x snap-mandatory">
          {weekDays.map(({ offset, date, dateStr: ds }, i) => {
            const q = weekPlanQueries[i];
            const isSelected = dateOffset === offset;
            const hasPlan = q?.data != null;
            const loading = q?.isLoading ?? true;
            return (
              <button
                key={ds}
                type="button"
                onClick={() => setDateOffset(offset)}
                className={`
                  snap-start shrink-0 w-[4.75rem] sm:w-auto min-h-[4.25rem] sm:min-h-0
                  flex flex-col items-center justify-center rounded-xl border-2 px-1.5 py-2 sm:py-2.5
                  transition text-center
                  ${isSelected
                    ? 'border-brand-500 bg-brand-50 shadow-sm ring-1 ring-brand-200'
                    : 'border-gray-200 bg-white hover:border-brand-200 hover:bg-gray-50'}
                `}
              >
                <span className={`text-[10px] sm:text-xs font-semibold leading-tight ${isSelected ? 'text-brand-900' : 'text-gray-900'}`}>
                  {formatWeekdayDayMonth(date)}
                </span>
                <span className={`text-[9px] sm:text-[10px] font-semibold mt-0.5 h-3.5 flex items-center justify-center ${offset === 0 ? 'text-brand-600' : 'invisible'}`} aria-hidden={offset !== 0}>
                  Hoy
                </span>
                <span className={`mt-1 text-[9px] sm:text-[10px] font-medium leading-none ${loading ? 'text-gray-400' : hasPlan ? 'text-green-600' : 'text-gray-400'}`}>
                  {loading ? '…' : hasPlan ? 'Con plan' : 'Sin plan'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Week generation progress */}
      {(isWeekGenerating || weekResult || weekError) && (
        <div className={`mb-6 rounded-xl p-4 text-sm border ${weekError ? 'bg-red-50 border-red-200 text-red-700' : weekResult ? 'bg-green-50 border-green-200 text-green-700' : 'bg-brand-50 border-brand-200 text-brand-700'}`}>
          {weekError ? (
            <div className="flex items-center justify-between">
              <span>Error al planificar: {weekError}</span>
              <button onClick={() => setWeekError(null)} className="text-xs underline ml-3">Cerrar</button>
            </div>
          ) : weekResult ? (
            <div className="flex items-center justify-between">
              <span>✓ {weekResult.generated} {weekResult.generated === 1 ? 'día planificado' : 'días planificados'}{weekResult.skipped > 0 ? `, ${weekResult.skipped} ya tenían plan` : ''}</span>
              <button onClick={() => setWeekResult(null)} className="text-xs underline ml-3 text-green-600">Cerrar</button>
            </div>
          ) : weekProgress ? (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span className="flex-1">{weekProgress.message}</span>
                <span className="font-semibold tabular-nums">{weekProgress.current}/{weekProgress.total}</span>
              </div>
              <div className="h-1.5 bg-brand-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${Math.round((weekProgress.current / weekProgress.total) * 100)}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Iniciando planificación...
            </div>
          )}
        </div>
      )}

      {/* Single-day generation progress */}
      {isGenerating && (
        <div className="mb-6 bg-brand-50 border border-brand-200 rounded-xl p-4 text-brand-700 text-sm">
          <div className="flex items-center gap-3 mb-3">
            <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span>{generatingStatus ?? 'Generando tu plan...'}</span>
            <span className="ml-auto font-semibold tabular-nums">{generatingProgress}%</span>
          </div>
          <div className="h-1.5 bg-brand-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${generatingProgress}%` }} />
          </div>
        </div>
      )}

      {generateError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Error al generar el plan: {generateError}
        </div>
      )}

      {isToday && adjustedTargets?.adjusted && adjustedTargets.message && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-700 text-sm">
          {adjustedTargets.message}
        </div>
      )}

      {logSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">
          ✓ {logSuccess} registrado correctamente
        </div>
      )}

      {/* Plan del día */}
      {isPlanLoading ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse space-y-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      ) : plan ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 capitalize">Plan del día</h2>
            <div className="text-sm text-gray-500">
              {plan.totalCalories} kcal · P:{plan.totalProteinG}g · C:{plan.totalCarbsG}g · G:{plan.totalFatG}g
            </div>
          </div>
          <div className="space-y-3">
            {plan.meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onLog={(m) => setLogModal({ meal: m, isEdit: loggedMap[m.name] !== undefined })}
                loggedPortions={loggedMap[meal.name]?.portions}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center mb-6">
          <p className="text-gray-400 text-sm mb-4">No hay plan para {isToday ? 'hoy' : 'este día'}</p>
          {canGenerate ? (
            <button
              onClick={() => void handleGenerate()}
              disabled={isBusy}
              className="px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition disabled:opacity-60 text-sm"
            >
              {isGenerating ? 'Generando...' : '✨ Generar plan para este día'}
            </button>
          ) : (
            <p className="text-xs text-gray-400">Solo podés generar planes para hoy y los próximos 6 días.</p>
          )}
        </div>
      )}

      {/* Comido este día */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">
            {isToday ? 'Comido hoy' : 'Comido este día'}
          </h2>
          {totals && (
            <span className="text-sm font-semibold text-gray-700">
              {Math.round(totals.calories)} / {Math.round(targets.calories)} kcal
            </span>
          )}
        </div>

        {totals && (
          <div className="space-y-3 mb-4">
            <MacroBar label="Proteína" value={totals.proteinG} target={targets.proteinG} color="bg-green-500" />
            <MacroBar label="Carbohidratos" value={totals.carbsG} target={targets.carbsG} color="bg-blue-500" />
            <MacroBar label="Grasas" value={totals.fatG} target={targets.fatG} color="bg-yellow-400" />
          </div>
        )}

        {(dayLogs?.logs ?? []).length > 0 && (
          <div className="border-t border-gray-100 pt-3 divide-y divide-gray-100">
            {dayLogs!.logs.map((log) => (
              <MealLogItem
                key={log.id}
                log={log}
                onDelete={(id) => deleteMealLogMutation.mutate(id)}
              />
            ))}
          </div>
        )}

        {(dayLogs?.logs ?? []).length === 0 && (
          <p className="text-sm text-gray-400 mb-4">Todavía no registraste nada {isToday ? 'hoy' : 'este día'}.</p>
        )}

        <button
          onClick={() => { setCustomMealModal(true); setCustomMealError(null); }}
          className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Agregar comida personalizada
        </button>
      </div>
    </div>
  );
}
