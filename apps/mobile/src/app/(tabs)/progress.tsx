import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

interface WeightLog {
  id: string;
  date: string;
  weightKg: number;
  notes?: string;
}

export default function ProgressScreen() {
  const qc = useQueryClient();
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const { data } = useQuery<{ logs: WeightLog[] }>({
    queryKey: ['progress-weight'],
    queryFn: () => apiFetch('/progress/weight'),
  });

  const addMutation = useMutation({
    mutationFn: (body: object) => apiFetch('/progress/weight', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['progress-weight'] }); setWeight(''); setNotes(''); Alert.alert('Guardado', 'Peso registrado'); },
    onError: (err) => Alert.alert('Error', (err as Error).message),
  });

  const logs = data?.logs ?? [];
  const latest = logs[logs.length - 1];
  const first = logs[0];
  const delta = latest && first ? (latest.weightKg - first.weightKg) : null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Progreso</Text>
      </View>

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
              <TextInput placeholder="Notas (opcional)" value={notes} onChangeText={setNotes} className="border border-gray-200 rounded-xl px-4 py-3 mb-3" />
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
            <Text className="text-sm text-gray-400">{new Date(item.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</Text>
          </View>
        )}
        ListEmptyComponent={<View className="items-center py-8"><Text className="text-gray-400">Sin registros aún</Text></View>}
      />
    </KeyboardAvoidingView>
  );
}
