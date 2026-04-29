import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { NutritionPlan, Meal } from '@nutriplan/shared';

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: 'Desayuno',
  MORNING_SNACK: 'Merienda AM',
  LUNCH: 'Almuerzo',
  AFTERNOON_SNACK: 'Merienda PM',
  DINNER: 'Cena',
};

interface DailySummary {
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
}

interface AdjustedTargets {
  calories: number; proteinG: number; carbsG: number; fatG: number;
  adjusted: boolean; message: string | null;
}

function MacroBar({ value, target, color }: { value: number; target: number; color: string }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <View className="h-1.5 bg-gray-100 rounded-full flex-1 overflow-hidden">
      <View className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </View>
  );
}

function MealRow({ meal, onLog }: { meal: Meal; onLog: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="py-3 border-b border-gray-50">
      <View className="flex-row items-start justify-between">
        <TouchableOpacity className="flex-1" onPress={() => setOpen(!open)}>
          <Text className="text-xs text-brand-600 font-medium">{MEAL_LABELS[meal.mealType] ?? meal.mealType}</Text>
          <Text className="font-medium text-gray-800 mt-0.5">{meal.name}</Text>
          <Text className="text-xs text-gray-400">{meal.calories} kcal · P:{meal.proteinG}g · C:{meal.carbsG}g</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onLog} className="px-3 py-1 border border-brand-200 rounded-lg ml-2">
          <Text className="text-xs text-brand-600 font-medium">Registrar</Text>
        </TouchableOpacity>
      </View>
      {open && (
        <View className="mt-3 bg-gray-50 rounded-xl p-3">
          <Text className="text-sm text-gray-600 mb-2">{meal.description}</Text>
          <Text className="text-xs font-semibold text-gray-500 mb-1">INGREDIENTES</Text>
          {(meal.ingredients as Array<{ name: string; quantity: number; unit: string }>).map((ing, i) => (
            <Text key={i} className="text-xs text-gray-600">• {ing.name} — {ing.quantity}{ing.unit}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

export default function MenuScreen() {
  const qc = useQueryClient();

  const { data: plan, isLoading, isError } = useQuery<NutritionPlan>({
    queryKey: ['diet-current'],
    queryFn: () => apiFetch('/diet/current'),
    retry: false,
  });

  const { data: todaySummary } = useQuery<DailySummary>({
    queryKey: ['meal-logs-today'],
    queryFn: () => apiFetch('/meal-logs'),
  });

  const { data: adjustedTargets } = useQuery<AdjustedTargets>({
    queryKey: ['diet-adjusted-targets'],
    queryFn: () => apiFetch('/diet/targets/adjusted'),
  });

  const generateMutation = useMutation({
    mutationFn: () => apiFetch('/diet/generate', { method: 'POST', body: '{}' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diet-current'] }),
    onError: (err) => Alert.alert('Error', (err as Error).message),
  });

  const logMealMutation = useMutation({
    mutationFn: (meal: Meal) =>
      apiFetch('/meal-logs', {
        method: 'POST',
        body: JSON.stringify({
          mealType: meal.mealType, name: meal.name,
          calories: meal.calories, proteinG: meal.proteinG,
          carbsG: meal.carbsG, fatG: meal.fatG,
        }),
      }),
    onSuccess: (_, meal) => {
      qc.invalidateQueries({ queryKey: ['meal-logs-today'] });
      Alert.alert('Registrado', `${meal.name} registrado correctamente`);
    },
    onError: (err) => Alert.alert('Error', (err as Error).message),
  });

  const totals = todaySummary?.totals;
  const targets = adjustedTargets ?? { calories: 2000, proteinG: 150, carbsG: 200, fatG: 60 };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-14 pb-4 flex-row items-center justify-between border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Mi menú de hoy</Text>
        <TouchableOpacity onPress={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="px-4 py-2 bg-brand-600 rounded-xl">
          <Text className="text-white font-semibold text-sm">{generateMutation.isPending ? '...' : '✨ Generar'}</Text>
        </TouchableOpacity>
      </View>

      {adjustedTargets?.adjusted && adjustedTargets.message && (
        <View className="mx-4 mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <Text className="text-xs text-blue-700">{adjustedTargets.message}</Text>
        </View>
      )}

      {totals && (
        <View className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-semibold text-gray-900 text-sm">Comido hoy</Text>
            <Text className="text-sm font-bold text-gray-700">{Math.round(totals.calories)} / {Math.round(targets.calories)} kcal</Text>
          </View>
          <View className="space-y-2">
            {[
              { label: 'P', value: totals.proteinG, target: targets.proteinG, color: 'bg-green-500' },
              { label: 'C', value: totals.carbsG, target: targets.carbsG, color: 'bg-blue-500' },
              { label: 'G', value: totals.fatG, target: targets.fatG, color: 'bg-yellow-400' },
            ].map(({ label, value, target: tgt, color }) => (
              <View key={label} className="flex-row items-center gap-2">
                <Text className="text-xs text-gray-500 w-4">{label}</Text>
                <MacroBar value={value} target={tgt} color={color} />
                <Text className="text-xs text-gray-400 w-16 text-right">{Math.round(value)}/{Math.round(tgt)}g</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16a34a" />
        </View>
      ) : isError && !plan ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500 text-center mb-6">Todavía no tenés un plan. Generá uno para empezar.</Text>
          <TouchableOpacity onPress={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="px-6 py-3 bg-brand-600 rounded-xl">
            <Text className="text-white font-semibold">{generateMutation.isPending ? 'Generando...' : 'Generar mi plan'}</Text>
          </TouchableOpacity>
        </View>
      ) : plan ? (
        <ScrollView className="flex-1 px-4 py-4">
          {plan.meals.map((meal) => (
            <MealRow key={meal.id} meal={meal} onLog={() => logMealMutation.mutate(meal)} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
