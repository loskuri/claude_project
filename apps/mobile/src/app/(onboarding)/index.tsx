import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { ACTIVITY_LABELS, GOAL_LABELS } from '@nutriplan/shared';
import type { ActivityLevel, NutritionGoal, Sex, DietaryType } from '@nutriplan/shared';

const STEPS = ['Datos', 'Objetivo', 'Dieta', 'Alergias'];
const COMMON_ALLERGIES = ['Gluten', 'Lactosa', 'Maní', 'Nueces', 'Huevo', 'Soja', 'Mariscos'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, accessToken, refreshToken, setAuth } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? '',
    sex: 'MALE' as Sex,
    birthDate: '',
    heightCm: 170,
    weightKg: 70,
    activityLevel: 'MODERATELY_ACTIVE' as ActivityLevel,
  });
  const [goal, setGoal] = useState<NutritionGoal>('LOSE_WEIGHT');
  const [dietaryType, setDietaryType] = useState<DietaryType>('OMNIVORE');
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [allergies, setAllergies] = useState<string[]>([]);

  function toggleAllergy(a: string) {
    setAllergies((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  }

  async function finish() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.birthDate)) {
      Alert.alert('Fecha inválida', 'Ingresá tu fecha de nacimiento en formato AAAA-MM-DD');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...profile, birthDate: new Date(profile.birthDate).toISOString(), goal, onboardingComplete: true }),
      });
      await apiFetch('/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({ dietaryType, mealsPerDay, allergies }),
      });
      if (user && accessToken && refreshToken) {
        await setAuth({ ...user, onboardingComplete: true }, accessToken, refreshToken);
      }
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-green-50">
      <View className="px-6 pt-14 pb-4">
        <View className="flex-row gap-2 mb-4">
          {STEPS.map((s, i) => (
            <View key={s} className="flex-1">
              <View className={`h-1.5 rounded-full ${i <= step ? 'bg-brand-600' : 'bg-gray-200'}`} />
            </View>
          ))}
        </View>
        <Text className="text-xs text-gray-500">{STEPS[step]}</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          {step === 0 && (
            <View className="space-y-4">
              <Text className="text-xl font-bold text-gray-900">Tus datos</Text>
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Sexo</Text>
                <View className="flex-row gap-3">
                  {(['MALE', 'FEMALE'] as Sex[]).map((s) => (
                    <TouchableOpacity key={s} onPress={() => setProfile(p => ({ ...p, sex: s }))} className={`flex-1 py-3 rounded-xl border-2 items-center ${profile.sex === s ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}>
                      <Text className={profile.sex === s ? 'text-brand-700 font-semibold' : 'text-gray-600'}>{s === 'MALE' ? 'Masculino' : 'Femenino'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View className="mt-3">
                <Text className="text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</Text>
                <TextInput
                  placeholder="AAAA-MM-DD"
                  value={profile.birthDate}
                  onChangeText={(v) => setProfile(p => ({ ...p, birthDate: v }))}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                  maxLength={10}
                />
              </View>
              {[
                { label: 'Altura (cm)', field: 'heightCm' as const, keyboard: 'numeric' as const },
                { label: 'Peso (kg)', field: 'weightKg' as const, keyboard: 'numeric' as const },
              ].map(({ label, field, keyboard }) => (
                <View key={field} className="mt-3">
                  <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
                  <TextInput
                    keyboardType={keyboard}
                    value={String(profile[field])}
                    onChangeText={(v) => setProfile(p => ({ ...p, [field]: Number(v) || p[field] }))}
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                  />
                </View>
              ))}
              <View className="mt-3">
                <Text className="text-sm font-medium text-gray-700 mb-2">Nivel de actividad</Text>
                {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([k, v]) => (
                  <TouchableOpacity key={k} onPress={() => setProfile(p => ({ ...p, activityLevel: k }))} className={`py-3 px-4 rounded-xl border-2 mb-2 ${profile.activityLevel === k ? 'border-brand-600 bg-brand-50' : 'border-gray-100'}`}>
                    <Text className={`text-sm ${profile.activityLevel === k ? 'text-brand-700 font-medium' : 'text-gray-600'}`}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 1 && (
            <View className="space-y-3">
              <Text className="text-xl font-bold text-gray-900">Tu objetivo</Text>
              {(Object.entries(GOAL_LABELS) as [NutritionGoal, string][]).map(([k, v]) => (
                <TouchableOpacity key={k} onPress={() => setGoal(k)} className={`py-4 px-5 rounded-xl border-2 mt-3 ${goal === k ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}>
                  <Text className={`font-medium ${goal === k ? 'text-brand-700' : 'text-gray-700'}`}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {step === 2 && (
            <View>
              <Text className="text-xl font-bold text-gray-900 mb-4">Tipo de alimentación</Text>
              {(['OMNIVORE', 'VEGETARIAN', 'VEGAN', 'PESCATARIAN', 'KETO', 'PALEO'] as DietaryType[]).map((d) => (
                <TouchableOpacity key={d} onPress={() => setDietaryType(d)} className={`py-3 px-4 rounded-xl border-2 mb-2 ${dietaryType === d ? 'border-brand-600 bg-brand-50' : 'border-gray-100'}`}>
                  <Text className={`${dietaryType === d ? 'text-brand-700 font-medium' : 'text-gray-600'}`}>{d}</Text>
                </TouchableOpacity>
              ))}
              <Text className="text-sm font-medium text-gray-700 mt-4 mb-2">Comidas por día</Text>
              <View className="flex-row gap-2">
                {[3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setMealsPerDay(n)} className={`flex-1 py-3 rounded-xl border-2 items-center ${mealsPerDay === n ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}>
                    <Text className={`font-semibold ${mealsPerDay === n ? 'text-brand-700' : 'text-gray-600'}`}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text className="text-xl font-bold text-gray-900 mb-2">Alergias</Text>
              <Text className="text-gray-500 text-sm mb-4">Seleccioná las que apliquen</Text>
              <View className="flex-row flex-wrap gap-2">
                {COMMON_ALLERGIES.map((a) => (
                  <TouchableOpacity key={a} onPress={() => toggleAllergy(a)} className={`px-4 py-2 rounded-full border-2 ${allergies.includes(a) ? 'border-brand-600 bg-brand-100' : 'border-gray-200'}`}>
                    <Text className={`text-sm font-medium ${allergies.includes(a) ? 'text-brand-700' : 'text-gray-600'}`}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="px-6 pb-10 flex-row gap-3">
        {step > 0 && (
          <TouchableOpacity onPress={() => setStep(s => s - 1)} className="flex-1 py-4 border-2 border-gray-200 rounded-xl items-center">
            <Text className="text-gray-700 font-semibold">Atrás</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => step < STEPS.length - 1 ? setStep(s => s + 1) : finish()}
          disabled={loading}
          className="flex-1 py-4 bg-brand-600 rounded-xl items-center"
        >
          <Text className="text-white font-semibold">{loading ? 'Guardando...' : step < STEPS.length - 1 ? 'Siguiente' : 'Empezar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
