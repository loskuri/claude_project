'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ActivityLevel, DietaryType, NutritionGoal } from '@nutriplan/shared';
import { ACTIVITY_LABELS, GOAL_LABELS } from '@nutriplan/shared';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import {
  COMMON_ALLERGIES,
  COMMON_CUISINES,
  COMMON_DISLIKED_FOODS,
  chipLabels,
} from '@/lib/food-preference-options';
import { PreferenceChipGrid } from '@/components/preference-chip-grid';

const DIETARY_LABELS: Record<DietaryType, string> = {
  OMNIVORE: 'Omnívoro (como de todo)',
  VEGETARIAN: 'Vegetariano',
  VEGAN: 'Vegano',
  PESCATARIAN: 'Pescetariano',
  KETO: 'Cetogénico (Keto)',
  PALEO: 'Paleo',
};

type MeResponse = {
  profile: {
    firstName: string;
    lastName: string | null;
    birthDate: string;
    activityLevel: ActivityLevel;
    goal: NutritionGoal;
  } | null;
  preferences: {
    dietaryType: DietaryType;
    allergies: string[];
    dislikedFoods: string[];
    preferredCuisines: string[];
    mealsPerDay: number;
  } | null;
};

export function AccountSettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const updateUser = useAuthStore((s) => s.updateUser);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('MODERATELY_ACTIVE');
  const [goal, setGoal] = useState<NutritionGoal>('MAINTAIN_WEIGHT');
  const [dietaryType, setDietaryType] = useState<DietaryType>('OMNIVORE');
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dislikedFoods, setDislikedFoods] = useState<string[]>([]);
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>([]);

  const allergyChipLabels = useMemo(() => chipLabels(COMMON_ALLERGIES, allergies), [allergies]);
  const dislikedChipLabels = useMemo(
    () => chipLabels(COMMON_DISLIKED_FOODS, dislikedFoods),
    [dislikedFoods],
  );
  const cuisineChipLabels = useMemo(
    () => chipLabels(COMMON_CUISINES, preferredCuisines),
    [preferredCuisines],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const me = await apiFetch<MeResponse>('/users/me');
        if (cancelled) return;
        const p = me.profile;
        const pref = me.preferences;
        if (!p) {
          setError('No se encontró tu perfil. Completá el onboarding primero.');
          return;
        }
        setFirstName(p.firstName);
        setLastName(p.lastName ?? '');
        const bd =
          typeof p.birthDate === 'string'
            ? p.birthDate.slice(0, 10)
            : new Date(p.birthDate).toISOString().slice(0, 10);
        setBirthDate(bd);
        setActivityLevel(p.activityLevel);
        setGoal(p.goal);
        if (pref) {
          setDietaryType(pref.dietaryType);
          setMealsPerDay(pref.mealsPerDay);
          setAllergies([...(pref.allergies ?? [])]);
          setDislikedFoods([...(pref.dislikedFoods ?? [])]);
          setPreferredCuisines([...(pref.preferredCuisines ?? [])]);
        } else {
          setDietaryType('OMNIVORE');
          setMealsPerDay(4);
          setAllergies([]);
          setDislikedFoods([]);
          setPreferredCuisines([]);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'No se pudo cargar tu cuenta.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function toggleAllergy(label: string) {
    setAllergies((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );
  }

  function toggleDisliked(label: string) {
    setDislikedFoods((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );
  }

  function toggleCuisine(label: string) {
    setPreferredCuisines((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiFetch('/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstName,
          lastName: lastName.trim(),
          birthDate: new Date(birthDate).toISOString(),
          activityLevel,
          goal,
        }),
      });
      await apiFetch('/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          dietaryType,
          mealsPerDay,
          allergies,
          dislikedFoods,
          preferredCuisines,
        }),
      });
      updateUser({
        firstName: firstName.trim(),
        ...(lastName.trim() ? { lastName: lastName.trim() } : { lastName: undefined }),
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-settings-title"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 id="account-settings-title" className="text-lg font-bold text-gray-900">
            Ajustes de cuenta
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2 py-1"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {loading ? (
            <p className="text-sm text-gray-500">Cargando…</p>
          ) : (
            <>
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">Datos personales</h3>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre</label>
                  <input
                    required
                    minLength={2}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Apellido</label>
                  <input
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">Actividad y objetivo</h3>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Nivel de actividad
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                  >
                    {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Objetivo</label>
                  <div className="space-y-2">
                    {(Object.entries(GOAL_LABELS) as [NutritionGoal, string][]).map(([k, v]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setGoal(k)}
                        className={`w-full px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition ${
                          goal === k
                            ? 'border-brand-600 bg-brand-50 text-brand-700'
                            : 'border-gray-200 text-gray-700 hover:border-brand-200'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">Preferencias alimentarias</h3>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Tipo de dieta
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                    value={dietaryType}
                    onChange={(e) => setDietaryType(e.target.value as DietaryType)}
                  >
                    {(Object.entries(DIETARY_LABELS) as [DietaryType, string][]).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Comidas por día
                  </label>
                  <div className="flex gap-2">
                    {[3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setMealsPerDay(n)}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                          mealsPerDay === n
                            ? 'border-brand-600 bg-brand-50 text-brand-700'
                            : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Alergias e intolerancias
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Seleccioná todo lo que aplica</p>
                  <PreferenceChipGrid
                    labels={allergyChipLabels}
                    selected={allergies}
                    onToggle={toggleAllergy}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Alimentos rechazados (la IA los evita)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Se actualizan automáticamente cuando usás "No me gusta"</p>
                  <PreferenceChipGrid
                    labels={dislikedChipLabels}
                    selected={dislikedFoods}
                    onToggle={toggleDisliked}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Cocinas que más te gustan
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Opcional</p>
                  <PreferenceChipGrid
                    labels={cuisineChipLabels}
                    selected={preferredCuisines}
                    onToggle={toggleCuisine}
                  />
                </div>
              </section>
            </>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || saving}
              className="flex-1 py-2.5 bg-brand-600 text-white font-semibold rounded-xl text-sm hover:bg-brand-700 transition disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
