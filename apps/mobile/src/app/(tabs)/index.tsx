import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'expo-router';
import type { NutritionTargets, NutritionPlan } from '@nutriplan/shared';
import { DAY_NAMES_ES } from '@nutriplan/shared';

function MacroChip({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View className="flex-1 items-center bg-gray-50 rounded-2xl py-4">
      <Text className={`text-2xl font-bold ${color}`}>{value}</Text>
      <Text className="text-xs text-gray-400">{unit}</Text>
      <Text className="text-sm text-gray-600 mt-1">{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const { data: targets } = useQuery<NutritionTargets>({
    queryKey: ['nutrition-targets'],
    queryFn: () => apiFetch('/nutrition/targets'),
  });

  const { data: plan } = useQuery<NutritionPlan>({
    queryKey: ['diet-current'],
    queryFn: () => apiFetch('/diet/current'),
    retry: false,
  });

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;
  const todayMenu = plan?.weeklyMenus?.find((m) => m.dayOfWeek === todayIndex);

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="bg-brand-600 px-6 pt-14 pb-8">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-lg font-semibold">Hola, {user?.firstName} 👋</Text>
            <Text className="text-green-100 text-sm">{DAY_NAMES_ES[todayIndex]}</Text>
          </View>
          <TouchableOpacity onPress={() => { clearAuth(); router.replace('/(auth)/login'); }}>
            <Text className="text-green-200 text-sm">Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-4 -mt-4">
        {targets && (
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="font-semibold text-gray-900 mb-4">Objetivos del día</Text>
            <View className="flex-row gap-2">
              <MacroChip label="Calorías" value={targets.calories} unit="kcal" color="text-orange-500" />
              <MacroChip label="Proteínas" value={targets.proteinG} unit="g" color="text-brand-600" />
              <MacroChip label="Carbos" value={targets.carbsG} unit="g" color="text-blue-500" />
              <MacroChip label="Grasas" value={targets.fatG} unit="g" color="text-yellow-500" />
            </View>
            <Text className="text-xs text-gray-400 mt-3">TMB {targets.bmr} kcal · TDEE {targets.tdee} kcal</Text>
          </View>
        )}

        <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <Text className="font-semibold text-gray-900 mb-3">Comidas de hoy</Text>
          {todayMenu ? (
            todayMenu.meals.map((meal) => (
              <View key={meal.id} className="py-3 border-b border-gray-50">
                <Text className="text-xs text-brand-600 font-medium">{meal.mealType}</Text>
                <Text className="font-medium text-gray-800 mt-0.5">{meal.name}</Text>
                <Text className="text-xs text-gray-400">{meal.calories} kcal</Text>
              </View>
            ))
          ) : (
            <View className="items-center py-6">
              <Text className="text-gray-400 text-sm mb-3">Sin plan activo</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/menu')} className="px-4 py-2 bg-brand-50 rounded-xl">
                <Text className="text-brand-600 font-medium text-sm">Generar plan →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
