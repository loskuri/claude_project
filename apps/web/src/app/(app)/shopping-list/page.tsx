'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';

type ShoppingItem = {
  name: string;
  quantity: number;
  unit: string;
};

type ShoppingCategory = {
  category: string;
  emoji: string;
  items: ShoppingItem[];
};

function formatQty(quantity: number, unit: string): string {
  const q = quantity % 1 === 0 ? quantity : parseFloat(quantity.toFixed(1));
  return `${q} ${unit}`;
}

const INVENTORY_UNITS = new Set(['g', 'kg', 'ml', 'L', 'units']);

export default function ShoppingListPage() {
  const qc = useQueryClient();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [savingInventory, setSavingInventory] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['shopping-list'],
    queryFn: () => apiFetch<ShoppingCategory[]>('/diet/shopping-list'),
  });

  function toggleItem(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function clearChecked() {
    setChecked(new Set());
    setSavedCount(null);
  }

  async function saveCheckedToInventory() {
    if (!data || checked.size === 0) return;
    setSavingInventory(true);
    setSavedCount(null);
    let count = 0;
    for (const cat of data) {
      for (const item of cat.items) {
        const key = `${item.name}|${item.unit}`;
        if (!checked.has(key)) continue;
        const unit = INVENTORY_UNITS.has(item.unit) ? item.unit : 'units';
        try {
          await apiFetch('/inventory', {
            method: 'POST',
            body: JSON.stringify({ customName: item.name, quantity: item.quantity, unit }),
          });
          count++;
        } catch { /* skip individual failures */ }
      }
    }
    qc.invalidateQueries({ queryKey: ['inventory'] });
    setSavedCount(count);
    setSavingInventory(false);
  }

  const totalItems = data?.reduce((s, c) => s + c.items.length, 0) ?? 0;
  const checkedCount = checked.size;

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 space-y-3">
              <div className="h-5 bg-gray-100 rounded w-40" />
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-4 bg-gray-50 rounded w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 text-red-700 rounded-2xl p-5 text-sm">
          No se pudo cargar la lista.{' '}
          <button onClick={() => refetch()} className="underline font-medium">Reintentar</button>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Lista de compras</h1>
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-gray-700 font-medium mb-1">No hay ingredientes esta semana</p>
          <p className="text-sm text-gray-500 mb-5">Generá un plan de comidas para ver qué necesitás comprar.</p>
          <Link
            href="/generate-plan"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl text-sm transition"
            style={{ backgroundColor: '#5C7A2C' }}
          >
            ✨ Generar plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto print:p-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lista de compras</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalItems} ingredientes esta semana
            {checkedCount > 0 && ` · ${checkedCount} marcados`}
          </p>
        </div>
        <div className="flex gap-2">
          {checkedCount > 0 && (
            <>
              <button
                onClick={saveCheckedToInventory}
                disabled={savingInventory}
                className="px-3 py-2 text-sm font-medium rounded-xl transition border-2 disabled:opacity-50"
                style={{ borderColor: '#5C7A2C', color: '#5C7A2C' }}
              >
                {savingInventory ? 'Guardando…' : `🥫 Al inventario (${checkedCount})`}
              </button>
              <button
                onClick={clearChecked}
                className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Limpiar
              </button>
            </>
          )}
          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-sm font-medium text-white rounded-xl transition"
            style={{ backgroundColor: '#5C7A2C' }}
          >
            Imprimir
          </button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold text-gray-900">Lista de compras — NutriPlan</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('es-AR')}</p>
      </div>

      {/* Progress bar */}
      {checkedCount > 0 && (
        <div className="mb-5 print:hidden">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Progreso</span>
            <span>{checkedCount}/{totalItems}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(checkedCount / totalItems) * 100}%`, backgroundColor: '#5C7A2C' }}
            />
          </div>
        </div>
      )}

      {/* Inventory save confirmation */}
      {savedCount !== null && (
        <div className="mb-4 px-4 py-3 bg-brand-50 border border-brand-200 rounded-xl text-sm font-medium text-brand-700 flex items-center justify-between print:hidden">
          <span>✓ {savedCount} producto{savedCount !== 1 ? 's' : ''} guardado{savedCount !== 1 ? 's' : ''} en el inventario</span>
          <Link href="/inventory" className="underline text-brand-600 text-xs">Ver inventario →</Link>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-4">
        {data.map((cat) => {
          const catChecked = cat.items.filter((item) =>
            checked.has(`${item.name}|${item.unit}`)
          ).length;
          const allDone = catChecked === cat.items.length;

          return (
            <div
              key={cat.category}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-opacity print:shadow-none print:border print:border-gray-200 ${allDone ? 'opacity-60' : ''}`}
            >
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F3EDE5' }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="font-semibold text-sm text-gray-800">{cat.category}</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {catChecked > 0 ? `${catChecked}/` : ''}{cat.items.length}
                </span>
              </div>

              <ul className="divide-y divide-gray-50">
                {cat.items.map((item) => {
                  const key = `${item.name}|${item.unit}`;
                  const isChecked = checked.has(key);
                  return (
                    <li key={key}>
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition print:pointer-events-none"
                      >
                        <span
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors print:hidden ${
                            isChecked
                              ? 'border-brand-600 bg-brand-600'
                              : 'border-gray-200'
                          }`}
                        >
                          {isChecked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className={`flex-1 text-sm ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {item.name}
                        </span>
                        <span className={`text-sm font-medium shrink-0 ${isChecked ? 'text-gray-300' : 'text-gray-500'}`}>
                          {formatQty(item.quantity, item.unit)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
