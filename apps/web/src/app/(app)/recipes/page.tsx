'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { Recipe } from '@nutriplan/shared';

const FILTER_OPTIONS = [
  { label: 'Todas',     value: 'ALL' },
  { label: 'Desayuno',  value: 'BREAKFAST' },
  { label: 'Almuerzo',  value: 'LUNCH' },
  { label: 'Merienda',  value: 'MORNING_SNACK' },
  { label: 'Cena',      value: 'DINNER' },
] as const;

type FilterValue = typeof FILTER_OPTIONS[number]['value'];

const MEAL_EMOJI: Record<string, string> = {
  BREAKFAST: '🌅', MORNING_SNACK: '🍎', LUNCH: '🥗',
  AFTERNOON_SNACK: '🧃', DINNER: '🍽️',
};

function getEmojiForRecipe(recipe: Recipe): string {
  for (const tag of recipe.tags) {
    if (MEAL_EMOJI[tag]) return MEAL_EMOJI[tag];
  }
  return '🍽️';
}

export default function MisRecetasPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterValue>('ALL');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<{ recipes: Recipe[] }>({
    queryKey: ['saved-recipes'],
    queryFn: () => apiFetch('/recipes/saved'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/recipes/saved/${id}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['saved-recipes'] }),
  });

  const recipes = data?.recipes ?? [];

  const filtered = recipes.filter(r => {
    const matchesFilter = filter === 'ALL' || r.tags.includes(filter);
    const matchesSearch = !search.trim() || r.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-black mb-1" style={{ color: '#2C2416' }}>Mis Recetas</h1>
        <p className="text-[13px]" style={{ color: '#9A8B7A' }}>
          Tus recetas guardadas — se agregan solas cuando generás el plan semanal.
        </p>
      </div>

      {/* Search */}
      <input
        className="w-full border rounded-[12px] px-4 py-3 text-[14px] font-semibold mb-4 outline-none"
        style={{ borderColor: '#EDE3D2', color: '#2C2416', background: '#fff' }}
        placeholder="Buscar receta..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className="shrink-0 px-4 py-2 rounded-full text-[12px] font-bold transition-colors"
            style={
              filter === opt.value
                ? { background: '#5C7A2C', color: '#fff' }
                : { background: '#F7F1E8', color: '#7A6E63', border: '1px solid #EDE3D2' }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Recipe grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-[16px] h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🍳</div>
          <p className="text-[14px] font-bold mb-1" style={{ color: '#6B5A47' }}>
            {recipes.length === 0 ? 'Todavía no tenés recetas guardadas' : 'No hay recetas con ese filtro'}
          </p>
          <p className="text-[12px]" style={{ color: '#9A8B7A' }}>
            {recipes.length === 0
              ? 'Generá tu plan semanal en Mi Semana y las recetas se guardan solas.'
              : 'Probá con otro filtro o búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(recipe => (
            <div
              key={recipe.id}
              className="bg-white rounded-[16px] p-4"
              style={{ border: '1.5px solid #EDE3D2', boxShadow: '0 2px 8px rgba(44,36,22,0.04)' }}
            >
              <div className="text-3xl mb-3">{getEmojiForRecipe(recipe)}</div>
              <div className="text-[14px] font-extrabold leading-[1.3] mb-2" style={{ color: '#2C2416' }}>
                {recipe.name}
              </div>
              <div className="flex flex-wrap gap-[5px] mb-3">
                <span className="text-[11px] font-bold px-2 py-1 rounded-full"
                  style={{ background: '#F7F1E8', color: '#7A6E63', border: '1px solid #EDE3D2' }}>
                  🔥 {recipe.calories} kcal
                </span>
                <span className="text-[11px] font-bold px-2 py-1 rounded-full"
                  style={{ background: '#F7F1E8', color: '#7A6E63', border: '1px solid #EDE3D2' }}>
                  💪 {recipe.proteinG}g prot
                </span>
              </div>
              <div className="flex gap-2">
                {recipe.steps.length > 0 ? (
                  <details className="flex-1">
                    <summary
                      className="text-[12px] font-bold cursor-pointer px-3 py-2 rounded-[9px] text-center"
                      style={{ background: '#EEF5E2', color: '#4A6C1A', listStyle: 'none' }}
                    >
                      Ver preparación
                    </summary>
                    <ol className="mt-2 space-y-1 text-[12px]" style={{ color: '#6B5A47' }}>
                      {recipe.steps.map((step, i) => (
                        <li key={i}>{i + 1}. {step}</li>
                      ))}
                    </ol>
                  </details>
                ) : null}
                <button
                  onClick={() => deleteMutation.mutate(recipe.id)}
                  disabled={deleteMutation.isPending && deleteMutation.variables === recipe.id}
                  className="text-[11px] font-bold px-3 py-2 rounded-[9px] border disabled:opacity-40"
                  style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FEF2F2' }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
