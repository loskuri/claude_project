'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

type Food = { id: string; nameEs: string; category: string };

type InventoryItem = {
  id: string;
  customName: string | null;
  quantity: number;
  unit: string;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  food: { id: string; nameEs: string; category: string } | null;
};

type ItemFormData = {
  foodId?: string;
  customName?: string;
  quantity: number;
  unit: string;
  expiryDate: string;
};

const UNITS = ['g', 'kg', 'ml', 'L', 'units'] as const;

const CATEGORY_ORDER = [
  'Carnes y proteínas', 'Lácteos', 'Verduras y hortalizas', 'Frutas',
  'Cereales y panificados', 'Legumbres', 'Aceites y condimentos',
  'Frutas secas y semillas', 'Otros',
];

const CATEGORY_EMOJI: Record<string, string> = {
  'Carnes y proteínas': '🥩', 'Lácteos': '🥛', 'Verduras y hortalizas': '🥦',
  'Frutas': '🍎', 'Cereales y panificados': '🌾', 'Legumbres': '🫘',
  'Aceites y condimentos': '🫙', 'Frutas secas y semillas': '🥜', 'Otros': '📦',
};

function itemName(item: InventoryItem): string {
  return item.food?.nameEs ?? item.customName ?? '—';
}

function itemCategory(item: InventoryItem): string {
  return item.food?.category ?? 'Otros';
}

function expiryLabel(days: number | null): { text: string; cls: string } | null {
  if (days === null) return null;
  if (days < 0) return { text: 'Vencido', cls: 'text-red-700 bg-red-100' };
  if (days === 0) return { text: 'Vence hoy', cls: 'text-red-700 bg-red-100' };
  if (days === 1) return { text: 'Vence mañana', cls: 'text-orange-700 bg-orange-100' };
  if (days <= 3) return { text: `${days} días`, cls: 'text-orange-600 bg-orange-50' };
  return { text: `${days} días`, cls: 'text-gray-400 bg-gray-50' };
}

// ─── Food search combobox ─────────────────────────────────────────────────────

function FoodSearch({ onSelect }: { onSelect: (food: Food | null, customName: string) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Food | null>(null);
  const [useCustom, setUseCustom] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(val: string) {
    setQ(val);
    setSelected(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await apiFetch<{ foods: Food[] }>(`/foods/search?q=${encodeURIComponent(val)}&limit=8`);
        setResults(data.foods);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function pick(food: Food) {
    setSelected(food);
    setQ(food.nameEs);
    setResults([]);
    onSelect(food, '');
  }

  if (useCustom) {
    return (
      <div className="space-y-2">
        <input
          autoFocus
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
          placeholder="Nombre del producto"
          onChange={(e) => onSelect(null, e.target.value)}
        />
        <button type="button" onClick={() => setUseCustom(false)} className="text-xs text-brand-600 hover:underline">
          ← Buscar en base de datos
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        autoFocus
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
        placeholder="Buscar alimento (ej: pollo, arroz...)"
        value={q}
        onChange={(e) => handleChange(e.target.value)}
      />
      {loading && <div className="absolute right-3 top-3 text-xs text-gray-400">…</div>}
      {results.length > 0 && !selected && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {results.map((f) => (
            <li key={f.id}>
              <button type="button" onClick={() => pick(f)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between gap-2">
                <span className="font-medium text-gray-800">{f.nameEs}</span>
                <span className="text-xs text-gray-400 shrink-0">{f.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => setUseCustom(true)} className="mt-1.5 text-xs text-brand-600 hover:underline">
        No encuentro mi alimento →
      </button>
    </div>
  );
}

// ─── Add / Edit modal ─────────────────────────────────────────────────────────

function ItemModal({
  item,
  onClose,
  onSave,
  saving,
}: {
  item?: InventoryItem;
  onClose: () => void;
  onSave: (data: ItemFormData) => void;
  saving: boolean;
}) {
  const isEdit = !!item;
  const [foodId, setFoodId] = useState<string | undefined>(item?.food?.id);
  const [customName, setCustomName] = useState(item?.customName ?? '');
  const [quantity, setQuantity] = useState(String(item?.quantity ?? ''));
  const [unit, setUnit] = useState<string>(item?.unit ?? 'g');
  const [expiryDate, setExpiryDate] = useState(
    item?.expiryDate ? item.expiryDate.slice(0, 10) : ''
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && !foodId && !customName.trim()) return;
    onSave({ foodId, customName: customName || undefined, quantity: Number(quantity), unit, expiryDate });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Editar item' : 'Agregar al inventario'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl px-2">×</button>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          {!isEdit && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Alimento</label>
              <FoodSearch onSelect={(food, name) => { setFoodId(food?.id); setCustomName(name); }} />
            </div>
          )}
          {isEdit && (
            <div className="text-sm font-semibold text-gray-800 bg-gray-50 px-4 py-2.5 rounded-xl">
              {itemName(item!)}
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Cantidad</label>
              <input required type="number" min="0.1" step="any" value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Unidad</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Fecha de vencimiento (opcional)</label>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: '#5C7A2C' }}>
              {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => apiFetch<{ items: InventoryItem[] }>('/inventory').then((r) => r.items),
  });

  const addMutation = useMutation({
    mutationFn: (body: ItemFormData) =>
      apiFetch('/inventory', { method: 'POST', body: JSON.stringify({
        ...body,
        expiryDate: body.expiryDate ? new Date(body.expiryDate).toISOString() : undefined,
      })}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); setShowAdd(false); },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ItemFormData> }) =>
      apiFetch(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify({
        quantity: data.quantity,
        unit: data.unit,
        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : data.expiryDate,
      })}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); setEditItem(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/inventory/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); setDeleteId(null); },
  });

  const items = data ?? [];
  const q = search.trim().toLowerCase();
  const filtered = q ? items.filter((i) => itemName(i).toLowerCase().includes(q)) : items;

  const expiring = filtered.filter((i) => i.daysUntilExpiry !== null && i.daysUntilExpiry <= 3);

  const byCategory = new Map<string, InventoryItem[]>();
  for (const item of filtered) {
    const cat = itemCategory(item);
    const list = byCategory.get(cat) ?? [];
    list.push(item);
    byCategory.set(cat, list);
  }
  const categories = CATEGORY_ORDER.filter((c) => byCategory.has(c));

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          {items.length > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">{items.length} producto{items.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2 text-white font-semibold rounded-xl text-sm flex items-center gap-2 shrink-0"
          style={{ backgroundColor: '#5C7A2C' }}>
          + Agregar
        </button>
      </div>

      {/* Search */}
      {items.length > 4 && (
        <div className="mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en mi inventario…"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white" />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🥫</p>
          <p className="font-medium text-gray-700 mb-1">Tu inventario está vacío</p>
          <p className="text-sm text-gray-400 mb-5">Agregá los alimentos que tenés en casa para no comprar de más.</p>
          <button onClick={() => setShowAdd(true)}
            className="px-5 py-2.5 text-white font-semibold rounded-xl text-sm"
            style={{ backgroundColor: '#5C7A2C' }}>
            + Agregar primer producto
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Expiring soon */}
          {expiring.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-2 border-b border-orange-100">
                <span className="text-base">⚠️</span>
                <span className="font-semibold text-sm text-orange-800">Por vencer ({expiring.length})</span>
              </div>
              <ul className="divide-y divide-orange-50">
                {expiring.map((item) => {
                  const exp = expiryLabel(item.daysUntilExpiry)!;
                  return (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="flex-1 text-sm font-medium text-gray-800">{itemName(item)}</span>
                      <span className="text-sm text-gray-500">{item.quantity} {item.unit}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${exp.cls}`}>{exp.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* By category */}
          {categories.map((cat) => {
            const catItems = byCategory.get(cat)!;
            return (
              <div key={cat} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #F3EDE5' }}>
                  <span className="text-lg">{CATEGORY_EMOJI[cat] ?? '📦'}</span>
                  <span className="font-semibold text-sm text-gray-800">{cat}</span>
                  <span className="text-xs text-gray-400 ml-auto">{catItems.length}</span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {catItems.map((item) => {
                    const exp = expiryLabel(item.daysUntilExpiry);
                    return (
                      <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="flex-1 text-sm text-gray-800 font-medium truncate">{itemName(item)}</span>
                        <span className="text-sm text-gray-500 shrink-0">{item.quantity} {item.unit}</span>
                        {exp && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${exp.cls}`}>{exp.text}</span>
                        )}
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => setEditItem(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
                            aria-label="Editar">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => setDeleteId(item.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                            aria-label="Eliminar">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <ItemModal
          onClose={() => setShowAdd(false)}
          onSave={(d) => addMutation.mutate(d)}
          saving={addMutation.isPending}
        />
      )}

      {/* Edit modal */}
      {editItem && (
        <ItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={(d) => editMutation.mutate({ id: editItem.id, data: d })}
          saving={editMutation.isPending}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <p className="font-semibold text-gray-900 mb-1">¿Eliminar este item?</p>
            <p className="text-sm text-gray-500 mb-5">Se quitará de tu inventario.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700">
                Cancelar
              </button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
