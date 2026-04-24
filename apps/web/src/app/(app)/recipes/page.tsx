'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, API_URL } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import type { InventoryItem, Recipe } from '@nutriplan/shared';

export default function RecipesPage() {
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [generatedRecipeId, setGeneratedRecipeId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [mealType, setMealType] = useState('LUNCH');
  const [servings, setServings] = useState(2);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  const { data: inventoryData } = useQuery<{ items: InventoryItem[] }>({
    queryKey: ['inventory'],
    queryFn: () => apiFetch('/inventory'),
  });

  const { data: savedData } = useQuery<{ recipes: Recipe[] }>({
    queryKey: ['saved-recipes'],
    queryFn: () => apiFetch('/recipes/saved'),
  });

  const saveMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/recipes/${id}/save`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-recipes'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/recipes/saved/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-recipes'] }),
  });

  function handleDeleteRecipe(id: string, name: string) {
    if (window.confirm(`¿Eliminar "${name}"?`)) deleteMutation.mutate(id);
  }

  function toggleItem(id: string) {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function generateRecipe() {
    setStreaming(true);
    setStreamText('');
    setGeneratedRecipeId(null);

    try {
      const res = await fetch(`${API_URL}/recipes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ inventoryItemIds: selectedItems, mealType, servings }),
      });

      if (!res.body) return;

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data) as { delta?: string; recipeId?: string; error?: string };
            if (parsed.delta) setStreamText((prev) => prev + parsed.delta);
            if (parsed.recipeId) setGeneratedRecipeId(parsed.recipeId);
          } catch { /* ignore parse errors */ }
        }
      }
    } finally {
      setStreaming(false);
    }
  }

  const inventory = inventoryData?.items ?? [];
  const savedRecipes = savedData?.recipes ?? [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Generador de recetas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Configurar receta</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo de comida</label>
              <select className="w-full px-4 py-3 border border-gray-200 rounded-xl" value={mealType} onChange={(e) => setMealType(e.target.value)}>
                <option value="BREAKFAST">Desayuno</option>
                <option value="MORNING_SNACK">Merienda mañana</option>
                <option value="LUNCH">Almuerzo</option>
                <option value="AFTERNOON_SNACK">Merienda tarde</option>
                <option value="DINNER">Cena</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Porciones</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button key={n} onClick={() => setServings(n)} className={`flex-1 py-2 rounded-xl border-2 font-semibold transition ${servings === n ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200'}`}>{n}</button>
                ))}
              </div>
            </div>
            {inventory.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Usar ingredientes del inventario (opcional)</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {inventory.map((item) => (
                    <label key={item.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                      <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleItem(item.id)} className="accent-brand-600" />
                      <span className="text-sm text-gray-700">{item.food?.nameEs ?? item.customName} — {item.quantity}{item.unit}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button onClick={generateRecipe} disabled={streaming} className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition disabled:opacity-60">
              {streaming ? 'Generando...' : '✨ Generar receta con IA'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Receta generada</h2>
          {!streamText && !streaming && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">🍳</div>
              <p className="text-sm">Configurá la receta y presioná generar</p>
            </div>
          )}
          {(streamText || streaming) && (
            <div className="space-y-3">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed max-h-80 overflow-y-auto">
                {streamText}
                {streaming && <span className="animate-pulse">▊</span>}
              </pre>
              {generatedRecipeId && !streaming && (
                <button
                  onClick={() => saveMutation.mutate(generatedRecipeId)}
                  disabled={saveMutation.isPending}
                  className="w-full py-2.5 border-2 border-brand-600 text-brand-600 font-semibold rounded-xl hover:bg-brand-50 transition"
                >
                  Guardar receta
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {savedRecipes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recetas guardadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedRecipes.map((recipe) => (
              <div key={recipe.id} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
                  <button
                    onClick={() => handleDeleteRecipe(recipe.id, recipe.name)}
                    disabled={deleteMutation.isPending}
                    className="text-gray-300 hover:text-red-500 transition ml-2 text-lg leading-none"
                    title="Eliminar receta"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-3">{recipe.description}</p>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span>{recipe.calories} kcal</span>
                  <span>·</span>
                  <span>P:{recipe.proteinG}g</span>
                  <span>·</span>
                  <span>{recipe.prepTimeMins + recipe.cookTimeMins}min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
