'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import type { Sex, ActivityLevel, NutritionGoal, DietaryType } from '@nutriplan/shared';
import { ACTIVITY_LABELS, GOAL_LABELS } from '@nutriplan/shared';
import {
  COMMON_ALLERGIES,
  COMMON_CUISINES,
  COMMON_DISLIKED_FOODS,
  chipLabels,
} from '@/lib/food-preference-options';
import { PreferenceChipGrid } from '@/components/preference-chip-grid';

const STEPS = [
  'Datos personales',
  'Objetivo',
  'Preferencias',
  'Alergias',
  'Gustos y cocinas',
];

interface ProfileData {
  firstName: string;
  birthDate: string;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
}

interface GoalData {
  goal: NutritionGoal;
}

interface PrefData {
  dietaryType: DietaryType;
  mealsPerDay: number;
}

interface AllergyData {
  allergies: string[];
}

interface TasteData {
  dislikedFoods: string[];
  preferredCuisines: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [profile, setProfile] = useState<ProfileData>({
    firstName: user?.firstName ?? '',
    birthDate: '1990-01-01',
    sex: 'MALE',
    heightCm: 170,
    weightKg: 70,
    activityLevel: 'MODERATELY_ACTIVE',
  });
  const [goal, setGoal] = useState<GoalData>({ goal: 'LOSE_WEIGHT' });
  const [prefs, setPrefs] = useState<PrefData>({ dietaryType: 'OMNIVORE', mealsPerDay: 4 });
  const [allergies, setAllergies] = useState<AllergyData>({ allergies: [] });
  const [tastes, setTastes] = useState<TasteData>({ dislikedFoods: [], preferredCuisines: [] });

  function toggleAllergy(a: string) {
    setAllergies((prev) => ({
      allergies: prev.allergies.includes(a)
        ? prev.allergies.filter((x) => x !== a)
        : [...prev.allergies, a],
    }));
  }

  function toggleDisliked(label: string) {
    setTastes((prev) => ({
      ...prev,
      dislikedFoods: prev.dislikedFoods.includes(label)
        ? prev.dislikedFoods.filter((x) => x !== label)
        : [...prev.dislikedFoods, label],
    }));
  }

  function toggleCuisine(label: string) {
    setTastes((prev) => ({
      ...prev,
      preferredCuisines: prev.preferredCuisines.includes(label)
        ? prev.preferredCuisines.filter((x) => x !== label)
        : [...prev.preferredCuisines, label],
    }));
  }

  async function finish() {
    setLoading(true);
    setError('');
    try {
      await apiFetch('/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...profile,
          birthDate: new Date(profile.birthDate).toISOString(),
          onboardingComplete: true,
        }),
      });
      await apiFetch('/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          ...prefs,
          ...allergies,
          dislikedFoods: tastes.dislikedFoods,
          preferredCuisines: tastes.preferredCuisines,
        }),
      });
      if (user && accessToken && refreshToken) {
        setAuth({ ...user, onboardingComplete: true }, accessToken, refreshToken);
      }
      router.push('/mi-semana');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const allergyChipLabels = chipLabels(COMMON_ALLERGIES, allergies.allergies);
  const dislikedChipLabels = chipLabels(COMMON_DISLIKED_FOODS, tastes.dislikedFoods);
  const cuisineChipLabels = chipLabels(COMMON_CUISINES, tastes.preferredCuisines);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">N</div>
          <span className="text-xl font-bold text-brand-700">NutriPlan</span>
        </div>

        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-2 rounded-full ${i <= step ? 'bg-brand-600' : 'bg-gray-200'}`} />
              <span className="text-xs text-gray-500 mt-1 block">{s}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Tus datos personales</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre</label>
                  <input className="w-full px-4 py-3 border border-gray-200 rounded-xl" value={profile.firstName} onChange={(e) => setProfile(p => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Sexo</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-xl" value={profile.sex} onChange={(e) => setProfile(p => ({ ...p, sex: e.target.value as Sex }))}>
                    <option value="MALE">Masculino</option>
                    <option value="FEMALE">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Fecha de nacimiento</label>
                  <input type="date" className="w-full px-4 py-3 border border-gray-200 rounded-xl" value={profile.birthDate} onChange={(e) => setProfile(p => ({ ...p, birthDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Altura (cm)</label>
                  <input type="number" className="w-full px-4 py-3 border border-gray-200 rounded-xl" value={profile.heightCm} onChange={(e) => setProfile(p => ({ ...p, heightCm: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Peso (kg)</label>
                  <input type="number" className="w-full px-4 py-3 border border-gray-200 rounded-xl" value={profile.weightKg} onChange={(e) => setProfile(p => ({ ...p, weightKg: Number(e.target.value) }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Nivel de actividad</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-xl" value={profile.activityLevel} onChange={(e) => setProfile(p => ({ ...p, activityLevel: e.target.value as ActivityLevel }))}>
                    {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">¿Cuál es tu objetivo?</h2>
              <div className="space-y-3">
                {(Object.entries(GOAL_LABELS) as [NutritionGoal, string][]).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => setGoal({ goal: k })} className={`w-full px-5 py-4 rounded-xl border-2 text-left font-medium transition ${goal.goal === k ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700 hover:border-brand-200'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Preferencias alimentarias</h2>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo de dieta</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl" value={prefs.dietaryType} onChange={(e) => setPrefs(p => ({ ...p, dietaryType: e.target.value as DietaryType }))}>
                  <option value="OMNIVORE">Omnívoro (como de todo)</option>
                  <option value="VEGETARIAN">Vegetariano</option>
                  <option value="VEGAN">Vegano</option>
                  <option value="PESCATARIAN">Pescetariano</option>
                  <option value="KETO">Cetogénico (Keto)</option>
                  <option value="PALEO">Paleo</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Comidas por día</label>
                <div className="flex gap-3">
                  {[3, 4, 5, 6].map((n) => (
                    <button key={n} type="button" onClick={() => setPrefs(p => ({ ...p, mealsPerDay: n }))} className={`flex-1 py-3 rounded-xl border-2 font-semibold transition ${prefs.mealsPerDay === n ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Alergias e intolerancias</h2>
              <p className="text-gray-500 text-sm">Seleccioná todo lo que aplica (podés saltear si no tenés ninguna)</p>
              <PreferenceChipGrid
                labels={allergyChipLabels}
                selected={allergies.allergies}
                onToggle={toggleAllergy}
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Alimentos o sabores que preferís evitar</h2>
                <p className="text-gray-500 text-sm">Elegí lo que no te gusta o preferís no ver en tu menú (opcional)</p>
                <PreferenceChipGrid
                  labels={dislikedChipLabels}
                  selected={tastes.dislikedFoods}
                  onToggle={toggleDisliked}
                />
              </div>
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Cocinas que más te gustan</h2>
                <p className="text-gray-500 text-sm">Así podemos orientar recetas y sugerencias (opcional)</p>
                <PreferenceChipGrid
                  labels={cuisineChipLabels}
                  selected={tastes.preferredCuisines}
                  onToggle={toggleCuisine}
                />
              </div>
            </div>
          )}

          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mt-4">{error}</div>}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition">
                Atrás
              </button>
            )}
            <button
              type="button"
              onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : finish()}
              disabled={loading}
              className="flex-1 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition disabled:opacity-60"
            >
              {loading ? 'Guardando...' : step < STEPS.length - 1 ? 'Siguiente' : 'Empezar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
