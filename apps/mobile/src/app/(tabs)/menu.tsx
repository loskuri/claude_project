import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { NutritionPlan, Meal } from '@nutriplan/shared';
import { DAY_NAMES_ES } from '@nutriplan/shared';

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: 'Desayuno',
  MORNING_SNACK: 'Merienda AM',
  LUNCH: 'Almuerzo',
  AFTERNOON_SNACK: 'Merienda PM',
  DINNER: 'Cena',
};

function MealRow({ meal }: { meal: Meal }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity onPress={() => setOpen(!open)} className="py-3 border-b border-gray-50">
      <Text className="text-xs text-brand-600 font-medium">{MEAL_LABELS[meal.mealType] ?? meal.mealType}</Text>
      <Text className="font-medium text-gray-800 mt-0.5">{meal.name}</Text>
      <Text className="text-xs text-gray-400">{meal.calories} kcal · P:{meal.proteinG}g · C:{meal.carbsG}g</Text>
      {open && (
        <View className="mt-3 bg-gray-50 rounded-xl p-3">
          <Text className="text-sm text-gray-600 mb-2">{meal.description}</Text>
          <Text className="text-xs font-semibold text-gray-500 mb-1">INGREDIENTES</Text>
          {(meal.ingredients as Array<{ name: string; quantity: number; unit: string }>).map((ing, i) => (
            <Text key={i} className="text-xs text-gray-600">• {ing.name} — {ing.quantity}{ing.unit}</Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MenuScreen() {
  const qc = useQueryClient();
  const [selectedDay, setSelectedDay] = useState(0);

  const { data: plan, isLoading, isError } = useQuery<NutritionPlan>({
    queryKey: ['diet-current'],
    queryFn: () => apiFetch('/diet/current'),
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: () => apiFetch('/diet/generate', { method: 'POST', body: '{}' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diet-current'] }),
    onError: (err) => Alert.alert('Error', (err as Error).message),
  });

  const dayMenu = plan?.weeklyMenus?.find((m) => m.dayOfWeek === selectedDay);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-14 pb-4 flex-row items-center justify-between border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Mi menú</Text>
        <TouchableOpacity onPress={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="px-4 py-2 bg-brand-600 rounded-xl">
          <Text className="text-white font-semibold text-sm">{generateMutation.isPending ? '...' : '✨ Generar'}</Text>
        </TouchableOpacity>
      </View>

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
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-white border-b border-gray-100">
            <View className="flex-row px-4 py-3 gap-2">
              {plan.weeklyMenus.map((menu) => (
                <TouchableOpacity
                  key={menu.dayOfWeek}
                  onPress={() => setSelectedDay(menu.dayOfWeek)}
                  className={`px-4 py-2 rounded-xl ${selectedDay === menu.dayOfWeek ? 'bg-brand-600' : 'bg-gray-100'}`}
                >
                  <Text className={`font-medium text-sm ${selectedDay === menu.dayOfWeek ? 'text-white' : 'text-gray-600'}`}>
                    {DAY_NAMES_ES[menu.dayOfWeek]?.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <ScrollView className="flex-1 px-4 py-4">
            {dayMenu?.meals.map((meal) => (
              <MealRow key={meal.id} meal={meal} />
            ))}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}
