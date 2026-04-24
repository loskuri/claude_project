'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { InventoryItem, Food } from '@nutriplan/shared';
import { daysUntil } from '@nutriplan/shared';

function ExpiryBadge({ days }: { days: number | null | undefined }) {
  if (days === null || days === undefined) return null;
  const cls =
    days <= 0
      ? 'bg-red-100 text-red-700'
      : days <= 3
        ? 'bg-orange-100 text-orange-700'
        : days <= 7
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-gray-100 text-gray-600';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {days <= 0 ? 'Vencido' : `${days}d`}
    </span>
  );
}

export default function InventoryPage() {
  const qc = useQueryClient();
  const [searchQ, setSearchQ] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ foodId: '', customName: '', quantity: '', unit: 'g', expiryDate: '' });
  const [foodSearch, setFoodSearch] = useState('');
  const [addedName, setAddedName] = useState<string | null>(null);

  const { data } = useQuery<{ items: InventoryItem[] }>({
    queryKey: ['inventory'],
    queryFn: () => apiFetch('/inventory'),
  });

  const { data: foodResults } = useQuery<{ foods: Food[] }>({
    queryKey: ['foods-search', foodSearch],
    queryFn: () => apiFetch(`/foods/search?q=${encodeURIComponent(foodSearch)}&limit=10`),
    enabled: foodSearch.length > 1,
  });

  const addMutation = useMutation({
    mutationFn: (body: object) => apiFetch('/inventory', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      const name = form.foodId ? foodSearch : form.customName;
      setAddedName(name);
      setTimeout(() => setAddedName(null), 3000);
      setShowAddForm(false);
      setForm({ foodId: '', customName: '', quantity: '', unit: 'g', expiryDate: '' });
      setFoodSearch('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/inventory/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const items = data?.items ?? [];
  const filtered = items.filter((item) => {
    const name = (item.food?.nameEs ?? item.customName ?? '').toLowerCase();
    return name.includes(searchQ.toLowerCase());
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    addMutation.mutate({
      foodId: form.foodId || undefined,
      customName: form.customName || undefined,
      quantity: Number(form.quantity),
      unit: form.unit,
      expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
    });
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mi inventario</h1>
        <button onClick={() => setShowAddForm(!showAddForm)} className="px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition">
          + Agregar alimento
        </button>
      </div>

      {addedName && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
          ✓ {addedName} agregado al inventario
        </div>
      )}

      {items.some(i => i.expiryDate && daysUntil(i.expiryDate) !== null && (daysUntil(i.expiryDate) as number) <= 3) && (
        <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-3 rounded-xl">
          ⚠️ Tenés alimentos próximos a vencer — revisá los marcados en naranja o rojo
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Agregar alimento</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Buscar en base de datos</label>
            <input
              className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              placeholder="Ej: Arroz, Pollo, Manzana..."
              value={foodSearch}
              onChange={(e) => setFoodSearch(e.target.value)}
            />
            {foodResults?.foods && foodResults.foods.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                {foodResults.foods.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => { setForm(p => ({ ...p, foodId: f.id, customName: '' })); setFoodSearch(f.nameEs); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-50 transition ${form.foodId === f.id ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}
                  >
                    {f.nameEs} <span className="text-gray-400">— {f.calories} kcal/100g</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {!form.foodId && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">O ingresá el nombre manualmente</label>
              <input className="w-full px-4 py-3 border border-gray-200 rounded-xl" placeholder="Nombre del alimento" value={form.customName} onChange={(e) => setForm(p => ({ ...p, customName: e.target.value }))} />
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Cantidad</label>
              <input type="number" required className="w-full px-4 py-3 border border-gray-200 rounded-xl" value={form.quantity} onChange={(e) => setForm(p => ({ ...p, quantity: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Unidad</label>
              <select className="w-full px-4 py-3 border border-gray-200 rounded-xl" value={form.unit} onChange={(e) => setForm(p => ({ ...p, unit: e.target.value }))}>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="L">L</option>
                <option value="units">unidades</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Fecha de vencimiento (opcional)</label>
            <input type="date" className="w-full px-4 py-3 border border-gray-200 rounded-xl" value={form.expiryDate} onChange={(e) => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl">Cancelar</button>
            <button type="submit" disabled={addMutation.isPending} className="flex-1 py-3 bg-brand-600 text-white font-semibold rounded-xl disabled:opacity-60">
              {addMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      <div className="mb-4">
        <input
          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white"
          placeholder="Buscar en mi inventario..."
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {items.length === 0 ? 'Tu inventario está vacío' : 'No se encontraron resultados'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="text-left px-6 py-4">Alimento</th>
                <th className="text-right px-6 py-4">Cantidad</th>
                <th className="text-center px-6 py-4">Vencimiento</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {item.food?.nameEs ?? item.customName}
                    {item.food?.category && <span className="ml-2 text-xs text-gray-400">{item.food.category}</span>}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">{item.quantity} {item.unit}</td>
                  <td className="px-6 py-4 text-center">
                    <ExpiryBadge days={item.expiryDate ? daysUntil(item.expiryDate) : null} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => deleteMutation.mutate(item.id)} className="text-xs text-red-500 hover:text-red-700 transition">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
