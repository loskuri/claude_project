import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

interface WeightLog { id: string; date: string; weightKg: number; notes?: string; }
interface MacroDay { date: string; calories: number; proteinG: number; carbsG: number; fatG: number; }

type ActiveTab = 'weight' | 'macros';

const MAX_BAR_HEIGHT = 80;

function MacroHistoryChart({ history }: { history: MacroDay[] }) {
  const maxCal = Math.max(...history.map((d) => d.calories), 1);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
      <View className="flex-row items-end gap-1.5 px-1" style={{ height: MAX_BAR_HEIGHT + 24 }}>
        {history.slice(-14).map((day) => {
          const h = Math.round((day.calories / maxCal) * MAX_BAR_HEIGHT);
          return (
            <View key={day.date} className="items-center">
              <View style={{ height: h, width: 16, backgroundColor: '#16a34a', borderRadius: 4 }} />
              <Text className="text-gray-400 mt-1" style={{ fontSize: 8 }}>
                {new Date(day.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function ProgressScreen() {
  const qc = useQueryClient();
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [tab, setTab] = useState<ActiveTab>('weight');

  const { data: weightData } = useQuery<{ logs: WeightLog[] }>({
    queryKey: ['progress-weight'],
    queryFn: () => apiFetch('/progress/weight'),
  });

  const { data: macroData } = useQuery<{ history: MacroDay[] }>({
    queryKey: ['meal-logs-history'],
    queryFn: () => apiFetch('/meal-logs/history'),
  });

  const addMutation = useMutation({
    mutationFn: (body: object) => apiFetch('/progress/weight', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress-weight'] });
      setWeight(''); setNotes('');
      Alert.alert('Guardado', 'Peso registrado');
    },
    onError: (err) => Alert.alert('Error', (err as Error).message),
  });

  const logs = weightData?.logs ?? [];
  const macroHistory = macroData?.history ?? [];
  const latest = logs[logs.length - 1];
  const first = logs[0];
  const delta = latest && first ? (latest.weightKg - first.weightKg) : null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Progreso</Text>
        <View className="flex-row gap-2 mt-3">
          {(['weight', 'macros'] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full ${tab === t ? 'bg-brand-600' : 'bg-gray-100'}`}>
              <Text className={`text-sm font-medium ${tab === t ? 'text-white' : 'text-gray-600'}`}>
                {t === 'weight' ? 'Peso' : 'Macros'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === 'weight' ? (
        <FlatList
          data={[...logs].reverse()}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <View>
              <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                <Text className="font-semibold text-gray-900 mb-3">Registrar peso</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  placeholder="Peso en kg (ej: 70.5)"
                  value={weight}
                  onChangeText={setWeight}
                  className="border border-gray-200 rounded-xl px-4 py-3 mb-3"
                />
                <TextInput placeholder="Notas (opcional)" value={notes} onChangeText={setNotes}
                  className="border border-gray-200 rounded-xl px-4 py-3 mb-3" />
                <TouchableOpacity
                  onPress={() => { if (!weight) return; addMutation.mutate({ weightKg: Number(weight), notes: notes || undefined }); }}
                  disabled={addMutation.isPending || !weight}
                  className="py-3 bg-brand-600 rounded-xl items-center"
                >
                  <Text className="text-white font-semibold">{addMutation.isPending ? 'Guardando...' : 'Registrar'}</Text>
                </TouchableOpacity>
              </View>

              {latest && (
                <View className="bg-white rounded-2xl p-5 shadow-sm mb-4 flex-row justify-around">
                  <View className="items-center">
                    <Text className="text-3xl font-bold text-gray-900">{latest.weightKg}</Text>
                    <Text className="text-sm text-gray-500">kg actual</Text>
                  </View>
                  {delta !== null && (
                    <View className="items-center">
                      <Text className={`text-3xl font-bold ${delta < 0 ? 'text-brand-600' : delta > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
                        {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                      </Text>
                      <Text className="text-sm text-gray-500">kg desde inicio</Text>
                    </View>
                  )}
                </View>
              )}

              {logs.length > 0 && <Text className="font-semibold text-gray-900 mb-3">Historial</Text>}
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl p-4 mb-2 flex-row items-center justify-between shadow-sm">
              <View>
                <Text className="font-medium text-gray-800">{item.weightKg} kg</Text>
                {item.notes && <Text className="text-xs text-gray-400">{item.notes}</Text>}
              </View>
              <Text className="text-sm text-gray-400">
                {new Date(item.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          )}
          ListEmptyComponent={<View className="items-center py-8"><Text className="text-gray-400">Sin registros aún</Text></View>}
        />
      ) : (
        <ScrollView className="flex-1 px-4 py-4">
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="font-semibold text-gray-900 mb-2">Calorías por día (últimos 14 días)</Text>
            {macroHistory.length > 0 ? (
              <MacroHistoryChart history={macroHistory} />
            ) : (
              <Text className="text-gray-400 text-sm py-6 text-center">
                Registrá comidas desde el menú para ver tus macros
              </Text>
            )}
          </View>

          {macroHistory.slice(-7).reverse().map((day) => (
            <View key={day.date} className="bg-white rounded-2xl p-4 mb-2 shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-medium text-gray-800 text-sm">
                  {new Date(day.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                </Text>
                <Text className="text-sm font-bold text-gray-700">{Math.round(day.calories)} kcal</Text>
              </View>
              <View className="flex-row gap-3">
                <Text className="text-xs text-green-600">P: {Math.round(day.proteinG)}g</Text>
                <Text className="text-xs text-blue-600">C: {Math.round(day.carbsG)}g</Text>
                <Text className="text-xs text-yellow-600">G: {Math.round(day.fatG)}g</Text>
              </View>
            </View>
          ))}

          {macroHistory.length === 0 && (
            <View className="items-center py-8">
              <Text className="text-gray-400">Sin datos de macros aún</Text>
            </View>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
