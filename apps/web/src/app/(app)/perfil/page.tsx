'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { PreferenceChipGrid } from '@/components/preference-chip-grid';
import {
  COMMON_ALLERGIES,
  COMMON_CUISINES,
  COMMON_DISLIKED_FOODS,
  chipLabels,
} from '@/lib/food-preference-options';
import type {
  Sex,
  ActivityLevel,
  NutritionGoal,
  DietaryType,
  UserProfile,
  UserPreferences,
} from '@nutriplan/shared';
import { ACTIVITY_LABELS, GOAL_LABELS } from '@nutriplan/shared';
import type { NutritionTargets } from '@nutriplan/shared';

export default function MiPerfilPage() {
  const qc = useQueryClient();

  const { data: profileData, isLoading: loadingProfile } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: () => apiFetch('/users/me/profile'),
  });

  const { data: prefsData, isLoading: loadingPrefs } = useQuery<UserPreferences>({
    queryKey: ['user-preferences'],
    queryFn: () => apiFetch('/users/me/preferences'),
  });

  const { data: targets } = useQuery<NutritionTargets>({
    queryKey: ['nutrition-targets'],
    queryFn: () => apiFetch('/nutrition/targets'),
  });

  // Local form state — override fetched data as user edits
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});
  const [prefsForm, setPrefsForm] = useState<Partial<UserPreferences>>({});
  const [profileSaved, setProfileSaved] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Merged values: form overrides fetched data
  const profile = {
    firstName: profileForm.firstName ?? profileData?.firstName ?? '',
    birthDate: profileForm.birthDate ?? profileData?.birthDate ?? '',
    sex: profileForm.sex ?? profileData?.sex ?? ('MALE' as Sex),
    heightCm: profileForm.heightCm ?? profileData?.heightCm ?? 170,
    weightKg: profileForm.weightKg ?? profileData?.weightKg ?? 70,
    activityLevel:
      profileForm.activityLevel ??
      profileData?.activityLevel ??
      ('MODERATELY_ACTIVE' as ActivityLevel),
    goal: profileForm.goal ?? profileData?.goal ?? ('MAINTAIN_WEIGHT' as NutritionGoal),
  };

  const prefs = {
    goal: profile.goal, // goal lives in profile
    dietaryType:
      prefsForm.dietaryType ?? prefsData?.dietaryType ?? ('OMNIVORE' as DietaryType),
    mealsPerDay: prefsForm.mealsPerDay ?? prefsData?.mealsPerDay ?? 4,
    allergies: prefsForm.allergies ?? prefsData?.allergies ?? [],
    dislikedFoods: prefsForm.dislikedFoods ?? prefsData?.dislikedFoods ?? [],
    preferredCuisines: prefsForm.preferredCuisines ?? prefsData?.preferredCuisines ?? [],
  };

  const saveProfileMutation = useMutation({
    mutationFn: () =>
      apiFetch('/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstName: profile.firstName,
          birthDate: new Date(profile.birthDate).toISOString(),
          sex: profile.sex,
          heightCm: profile.heightCm,
          weightKg: profile.weightKg,
          activityLevel: profile.activityLevel,
          goal: profile.goal,
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-profile'] });
      void qc.invalidateQueries({ queryKey: ['nutrition-targets'] });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    },
  });

  const savePrefsMutation = useMutation({
    mutationFn: () =>
      apiFetch('/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          dietaryType: prefs.dietaryType,
          mealsPerDay: prefs.mealsPerDay,
          allergies: prefs.allergies,
          dislikedFoods: prefs.dislikedFoods,
          preferredCuisines: prefs.preferredCuisines,
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-preferences'] });
      void qc.invalidateQueries({ queryKey: ['nutrition-targets'] });
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 3000);
    },
  });

  function toggleInPrefs<K extends 'allergies' | 'dislikedFoods' | 'preferredCuisines'>(
    key: K,
    value: string,
  ) {
    const current = (prefsForm[key] ?? prefsData?.[key] ?? []) as string[];
    const next = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value];
    setPrefsForm((f) => ({ ...f, [key]: next }));
  }

  if (loadingProfile || loadingPrefs) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const section = 'bg-white rounded-[16px] p-5 mb-4';
  const sectionStyle = {
    border: '1px solid #EDE3D2',
    boxShadow: '0 1px 4px rgba(44,36,22,0.04)',
  };
  const lbl = 'text-[12px] font-bold uppercase tracking-[0.4px] block mb-1';
  const lblStyle = { color: '#9A8B7A' };
  const inp = 'w-full border rounded-[10px] px-4 py-3 text-[14px] font-semibold outline-none';
  const inpStyle = { borderColor: '#EDE3D2', color: '#2C2416' };
  const saveBtn =
    'w-full py-3 rounded-[12px] font-bold text-[14px] text-white mt-4 disabled:opacity-60';
  const saveBtnStyle = { background: '#5C7A2C' };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-black mb-1" style={{ color: '#2C2416' }}>
          Mi Perfil
        </h1>
        <p className="text-[13px]" style={{ color: '#9A8B7A' }}>
          Tus cambios se aplican la próxima vez que generes el plan.
        </p>
      </div>

      {/* Targets summary */}
      {targets && (
        <div
          className="rounded-[16px] p-4 mb-5 flex gap-4"
          style={{ background: '#EEF5E2', border: '1px solid #C8DFA0' }}
        >
          {[
            { label: 'kcal/día', value: targets.calories },
            { label: 'TMB', value: targets.bmr },
            { label: 'TDEE', value: targets.tdee },
          ].map(({ label, value }) => (
            <div key={label} className="text-center flex-1">
              <div className="text-[18px] font-black" style={{ color: '#2C2416' }}>
                {value}
              </div>
              <div
                className="text-[10px] font-bold uppercase"
                style={{ color: '#5C7A2C' }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section 1: Personal data */}
      <div className={section} style={sectionStyle}>
        <h2
          className="text-[15px] font-extrabold mb-4"
          style={{ color: '#2C2416' }}
        >
          Datos personales
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={lbl} style={lblStyle}>
              Nombre
            </label>
            <input
              className={inp}
              style={inpStyle}
              value={profile.firstName}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, firstName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={lbl} style={lblStyle}>
              Sexo
            </label>
            <select
              className={inp}
              style={inpStyle}
              value={profile.sex}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, sex: e.target.value as Sex }))
              }
            >
              <option value="MALE">Masculino</option>
              <option value="FEMALE">Femenino</option>
            </select>
          </div>
          <div>
            <label className={lbl} style={lblStyle}>
              Fecha de nacimiento
            </label>
            <input
              type="date"
              className={inp}
              style={inpStyle}
              value={profile.birthDate?.split('T')[0] ?? ''}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, birthDate: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={lbl} style={lblStyle}>
              Altura (cm)
            </label>
            <input
              type="number"
              className={inp}
              style={inpStyle}
              value={profile.heightCm}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, heightCm: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <label className={lbl} style={lblStyle}>
              Peso (kg)
            </label>
            <input
              type="number"
              className={inp}
              style={inpStyle}
              value={profile.weightKg}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, weightKg: Number(e.target.value) }))
              }
            />
          </div>
          <div className="col-span-2">
            <label className={lbl} style={lblStyle}>
              Nivel de actividad
            </label>
            <select
              className={inp}
              style={inpStyle}
              value={profile.activityLevel}
              onChange={(e) =>
                setProfileForm((f) => ({
                  ...f,
                  activityLevel: e.target.value as ActivityLevel,
                }))
              }
            >
              {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(
                ([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
        {profileSaved && (
          <p className="text-[12px] font-bold mt-2" style={{ color: '#16A34A' }}>
            ✓ Guardado
          </p>
        )}
        <button
          className={saveBtn}
          style={saveBtnStyle}
          disabled={saveProfileMutation.isPending}
          onClick={() => saveProfileMutation.mutate()}
        >
          {saveProfileMutation.isPending ? 'Guardando...' : 'Guardar datos personales'}
        </button>
      </div>

      {/* Section 2: Objective & preferences */}
      <div className={section} style={sectionStyle}>
        <h2
          className="text-[15px] font-extrabold mb-4"
          style={{ color: '#2C2416' }}
        >
          Objetivo y preferencias
        </h2>

        <label className={lbl} style={lblStyle}>
          Objetivo
        </label>
        <div className="space-y-2 mb-4">
          {(Object.entries(GOAL_LABELS) as [NutritionGoal, string][]).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => setProfileForm((f) => ({ ...f, goal: k }))}
              className="w-full px-4 py-3 rounded-[10px] border-2 text-left font-semibold text-[14px] transition"
              style={
                profile.goal === k
                  ? { borderColor: '#5C7A2C', background: '#EEF5E2', color: '#3A5018' }
                  : { borderColor: '#EDE3D2', color: '#7A6E63' }
              }
            >
              {v}
            </button>
          ))}
        </div>

        <label className={lbl} style={lblStyle}>
          Tipo de dieta
        </label>
        <select
          className={`${inp} mb-4`}
          style={inpStyle}
          value={prefs.dietaryType}
          onChange={(e) =>
            setPrefsForm((f) => ({ ...f, dietaryType: e.target.value as DietaryType }))
          }
        >
          <option value="OMNIVORE">Omnívoro (como de todo)</option>
          <option value="VEGETARIAN">Vegetariano</option>
          <option value="VEGAN">Vegano</option>
          <option value="PESCATARIAN">Pescetariano</option>
          <option value="KETO">Cetogénico (Keto)</option>
          <option value="PALEO">Paleo</option>
        </select>

        <label className={lbl} style={lblStyle}>
          Comidas por día
        </label>
        <div className="flex gap-3 mb-4">
          {[3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPrefsForm((f) => ({ ...f, mealsPerDay: n }))}
              className="flex-1 py-3 rounded-[10px] border-2 font-bold text-[14px] transition"
              style={
                prefs.mealsPerDay === n
                  ? { borderColor: '#5C7A2C', background: '#EEF5E2', color: '#3A5018' }
                  : { borderColor: '#EDE3D2', color: '#7A6E63' }
              }
            >
              {n}
            </button>
          ))}
        </div>

        <label className={lbl} style={lblStyle}>
          Alergias e intolerancias
        </label>
        <PreferenceChipGrid
          labels={chipLabels(COMMON_ALLERGIES, prefs.allergies)}
          selected={prefs.allergies}
          onToggle={(v) => toggleInPrefs('allergies', v)}
        />

        <label className={`${lbl} mt-4`} style={lblStyle}>
          Comidas que preferís evitar
        </label>
        <PreferenceChipGrid
          labels={chipLabels(COMMON_DISLIKED_FOODS, prefs.dislikedFoods)}
          selected={prefs.dislikedFoods}
          onToggle={(v) => toggleInPrefs('dislikedFoods', v)}
        />

        <label className={`${lbl} mt-4`} style={lblStyle}>
          Cocinas que te gustan
        </label>
        <PreferenceChipGrid
          labels={chipLabels(COMMON_CUISINES, prefs.preferredCuisines)}
          selected={prefs.preferredCuisines}
          onToggle={(v) => toggleInPrefs('preferredCuisines', v)}
        />

        {prefsSaved && (
          <p className="text-[12px] font-bold mt-2" style={{ color: '#16A34A' }}>
            ✓ Guardado
          </p>
        )}
        <button
          className={saveBtn}
          style={saveBtnStyle}
          disabled={savePrefsMutation.isPending}
          onClick={() => savePrefsMutation.mutate()}
        >
          {savePrefsMutation.isPending ? 'Guardando...' : 'Guardar preferencias'}
        </button>
      </div>
    </div>
  );
}
