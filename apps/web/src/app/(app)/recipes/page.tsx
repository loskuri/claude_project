'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, API_URL } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import type { InventoryItem, Recipe, MealIngredient, MealType } from '@nutriplan/shared';

export default function RecipesPage() {
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();
  const [streaming, setStreaming] = useState(false);
  const [displayedRecipe, setDisplayedRecipe] = useState<Partial<Recipe> | null>(null);
  const [displayedRecipeId, setDisplayedRecipeId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [mealType, setMealType] = useState<MealType>('LUNCH');
  const [servings, setServings] = useState(2);
  const [useStockIngredients, setUseStockIngredients] = useState(true);
  const [ingredientsPrompt, setIngredientsPrompt] = useState('');
  const [useSuggestions, setUseSuggestions] = useState(false);
  const [suggestionsPrompt, setSuggestionsPrompt] = useState('');
  const [showLogMealForm, setShowLogMealForm] = useState(false);
  const [mealDate, setMealDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [mealPortions, setMealPortions] = useState(1);
  const [mealLogSuccess, setMealLogSuccess] = useState<string | null>(null);
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

  const logMealMutation = useMutation({
    mutationFn: (payload: {
      recipe: Partial<Recipe>;
      mealType: MealType;
      date: string;
      portions: number;
    }) => {
      const multiplier = Number.isFinite(payload.portions) ? payload.portions : 1;
      return apiFetch('/meal-logs', {
        method: 'POST',
        body: JSON.stringify({
          mealType: payload.mealType,
          name: payload.recipe.name ?? 'Comida',
          calories: Math.round((payload.recipe.calories ?? 0) * multiplier),
          proteinG: Math.round((payload.recipe.proteinG ?? 0) * multiplier),
          carbsG: Math.round((payload.recipe.carbsG ?? 0) * multiplier),
          fatG: Math.round((payload.recipe.fatG ?? 0) * multiplier),
          quantity: multiplier,
          notes: `Desde receta: ${payload.recipe.name ?? 'sin nombre'}`,
          date: payload.date,
        }),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['meal-logs'] });
      setShowLogMealForm(false);
      setMealLogSuccess('Meal cargado correctamente');
      setTimeout(() => setMealLogSuccess(null), 3000);
    },
  });

  function handleDeleteRecipe(id: string, name: string) {
    if (window.confirm(`¿Eliminar "${name}"?`)) deleteMutation.mutate(id);
  }

  function toggleItem(id: string) {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleViewSavedRecipe(recipe: Recipe) {
    setDisplayedRecipe(recipe);
    setDisplayedRecipeId(null);
    setShowLogMealForm(false);
  }

  function toggleUseStockIngredients() {
    setUseStockIngredients((prev) => {
      const next = !prev;
      if (!next) setSelectedItems([]);
      return next;
    });
  }

  async function generateRecipe() {
    setStreaming(true);
    setDisplayedRecipe(null);
    setDisplayedRecipeId(null);

    try {
      const res = await fetch(`${API_URL}/recipes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          inventoryItemIds: useStockIngredients ? selectedItems : [],
          mealType,
          servings,
          ingredientsText: ingredientsPrompt.trim() || undefined,
          suggestionsText: useSuggestions ? suggestionsPrompt.trim() || undefined : undefined,
        }),
      });

      if (!res.body) return;

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let accumulated = '';
      let recipeId: string | null = null;

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
            if (parsed.delta) accumulated += parsed.delta;
            if (parsed.recipeId) recipeId = parsed.recipeId;
          } catch { /* ignore parse errors */ }
        }
      }

      try {
        const match = accumulated.match(/\{[\s\S]*\}/);
        if (match) setDisplayedRecipe(JSON.parse(match[0]) as Partial<Recipe>);
      } catch { /* ignore */ }
      setDisplayedRecipeId(recipeId);
      setShowLogMealForm(false);
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
              <select className="w-full px-4 py-3 border border-gray-200 rounded-xl" value={mealType} onChange={(e) => setMealType(e.target.value as MealType)}>
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

            <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-gray-800">Con ingredientes en stock</div>
                <p className="text-xs text-gray-500">Usar o no los items de tu inventario</p>
              </div>
              <input type="checkbox" checked={useStockIngredients} onChange={toggleUseStockIngredients} className="h-5 w-5 accent-brand-600" />
            </label>

            {useStockIngredients && inventory.length > 0 && (
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

            {useStockIngredients && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Ingredientes que querés incluir</label>
                <textarea
                  value={ingredientsPrompt}
                  onChange={(e) => setIngredientsPrompt(e.target.value)}
                  placeholder="Ej: mozzarella, tomate triturado, albahaca fresca"
                  className="w-full min-h-24 px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>
            )}

            <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-gray-800">Sugerencias</div>
                <p className="text-xs text-gray-500">Indicaciones de sabor o antojo para condicionar la receta</p>
              </div>
              <input type="checkbox" checked={useSuggestions} onChange={() => setUseSuggestions((prev) => !prev)} className="h-5 w-5 accent-brand-600" />
            </label>

            {useSuggestions && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Sugerencias para la IA</label>
                <textarea
                  value={suggestionsPrompt}
                  onChange={(e) => setSuggestionsPrompt(e.target.value)}
                  placeholder="Ej: Tengo ganas de algo con queso derretido y salsa de tomate"
                  className="w-full min-h-24 px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>
            )}

            <button onClick={generateRecipe} disabled={streaming} className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition disabled:opacity-60">
              {streaming ? 'Generando...' : '✨ Generar receta con IA'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col">
          <h2 className="font-semibold text-gray-900 mb-4">
            {displayedRecipe ? displayedRecipe.name ?? 'Receta' : 'Receta'}
          </h2>

          {/* Empty state */}
          {!displayedRecipe && !streaming && (
            <div className="text-center py-12 text-gray-400 flex-1 flex flex-col items-center justify-center">
              <div className="text-4xl mb-3">🍳</div>
              <p className="text-sm">Generá una receta o seleccioná una guardada</p>
            </div>
          )}

          {/* Spinner while generating */}
          {streaming && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
              <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Generando receta con IA...</p>
            </div>
          )}

          {/* Recipe card */}
          {!streaming && displayedRecipe && (
            <div className="space-y-5 overflow-y-auto max-h-[520px] pr-1">
              {/* Header */}
              <div>
                <h3 className="text-lg font-bold text-gray-900">{displayedRecipe.name}</h3>
                {displayedRecipe.description && (
                  <p className="text-sm text-gray-500 mt-1">{displayedRecipe.description}</p>
                )}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                {displayedRecipe.prepTimeMins !== undefined && (
                  <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-full">
                    ⏱ Prep {displayedRecipe.prepTimeMins} min
                  </span>
                )}
                {displayedRecipe.cookTimeMins !== undefined && (
                  <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-full">
                    🔥 Cocción {displayedRecipe.cookTimeMins} min
                  </span>
                )}
                {displayedRecipe.servings !== undefined && (
                  <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-full">
                    🍽 {displayedRecipe.servings} porciones
                  </span>
                )}
              </div>

              {/* Macros */}
              {(displayedRecipe.calories ?? displayedRecipe.proteinG ?? displayedRecipe.carbsG ?? displayedRecipe.fatG) && (
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Calorías', value: displayedRecipe.calories, unit: 'kcal', color: 'bg-orange-50 text-orange-700' },
                    { label: 'Proteínas', value: displayedRecipe.proteinG, unit: 'g', color: 'bg-green-50 text-green-700' },
                    { label: 'Carbos', value: displayedRecipe.carbsG, unit: 'g', color: 'bg-blue-50 text-blue-700' },
                    { label: 'Grasas', value: displayedRecipe.fatG, unit: 'g', color: 'bg-yellow-50 text-yellow-700' },
                  ].map(({ label, value, unit, color }) =>
                    value !== undefined ? (
                      <div key={label} className={`rounded-xl p-2 ${color}`}>
                        <div className="text-sm font-bold">{Math.round(value)}{unit === 'kcal' ? '' : unit}</div>
                        <div className="text-xs opacity-75">{label}</div>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              {/* Ingredients */}
              {displayedRecipe.ingredients && displayedRecipe.ingredients.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2">Ingredientes</h4>
                  <ul className="space-y-1">
                    {(displayedRecipe.ingredients as MealIngredient[]).map((ing, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="text-gray-700">{ing.name}</span>
                        <span className="text-gray-400 tabular-nums">{ing.quantity}{ing.unit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Steps */}
              {displayedRecipe.steps && displayedRecipe.steps.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2">Preparación</h4>
                  <ol className="space-y-2">
                    {(displayedRecipe.steps as string[]).map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-700">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Tags */}
              {displayedRecipe.tags && displayedRecipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(displayedRecipe.tags as string[]).map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Save button — only for freshly generated recipes */}
              {displayedRecipeId && (
                <button
                  onClick={() => saveMutation.mutate(displayedRecipeId)}
                  disabled={saveMutation.isPending}
                  className="w-full py-2.5 border-2 border-brand-600 text-brand-600 font-semibold rounded-xl hover:bg-brand-50 transition"
                >
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar receta'}
                </button>
              )}

              <button
                onClick={() => setShowLogMealForm((prev) => !prev)}
                className="w-full py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
              >
                {showLogMealForm ? 'Cancelar carga de meal' : 'Cargar esta receta como meal'}
              </button>

              {showLogMealForm && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-800">Crear meal desde receta</h4>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Fecha</label>
                    <input
                      type="date"
                      value={mealDate}
                      onChange={(e) => setMealDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Porciones</label>
                    <input
                      type="number"
                      min={1}
                      step={0.5}
                      value={mealPortions}
                      onChange={(e) => setMealPortions(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!displayedRecipe) return;
                      logMealMutation.mutate({
                        recipe: displayedRecipe,
                        mealType: mealType as MealType,
                        date: mealDate,
                        portions: mealPortions,
                      });
                    }}
                    disabled={logMealMutation.isPending || !mealDate}
                    className="w-full py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition disabled:opacity-60"
                  >
                    {logMealMutation.isPending ? 'Guardando meal...' : 'Confirmar meal'}
                  </button>
                </div>
              )}

              {mealLogSuccess && (
                <p className="text-sm text-green-600 font-medium">{mealLogSuccess}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {savedRecipes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recetas guardadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedRecipes.map((recipe) => {
              const isActive = displayedRecipe && 'id' in displayedRecipe && displayedRecipe.id === recipe.id;
              return (
                <div
                  key={recipe.id}
                  onClick={() => handleViewSavedRecipe(recipe)}
                  className={`bg-white rounded-2xl shadow-sm p-5 cursor-pointer transition ring-2 ${isActive ? 'ring-brand-500' : 'ring-transparent hover:ring-brand-200'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteRecipe(recipe.id, recipe.name); }}
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
