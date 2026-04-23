import { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Alert, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { InventoryItem, Food } from '@nutriplan/shared';
import { daysUntil } from '@nutriplan/shared';

function ExpiryBadge({ days }: { days: number | null | undefined }) {
  if (days === null || days === undefined) return null;
  const bg = days <= 0 ? 'bg-red-100' : days <= 3 ? 'bg-orange-100' : days <= 7 ? 'bg-yellow-100' : 'bg-gray-100';
  const text = days <= 0 ? 'text-red-700' : days <= 3 ? 'text-orange-700' : days <= 7 ? 'text-yellow-700' : 'text-gray-500';
  return <View className={`px-2 py-0.5 rounded-full ${bg}`}><Text className={`text-xs font-medium ${text}`}>{days <= 0 ? 'Vencido' : `${days}d`}</Text></View>;
}

export default function InventoryScreen() {
  const qc = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ foodId: '', customName: '', quantity: '', unit: 'g' });
  const [foodSearch, setFoodSearch] = useState('');

  const { data } = useQuery<{ items: InventoryItem[] }>({
    queryKey: ['inventory'],
    queryFn: () => apiFetch('/inventory'),
  });

  const { data: foodResults } = useQuery<{ foods: Food[] }>({
    queryKey: ['foods-search-mobile', foodSearch],
    queryFn: () => apiFetch(`/foods/search?q=${encodeURIComponent(foodSearch)}&limit=8`),
    enabled: foodSearch.length > 1,
  });

  const addMutation = useMutation({
    mutationFn: (body: object) => apiFetch('/inventory', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); setShowAdd(false); setForm({ foodId: '', customName: '', quantity: '', unit: 'g' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/inventory/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });

  async function openScanner() {
    if (!permission?.granted) await requestPermission();
    setScanning(true);
  }

  async function onBarcodeScanned({ data: barcode }: { data: string }) {
    setScanning(false);
    try {
      const food = await apiFetch<Food>(`/foods/barcode/${barcode}`);
      setForm(p => ({ ...p, foodId: food.id, customName: '' }));
      setFoodSearch(food.nameEs);
      setShowAdd(true);
    } catch {
      Alert.alert('Producto no encontrado', `Código: ${barcode}\nPodés ingresarlo manualmente.`);
      setShowAdd(true);
    }
  }

  const items = data?.items ?? [];

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900 mb-3">Inventario</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={openScanner} className="flex-1 py-2.5 border-2 border-brand-600 rounded-xl items-center">
            <Text className="text-brand-600 font-semibold text-sm">📷 Escanear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAdd(true)} className="flex-1 py-2.5 bg-brand-600 rounded-xl items-center">
            <Text className="text-white font-semibold text-sm">+ Agregar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<View className="items-center py-16"><Text className="text-gray-400">Tu inventario está vacío</Text></View>}
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 mb-3 flex-row items-center justify-between shadow-sm">
            <View className="flex-1">
              <Text className="font-medium text-gray-800">{item.food?.nameEs ?? item.customName}</Text>
              <Text className="text-sm text-gray-500">{item.quantity} {item.unit}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <ExpiryBadge days={item.expiryDate ? daysUntil(item.expiryDate) : null} />
              <TouchableOpacity onPress={() => Alert.alert('Eliminar', '¿Eliminar este ítem?', [{ text: 'Cancelar' }, { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) }])}>
                <Text className="text-gray-300 text-lg">✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={scanning} animationType="slide">
        <View className="flex-1">
          <CameraView className="flex-1" onBarcodeScanned={onBarcodeScanned} barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}>
            <View className="flex-1 items-center justify-center">
              <View className="w-64 h-32 border-2 border-white rounded-xl opacity-70" />
              <Text className="text-white mt-4 text-sm">Apuntá al código de barras</Text>
            </View>
            <TouchableOpacity onPress={() => setScanning(false)} className="absolute top-14 right-5 bg-black/50 px-4 py-2 rounded-xl">
              <Text className="text-white font-semibold">Cancelar</Text>
            </TouchableOpacity>
          </CameraView>
        </View>
      </Modal>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-gray-50 px-6 pt-8">
          <Text className="text-xl font-bold text-gray-900 mb-4">Agregar alimento</Text>
          <TextInput placeholder="Buscar alimento..." value={foodSearch} onChangeText={setFoodSearch} className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-2" />
          {foodResults?.foods.map((f) => (
            <TouchableOpacity key={f.id} onPress={() => { setForm(p => ({ ...p, foodId: f.id })); setFoodSearch(f.nameEs); }} className={`px-4 py-2.5 rounded-xl mb-1 ${form.foodId === f.id ? 'bg-brand-50 border border-brand-200' : 'bg-white'}`}>
              <Text className="text-sm text-gray-700">{f.nameEs}</Text>
            </TouchableOpacity>
          ))}
          {!form.foodId && <TextInput placeholder="O nombre manual" value={form.customName} onChangeText={(v) => setForm(p => ({ ...p, customName: v }))} className="bg-white border border-gray-200 rounded-xl px-4 py-3 mt-2" />}
          <View className="flex-row gap-3 mt-4">
            <TextInput keyboardType="numeric" placeholder="Cantidad" value={form.quantity} onChangeText={(v) => setForm(p => ({ ...p, quantity: v }))} className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3" />
            <View className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <Text className="text-gray-700">{form.unit}</Text>
            </View>
          </View>
          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity onPress={() => setShowAdd(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl items-center"><Text className="text-gray-700 font-semibold">Cancelar</Text></TouchableOpacity>
            <TouchableOpacity
              disabled={addMutation.isPending}
              onPress={() => addMutation.mutate({ foodId: form.foodId || undefined, customName: form.customName || undefined, quantity: Number(form.quantity), unit: form.unit })}
              className="flex-1 py-3 bg-brand-600 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">{addMutation.isPending ? 'Guardando...' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
