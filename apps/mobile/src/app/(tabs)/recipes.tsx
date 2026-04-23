import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, API_URL } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import type { InventoryItem } from '@nutriplan/shared';

export default function RecipesScreen() {
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [mealType, setMealType] = useState('LUNCH');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const { data: inventoryData } = useQuery<{ items: InventoryItem[] }>({
    queryKey: ['inventory'],
    queryFn: () => apiFetch('/inventory'),
  });

  const saveMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/recipes/${id}/save`, { method: 'POST' }),
    onSuccess: () => { Alert.alert('Guardada', 'Receta guardada correctamente'); qc.invalidateQueries({ queryKey: ['saved-recipes'] }); },
  });

  function toggleItem(id: string) {
    setSelectedItems((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function generate() {
    setStreaming(true);
    setStreamText('');
    setRecipeId(null);
    try {
      const res = await fetch(`${API_URL}/recipes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ inventoryItemIds: selectedItems, mealType, servings: 2 }),
      });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const p = JSON.parse(data) as { delta?: string; recipeId?: string };
            if (p.delta) setStreamText((prev) => prev + p.delta);
            if (p.recipeId) setRecipeId(p.recipeId);
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setStreaming(false);
    }
  }

  const inventory = inventoryData?.items ?? [];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Generador de recetas</Text>
      </View>

      <View className="px-4 py-4 space-y-4">
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <Text className="font-semibold text-gray-900 mb-3">Tipo de comida</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {[
                { value: 'BREAKFAST', label: 'Desayuno' },
                { value: 'LUNCH', label: 'Almuerzo' },
                { value: 'DINNER', label: 'Cena' },
                { value: 'AFTERNOON_SNACK', label: 'Merienda' },
              ].map((m) => (
                <TouchableOpacity key={m.value} onPress={() => setMealType(m.value)} className={`px-4 py-2 rounded-xl ${mealType === m.value ? 'bg-brand-600' : 'bg-gray-100'}`}>
                  <Text className={`font-medium text-sm ${mealType === m.value ? 'text-white' : 'text-gray-600'}`}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {inventory.length > 0 && (
            <View className="mt-4">
              <Text className="font-semibold text-gray-900 mb-2">Usar del inventario</Text>
              {inventory.slice(0, 8).map((item) => (
                <TouchableOpacity key={item.id} onPress={() => toggleItem(item.id)} className="flex-row items-center py-2">
                  <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${selectedItems.includes(item.id) ? 'bg-brand-600 border-brand-600' : 'border-gray-300'}`}>
                    {selectedItems.includes(item.id) && <Text className="text-white text-xs">✓</Text>}
                  </View>
                  <Text className="text-sm text-gray-700">{item.food?.nameEs ?? item.customName} — {item.quantity}{item.unit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity onPress={generate} disabled={streaming} className="mt-4 py-3 bg-brand-600 rounded-xl items-center">
            <Text className="text-white font-semibold">{streaming ? 'Generando...' : '✨ Generar receta'}</Text>
          </TouchableOpacity>
        </View>

        {(streamText || streaming) && (
          <View className="bg-white rounded-2xl p-5 shadow-sm">
            <Text className="font-semibold text-gray-900 mb-3">Receta</Text>
            <Text className="text-sm text-gray-700 leading-6">
              {streamText}
              {streaming && '▊'}
            </Text>
            {recipeId && !streaming && (
              <TouchableOpacity onPress={() => saveMutation.mutate(recipeId)} disabled={saveMutation.isPending} className="mt-4 py-3 border-2 border-brand-600 rounded-xl items-center">
                <Text className="text-brand-600 font-semibold">{saveMutation.isPending ? 'Guardando...' : 'Guardar receta'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
