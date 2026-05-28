# Mi Semana — Usabilidad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fusionar "Generar Plan" y "Menú" en una página "Mi Semana" editable, reconvertir Recetas en biblioteca de favoritos, y agregar Mi Perfil para editar preferencias post-onboarding.

**Architecture:** Todos los cambios son de frontend (Next.js web). No se requieren cambios en el backend — los endpoints existentes cubren todo. Se crean componentes atómicos (`WeekDayTabs`, `DayMacroSummary`, `WeekMealCard`, `AddCustomMealModal`) y una nueva página `/mi-semana`. Las páginas `/generate-plan` y `/menu` quedan como redirects. La app mobile queda fuera del alcance de este plan.

**Tech Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · TanStack Query v5 · `apiFetch` / `apiStream` (lib/api-client) · `@nutriplan/shared` types

---

## File Map

| Acción | Archivo |
|--------|---------|
| Crear | `apps/web/src/lib/week-utils.ts` |
| Modificar | `apps/web/src/app/(app)/layout.tsx` |
| Crear | `apps/web/src/components/week-day-tabs.tsx` |
| Crear | `apps/web/src/components/day-macro-summary.tsx` |
| Crear | `apps/web/src/components/week-meal-card.tsx` |
| Crear | `apps/web/src/components/add-custom-meal-modal.tsx` |
| Crear | `apps/web/src/app/(app)/mi-semana/page.tsx` |
| Modificar | `apps/web/src/app/(app)/menu/page.tsx` |
| Modificar | `apps/web/src/app/(app)/generate-plan/page.tsx` |
| Modificar | `apps/web/src/app/(app)/recipes/page.tsx` |
| Crear | `apps/web/src/app/(app)/perfil/page.tsx` |
| Modificar | `apps/web/src/app/(app)/dashboard/page.tsx` |

---

## Task 1: Week date utilities

**Files:**
- Create: `apps/web/src/lib/week-utils.ts`

- [ ] **Step 1: Crear el archivo**

```typescript
// apps/web/src/lib/week-utils.ts

export const DAY_ABBREV_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

/** Returns Mon-Sun dates for the week containing `reference` (defaults to today). */
export function getWeekDates(reference: Date = new Date()): Date[] {
  const day = reference.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // offset to Monday
  const monday = new Date(reference);
  monday.setDate(reference.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** YYYY-MM-DD (local time) */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "Lunes 26 de mayo" */
export function formatDateLong(d: Date): string {
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Index 0-6 where 0=Monday */
export function weekdayIndex(d: Date): number {
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
}
```

- [ ] **Step 2: Verificar que el build pasa**

```bash
cd apps/web && pnpm tsc --noEmit
```

Esperado: sin errores de tipos.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/week-utils.ts
git commit -m "feat: add week date utilities"
```

---

## Task 2: Actualizar navegación del sidebar

**Files:**
- Modify: `apps/web/src/app/(app)/layout.tsx`

- [ ] **Step 1: Reemplazar `NAV_ITEMS`**

Abrir `apps/web/src/app/(app)/layout.tsx` y reemplazar el array `NAV_ITEMS` (líneas 9-17):

```typescript
const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Inicio',      icon: '🏡', desc: 'Tu resumen diario',       iconBg: 'bg-brand-100' },
  { href: '/mi-semana',     label: 'Mi Semana',   icon: '📅', desc: 'Tu plan semanal',         iconBg: 'bg-amber-100' },
  { href: '/shopping-list', label: 'Compras',     icon: '🛒', desc: 'Lista semanal',            iconBg: 'bg-teal-100' },
  { href: '/inventory',     label: 'Inventario',  icon: '🥫', desc: 'Lo que tenés',             iconBg: 'bg-lime-100' },
  { href: '/recipes',       label: 'Mis Recetas', icon: '🍳', desc: 'Tus recetas guardadas',    iconBg: 'bg-orange-100' },
  { href: '/perfil',        label: 'Mi Perfil',   icon: '⚙️', desc: 'Preferencias y objetivo', iconBg: 'bg-gray-100' },
  { href: '/progress',      label: 'Progreso',    icon: '📈', desc: 'Tu evolución',             iconBg: 'bg-purple-100' },
];
```

- [ ] **Step 2: Verificar en navegador**

Levantar la app con `pnpm dev` desde la raíz. Abrir `http://localhost:3000`. Verificar que el sidebar muestra los nuevos ítems y que falta "Generar plan".

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(app\)/layout.tsx
git commit -m "feat: update sidebar navigation for Mi Semana"
```

---

## Task 3: Componente WeekDayTabs

**Files:**
- Create: `apps/web/src/components/week-day-tabs.tsx`

- [ ] **Step 1: Crear el componente**

```typescript
// apps/web/src/components/week-day-tabs.tsx
'use client';

import { DAY_ABBREV_ES, toDateStr, weekdayIndex } from '@/lib/week-utils';

export interface DayTabInfo {
  date: Date;
  dateStr: string;
  calories?: number;
  hasPlan: boolean;
}

interface WeekDayTabsProps {
  days: DayTabInfo[];
  activeDate: string;
  onSelect: (dateStr: string) => void;
}

export function WeekDayTabs({ days, activeDate, onSelect }: WeekDayTabsProps) {
  const today = toDateStr(new Date());

  return (
    <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {days.map((day) => {
        const isActive = day.dateStr === activeDate;
        const isToday = day.dateStr === today;
        const abbrev = DAY_ABBREV_ES[weekdayIndex(day.date)];

        return (
          <button
            key={day.dateStr}
            onClick={() => onSelect(day.dateStr)}
            className="flex-1 min-w-[72px] px-2 py-3 text-center border-b-[3px] transition-colors focus:outline-none"
            style={{ borderBottomColor: isActive ? '#5C7A2C' : 'transparent' }}
          >
            <span
              className="block text-[11px] font-extrabold mb-0.5"
              style={{ color: isToday ? '#D4622A' : 'transparent', userSelect: 'none' }}
            >
              {isToday ? 'HOY' : '·'}
            </span>
            <span
              className="block text-[13px] font-extrabold"
              style={{
                color: isActive ? '#2C2416' : day.hasPlan ? '#7A6E63' : '#C8BAA8',
              }}
            >
              {abbrev} {day.date.getDate()}
            </span>
            <span
              className="block text-[11px] font-semibold mt-0.5"
              style={{ color: isActive && day.hasPlan ? '#5C7A2C' : '#C8BAA8' }}
            >
              {day.hasPlan && day.calories
                ? `${day.calories.toLocaleString('es-AR')} kcal`
                : '—'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && pnpm tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/week-day-tabs.tsx
git commit -m "feat: add WeekDayTabs component"
```

---

## Task 4: Componente DayMacroSummary

**Files:**
- Create: `apps/web/src/components/day-macro-summary.tsx`

- [ ] **Step 1: Crear el componente**

```typescript
// apps/web/src/components/day-macro-summary.tsx
'use client';

interface Macros {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface DayMacroSummaryProps {
  consumed: Macros;
  targets: Macros;
  dateLabel: string;
  onAddCustomMeal: () => void;
}

export function DayMacroSummary({ consumed, targets, dateLabel, onAddCustomMeal }: DayMacroSummaryProps) {
  const calPct = targets.calories > 0
    ? Math.min(100, Math.round((consumed.calories / targets.calories) * 100))
    : 0;
  const remaining = Math.max(0, targets.calories - consumed.calories);

  return (
    <div
      className="bg-white rounded-[20px] p-[18px_22px] mb-5"
      style={{ border: '1px solid #EDE3D2', boxShadow: '0 2px 8px rgba(44,36,22,0.04)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: '#9A8B7A' }}>
          Calorías de hoy
        </span>
        <span className="text-[12px] font-bold" style={{ color: '#7A6E63' }}>{dateLabel}</span>
      </div>

      {/* Main calorie row */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-[5px]">
          <span className="text-[30px] font-black leading-none" style={{ color: '#2C2416' }}>
            {Math.round(consumed.calories).toLocaleString('es-AR')}
          </span>
          <span className="text-[16px] font-semibold" style={{ color: '#D8CCBC' }}>/</span>
          <span className="text-[16px] font-bold" style={{ color: '#B0A090' }}>
            {Math.round(targets.calories).toLocaleString('es-AR')}
          </span>
          <span className="text-[12px] font-bold" style={{ color: '#B0A090' }}>kcal</span>
        </div>
        <div className="text-right">
          <div className="text-[15px] font-extrabold" style={{ color: '#5C7A2C' }}>
            {remaining.toLocaleString('es-AR')} kcal
          </div>
          <div className="text-[11px] font-semibold" style={{ color: '#B0A090' }}>disponibles</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[6px] rounded-full overflow-hidden mb-4" style={{ background: '#F0EAE0' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${calPct}%`,
            background: calPct >= 100 ? '#DC2626' : 'linear-gradient(90deg, #5C7A2C, #8AAD4A)',
          }}
        />
      </div>

      {/* Macro grid */}
      <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: '1px solid #F0EAE0' }}>
        {[
          { label: 'Proteína',       c: consumed.proteinG, t: targets.proteinG },
          { label: 'Carbohidratos',  c: consumed.carbsG,   t: targets.carbsG },
          { label: 'Grasas',         c: consumed.fatG,     t: targets.fatG },
        ].map(({ label, c, t }) => (
          <div key={label} className="text-center">
            <div className="flex items-baseline justify-center gap-[2px]">
              <span className="text-[14px] font-black" style={{ color: '#2C2416' }}>{Math.round(c)}</span>
              <span className="text-[11px] font-semibold" style={{ color: '#D8CCBC' }}>/</span>
              <span className="text-[11px] font-bold" style={{ color: '#B0A090' }}>{Math.round(t)}</span>
              <span className="text-[11px] font-bold" style={{ color: '#B0A090' }}>g</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.4px] mt-1" style={{ color: '#9A8B7A' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Add custom meal */}
      <button
        onClick={onAddCustomMeal}
        className="w-full mt-4 py-3 rounded-[10px] text-[13px] font-bold transition-colors"
        style={{
          border: '1.5px dashed #C8B49A',
          color: '#9A8B7A',
          background: 'transparent',
        }}
      >
        ＋ Agregar comida propia
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/day-macro-summary.tsx
git commit -m "feat: add DayMacroSummary component"
```

---

## Task 5: Componente WeekMealCard

**Files:**
- Create: `apps/web/src/components/week-meal-card.tsx`

- [ ] **Step 1: Crear el componente**

```typescript
// apps/web/src/components/week-meal-card.tsx
'use client';

import type { Meal } from '@nutriplan/shared';

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST:       'Desayuno',
  MORNING_SNACK:   'Merienda mañana',
  LUNCH:           'Almuerzo',
  AFTERNOON_SNACK: 'Merienda tarde',
  DINNER:          'Cena',
};

const DOT_COLORS: Record<string, string> = {
  BREAKFAST:       '#F5C542',
  MORNING_SNACK:   '#A78BFA',
  LUNCH:           '#5C7A2C',
  AFTERNOON_SNACK: '#A78BFA',
  DINNER:          '#6B80C4',
};

export type MealStatus = 'logged' | 'next' | 'future';

// Allowed portion multipliers
const PORTION_STEPS = [0.5, 1, 1.5, 2] as const;

interface WeekMealCardProps {
  meal: Meal;
  status: MealStatus;
  portion: number;
  swapping: boolean;
  onSwap: () => void;
  onPortionChange: (direction: 1 | -1) => void;
  onViewRecipe?: () => void;
}

export function WeekMealCard({
  meal,
  status,
  portion,
  swapping,
  onSwap,
  onPortionChange,
  onViewRecipe,
}: WeekMealCardProps) {
  const adjustedCal  = Math.round(meal.calories  * portion);
  const adjustedProt = Math.round(meal.proteinG  * portion);
  const adjustedCarb = Math.round(meal.carbsG    * portion);
  const adjustedFat  = Math.round(meal.fatG      * portion);

  const dotColor = DOT_COLORS[meal.mealType] ?? '#9A8B7A';
  const label    = MEAL_TYPE_LABELS[meal.mealType] ?? meal.mealType;

  const portionIdx = PORTION_STEPS.indexOf(portion as typeof PORTION_STEPS[number]);
  const canDecrease = portionIdx > 0;
  const canIncrease = portionIdx < PORTION_STEPS.length - 1;

  const cardStyle: React.CSSProperties = {
    border:      status === 'next'   ? '2px solid #5C7A2C'
               : status === 'logged' ? '1.5px solid #C0E4A8'
               :                      '1.5px solid #EDE3D2',
    background:  status === 'logged' ? '#F5FBF0' : '#FFFFFF',
    boxShadow:   status === 'next'
               ? '0 4px 18px rgba(92,122,44,0.13)'
               : '0 1px 4px rgba(44,36,22,0.04)',
    opacity:     status === 'future' ? 0.7 : 1,
  };

  return (
    <div className="rounded-[16px] p-[15px_18px] transition-all" style={cardStyle}>
      <div className="flex items-start justify-between gap-3">

        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-[5px]">
            <div className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: dotColor }} />
            <span
              className="text-[11px] font-extrabold uppercase tracking-[0.5px]"
              style={{ color: status === 'next' ? '#5C7A2C' : '#9A8B7A' }}
            >
              {label}{status === 'next' ? ' · próxima comida' : ''}
            </span>
          </div>

          <div className="text-[14px] font-extrabold leading-[1.35] mb-2" style={{ color: '#2C2416' }}>
            {swapping ? '⏳ Buscando alternativa...' : meal.name}
          </div>

          <div className="flex flex-wrap gap-[6px]">
            {[
              { icon: '🔥', value: adjustedCal,  unit: 'kcal' },
              { icon: '💪', value: adjustedProt, unit: 'g proteína' },
              { icon: '🌾', value: adjustedCarb, unit: 'g carbos' },
              { icon: '🥑', value: adjustedFat,  unit: 'g grasas' },
            ].map(({ icon, value, unit }) => (
              <span
                key={unit}
                className="inline-flex items-center gap-[3px] rounded-full px-[9px] py-[3px] text-[11px] font-bold"
                style={{ background: '#F7F1E8', border: '1px solid #EDE3D2', color: '#7A6E63' }}
              >
                {icon} <span style={{ color: '#2C2416', fontWeight: 900 }}>{value}</span> {unit}
              </span>
            ))}
          </div>
        </div>

        {/* Right: actions */}
        {status === 'logged' ? (
          <span
            className="text-[11px] font-bold px-[10px] py-[4px] rounded-full shrink-0"
            style={{ background: '#DCFCE7', color: '#16A34A' }}
          >
            ✓ Listo
          </span>
        ) : (
          <div className="flex flex-col gap-[6px] shrink-0">
            <button
              onClick={onSwap}
              disabled={swapping}
              className="text-[11px] font-bold px-3 py-[6px] rounded-[9px] border disabled:opacity-40"
              style={{ background: '#FDF0E6', borderColor: '#F5C9A3', color: '#B04E1F' }}
            >
              🔄 Cambiar
            </button>
            {onViewRecipe && (
              <button
                onClick={onViewRecipe}
                className="text-[11px] font-bold px-3 py-[6px] rounded-[9px] border"
                style={{ background: '#F7F1E8', borderColor: '#E0D4C0', color: '#7A6E63' }}
              >
                📋 Receta
              </button>
            )}
          </div>
        )}
      </div>

      {/* Portion controls — only for "next" meal */}
      {status === 'next' && (
        <div
          className="flex items-center gap-2 mt-3 pt-3"
          style={{ borderTop: '1px dashed #EDE3D2' }}
        >
          <span className="text-[12px] font-semibold" style={{ color: '#9A8B7A' }}>Porción</span>
          <button
            onClick={() => onPortionChange(-1)}
            disabled={!canDecrease}
            className="w-[26px] h-[26px] rounded-[7px] text-[15px] font-extrabold flex items-center justify-center border-none disabled:opacity-30"
            style={{ background: '#F0EAE0', color: '#5C7A2C' }}
          >−</button>
          <span className="text-[15px] font-black min-w-[32px] text-center" style={{ color: '#2C2416' }}>
            {portion}×
          </span>
          <button
            onClick={() => onPortionChange(1)}
            disabled={!canIncrease}
            className="w-[26px] h-[26px] rounded-[7px] text-[15px] font-extrabold flex items-center justify-center border-none disabled:opacity-30"
            style={{ background: '#F0EAE0', color: '#5C7A2C' }}
          >+</button>
          <span className="text-[11px] font-semibold" style={{ color: '#B0A090' }}>= {adjustedCal} kcal</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/week-meal-card.tsx
git commit -m "feat: add WeekMealCard component"
```

---

## Task 6: Componente AddCustomMealModal

**Files:**
- Create: `apps/web/src/components/add-custom-meal-modal.tsx`

- [ ] **Step 1: Crear el componente**

```typescript
// apps/web/src/components/add-custom-meal-modal.tsx
'use client';

import { useState } from 'react';
import type { MealType } from '@nutriplan/shared';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST:       'Desayuno',
  MORNING_SNACK:   'Merienda mañana',
  LUNCH:           'Almuerzo',
  AFTERNOON_SNACK: 'Merienda tarde',
  DINNER:          'Cena',
};

export interface CustomMealInput {
  name: string;
  mealType: MealType;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface AddCustomMealModalProps {
  open: boolean;
  onSubmit: (input: CustomMealInput) => void;
  onClose: () => void;
  loading?: boolean;
}

const DEFAULT_FORM: CustomMealInput = {
  name: '',
  mealType: 'LUNCH',
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
};

export function AddCustomMealModal({ open, onSubmit, onClose, loading }: AddCustomMealModalProps) {
  const [form, setForm] = useState<CustomMealInput>(DEFAULT_FORM);

  if (!open) return null;

  function handleClose() {
    setForm(DEFAULT_FORM);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.calories <= 0) return;
    onSubmit(form);
    setForm(DEFAULT_FORM);
  }

  const numFields: { key: keyof CustomMealInput; label: string; unit: string }[] = [
    { key: 'calories', label: 'Calorías',      unit: 'kcal' },
    { key: 'proteinG', label: 'Proteína',       unit: 'g' },
    { key: 'carbsG',   label: 'Carbohidratos',  unit: 'g' },
    { key: 'fatG',     label: 'Grasas',         unit: 'g' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md bg-white rounded-[20px] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-black" style={{ color: '#2C2416' }}>Agregar comida propia</h2>
          <button onClick={handleClose} className="text-2xl leading-none" style={{ color: '#9A8B7A' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[12px] font-bold uppercase tracking-[0.4px] block mb-1" style={{ color: '#9A8B7A' }}>
              Nombre
            </label>
            <input
              className="w-full border rounded-[10px] px-4 py-3 text-[14px] font-semibold outline-none"
              style={{ borderColor: '#EDE3D2', color: '#2C2416' }}
              placeholder="Ej: Empanadas de carne"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="text-[12px] font-bold uppercase tracking-[0.4px] block mb-1" style={{ color: '#9A8B7A' }}>
              Tipo de comida
            </label>
            <select
              className="w-full border rounded-[10px] px-4 py-3 text-[14px] font-semibold"
              style={{ borderColor: '#EDE3D2', color: '#2C2416' }}
              value={form.mealType}
              onChange={e => setForm(f => ({ ...f, mealType: e.target.value as MealType }))}
            >
              {(Object.entries(MEAL_TYPE_LABELS) as [MealType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {numFields.map(({ key, label, unit }) => (
              <div key={key}>
                <label className="text-[12px] font-bold uppercase tracking-[0.4px] block mb-1" style={{ color: '#9A8B7A' }}>
                  {label} <span style={{ color: '#B0A090', textTransform: 'none' }}>({unit})</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full border rounded-[10px] px-4 py-3 text-[14px] font-semibold"
                  style={{ borderColor: '#EDE3D2', color: '#2C2416' }}
                  value={(form[key] as number) || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 rounded-[12px] border-2 font-bold text-[14px]"
              style={{ borderColor: '#EDE3D2', color: '#7A6E63' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-[12px] font-bold text-[14px] text-white disabled:opacity-60"
              style={{ background: '#5C7A2C' }}
            >
              {loading ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/add-custom-meal-modal.tsx
git commit -m "feat: add AddCustomMealModal component"
```

---

## Task 7: Página Mi Semana

**Files:**
- Create: `apps/web/src/app/(app)/mi-semana/page.tsx`

- [ ] **Step 1: Crear la carpeta y el archivo**

```bash
mkdir -p apps/web/src/app/\(app\)/mi-semana
```

- [ ] **Step 2: Escribir la página**

```typescript
// apps/web/src/app/(app)/mi-semana/page.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiFetch, apiStream, ApiError } from '@/lib/api-client';
import { getWeekDates, toDateStr, formatDateLong } from '@/lib/week-utils';
import { WeekDayTabs, type DayTabInfo } from '@/components/week-day-tabs';
import { DayMacroSummary } from '@/components/day-macro-summary';
import { WeekMealCard, type MealStatus } from '@/components/week-meal-card';
import { AddCustomMealModal, type CustomMealInput } from '@/components/add-custom-meal-modal';
import type { NutritionPlan, NutritionTargets, Meal } from '@nutriplan/shared';

const MEAL_TYPE_ORDER = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER'];
const PORTION_STEPS = [0.5, 1, 1.5, 2] as const;

function sortMeals(meals: Meal[]): Meal[] {
  return [...meals].sort(
    (a, b) => MEAL_TYPE_ORDER.indexOf(a.mealType) - MEAL_TYPE_ORDER.indexOf(b.mealType),
  );
}

export default function MiSemanaPage() {
  const qc = useQueryClient();
  const today = toDateStr(new Date());
  const weekDates = useMemo(() => getWeekDates(), []);

  const [activeDate, setActiveDate]           = useState(today);
  const [portions, setPortions]               = useState<Record<string, number>>({});
  const [swappingMealId, setSwappingMealId]   = useState<string | null>(null);
  const [generating, setGenerating]           = useState(false);
  const [genProgress, setGenProgress]         = useState(0);
  const [genStatus, setGenStatus]             = useState('');
  const [addMealOpen, setAddMealOpen]         = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  // Fetch nutrition targets (calories, protein, carbs, fat goals)
  const { data: targets } = useQuery<NutritionTargets>({
    queryKey: ['nutrition-targets'],
    queryFn: () => apiFetch('/nutrition/targets'),
  });

  // Fetch plan for each of the 7 days in parallel
  const dayPlans = useQueries({
    queries: weekDates.map(date => {
      const dateStr = toDateStr(date);
      return {
        queryKey: ['diet-by-date', dateStr],
        queryFn: () => apiFetch(`/diet/by-date/${dateStr}`).catch(() => null) as Promise<NutritionPlan | null>,
        retry: false,
      };
    }),
  });

  // Fetch meal logs for the active day (shows what's already been consumed)
  const { data: dailySummary } = useQuery({
    queryKey: ['meal-logs', activeDate],
    queryFn: () => apiFetch(`/meal-logs?date=${activeDate}`),
  });

  // Build tab info for WeekDayTabs
  const dayTabInfos: DayTabInfo[] = useMemo(() =>
    weekDates.map((date, i) => {
      const plan = dayPlans[i]?.data as NutritionPlan | null | undefined;
      const totalCal = plan?.meals?.reduce((sum, m) => sum + m.calories, 0);
      return {
        date,
        dateStr: toDateStr(date),
        calories: totalCal,
        hasPlan: !!plan?.meals?.length,
      };
    }),
    [weekDates, dayPlans],
  );

  // Active day's plan
  const activeDayIdx = weekDates.findIndex(d => toDateStr(d) === activeDate);
  const activePlan = dayPlans[activeDayIdx]?.data as NutritionPlan | null | undefined;
  const activeMeals = useMemo(() => sortMeals(activePlan?.meals ?? []), [activePlan]);

  // Consumed macros for active day
  const consumed = (dailySummary as { totals?: { calories: number; proteinG: number; carbsG: number; fatG: number } })?.totals
    ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

  // Which meals are already logged
  const loggedMealTypes = useMemo(() => {
    const logs = (dailySummary as { logs?: { mealType: string }[] })?.logs ?? [];
    return new Set(logs.map((l: { mealType: string }) => l.mealType));
  }, [dailySummary]);

  function getMealStatus(meal: Meal): MealStatus {
    if (loggedMealTypes.has(meal.mealType)) return 'logged';
    // First unlogged meal of the active day = "next"
    const firstUnlogged = activeMeals.find(m => !loggedMealTypes.has(m.mealType));
    if (firstUnlogged?.id === meal.id) return 'next';
    return 'future';
  }

  function getPortion(mealId: string): number {
    return portions[mealId] ?? 1;
  }

  function handlePortionChange(mealId: string, direction: 1 | -1) {
    const current = getPortion(mealId);
    const idx = PORTION_STEPS.indexOf(current as typeof PORTION_STEPS[number]);
    const nextIdx = Math.max(0, Math.min(PORTION_STEPS.length - 1, idx + direction));
    setPortions(prev => ({ ...prev, [mealId]: PORTION_STEPS[nextIdx] }));
  }

  // Swap a meal via SSE
  async function handleSwap(mealId: string) {
    setSwappingMealId(mealId);
    setError(null);
    try {
      await apiStream(
        `/diet/meal/${mealId}/swap/stream`,
        { method: 'POST' },
        (event) => {
          if (event.type === 'done') {
            void qc.invalidateQueries({ queryKey: ['diet-by-date', activeDate] });
            void qc.invalidateQueries({ queryKey: ['diet-current'] });
          }
        },
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSwappingMealId(null);
    }
  }

  // Generate full week via SSE
  async function handleGenerateWeek() {
    setGenerating(true);
    setGenProgress(0);
    setGenStatus('Iniciando planificación semanal...');
    setError(null);
    try {
      await apiStream('/diet/generate/week/stream', { method: 'POST', body: '{}' }, (event) => {
        if (event.type === 'status') {
          setGenStatus(event.message as string);
          const pct = Math.round(((event.current as number) / (event.total as number)) * 100);
          if (!isNaN(pct)) setGenProgress(pct);
        } else if (event.type === 'day-done') {
          void qc.invalidateQueries({ queryKey: ['diet-by-date', event.date as string] });
        } else if (event.type === 'done') {
          setGenProgress(100);
          void qc.invalidateQueries({ queryKey: ['diet-current'] });
        }
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  // Add custom meal via POST /meal-logs
  const addCustomMutation = useMutation({
    mutationFn: (input: CustomMealInput) =>
      apiFetch('/meal-logs', {
        method: 'POST',
        body: JSON.stringify({
          date: activeDate,
          mealType: input.mealType,
          name: input.name,
          calories: input.calories,
          proteinG: input.proteinG,
          carbsG: input.carbsG,
          fatG: input.fatG,
          quantity: 1,
          unit: 'porcion',
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['meal-logs', activeDate] });
      setAddMealOpen(false);
    },
    onError: (err) => {
      setError((err as Error).message);
    },
  });

  const activeDate_d = weekDates[activeDayIdx] ?? new Date();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="bg-white rounded-t-[20px] px-6 pt-5 pb-0" style={{ border: '1px solid #EDE3D2', borderBottom: 'none' }}>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[20px] font-black" style={{ color: '#2C2416' }}>Mi Semana</h1>
          <button
            onClick={() => void handleGenerateWeek()}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-white text-[13px] font-extrabold disabled:opacity-60"
            style={{ background: '#5C7A2C', boxShadow: '0 4px 12px rgba(92,122,44,0.25)' }}
          >
            {generating ? `${genProgress}%` : '🌱 Generar semana'}
          </button>
        </div>

        {/* Generation progress bar */}
        {generating && (
          <div className="mb-3">
            <div className="text-[12px] font-semibold mb-1" style={{ color: '#5C7A2C' }}>{genStatus}</div>
            <div className="h-[5px] rounded-full overflow-hidden" style={{ background: '#F0EAE0' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${genProgress}%`, background: '#5C7A2C' }}
              />
            </div>
          </div>
        )}

        {/* Day tabs */}
        <WeekDayTabs
          days={dayTabInfos}
          activeDate={activeDate}
          onSelect={setActiveDate}
        />
      </div>

      {/* Content */}
      <div
        className="rounded-b-[20px] p-5"
        style={{ background: '#F7F1E8', border: '1px solid #EDE3D2', borderTop: 'none' }}
      >
        {error && (
          <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
            {error}
          </div>
        )}

        {/* Macro summary — only show if there are targets */}
        {targets && (
          <DayMacroSummary
            consumed={consumed}
            targets={targets}
            dateLabel={formatDateLong(activeDate_d)}
            onAddCustomMeal={() => setAddMealOpen(true)}
          />
        )}

        {/* Meal list */}
        {activeMeals.length > 0 ? (
          <div className="flex flex-col gap-[10px]">
            {activeMeals.map(meal => (
              <WeekMealCard
                key={meal.id}
                meal={meal}
                status={getMealStatus(meal)}
                portion={getPortion(meal.id)}
                swapping={swappingMealId === meal.id}
                onSwap={() => void handleSwap(meal.id)}
                onPortionChange={(dir) => handlePortionChange(meal.id, dir)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🥗</div>
            <p className="text-[14px] font-bold mb-1" style={{ color: '#6B5A47' }}>
              Sin plan para este día
            </p>
            <p className="text-[12px]" style={{ color: '#9A8B7A' }}>
              Usá "Generar semana" para crear el plan completo.
            </p>
          </div>
        )}
      </div>

      {/* Add custom meal modal */}
      <AddCustomMealModal
        open={addMealOpen}
        onSubmit={(input) => addCustomMutation.mutate(input)}
        onClose={() => setAddMealOpen(false)}
        loading={addCustomMutation.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verificar tipos**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 4: Verificar en navegador**

Navegar a `http://localhost:3000/mi-semana`. Verificar:
- Tabs de los 7 días visibles, "HOY" destacado en naranja
- Si hay un plan existente, las comidas aparecen con sus macros en pills
- El botón "Generar semana" dispara el streaming (verificar en Network tab que llama a `/diet/generate/week/stream`)
- "Agregar comida propia" abre el modal y al guardar actualiza el resumen de macros

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(app\)/mi-semana/page.tsx
git commit -m "feat: add Mi Semana page"
```

---

## Task 8: Redirigir rutas antiguas

**Files:**
- Modify: `apps/web/src/app/(app)/menu/page.tsx`
- Modify: `apps/web/src/app/(app)/generate-plan/page.tsx`

- [ ] **Step 1: Reemplazar `/menu/page.tsx` con un redirect**

Reemplazar todo el contenido de `apps/web/src/app/(app)/menu/page.tsx` con:

```typescript
// apps/web/src/app/(app)/menu/page.tsx
import { redirect } from 'next/navigation';

export default function MenuPage() {
  redirect('/mi-semana');
}
```

- [ ] **Step 2: Reemplazar `/generate-plan/page.tsx` con un redirect**

Reemplazar todo el contenido de `apps/web/src/app/(app)/generate-plan/page.tsx` con:

```typescript
// apps/web/src/app/(app)/generate-plan/page.tsx
import { redirect } from 'next/navigation';

export default function GeneratePlanPage() {
  redirect('/mi-semana');
}
```

- [ ] **Step 3: Verificar redirects**

Navegar a `http://localhost:3000/menu` → debe redirigir a `/mi-semana`.
Navegar a `http://localhost:3000/generate-plan` → debe redirigir a `/mi-semana`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(app\)/menu/page.tsx apps/web/src/app/\(app\)/generate-plan/page.tsx
git commit -m "feat: redirect /menu and /generate-plan to /mi-semana"
```

---

## Task 9: Mis Recetas — biblioteca de favoritos

**Files:**
- Modify: `apps/web/src/app/(app)/recipes/page.tsx`

- [ ] **Step 1: Reemplazar el archivo completo**

Reemplazar todo el contenido de `apps/web/src/app/(app)/recipes/page.tsx`:

```typescript
// apps/web/src/app/(app)/recipes/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { Recipe, MealType } from '@nutriplan/shared';

const FILTER_OPTIONS: { label: string; value: MealType | 'ALL' }[] = [
  { label: 'Todas',           value: 'ALL' },
  { label: 'Desayuno',        value: 'BREAKFAST' },
  { label: 'Almuerzo',        value: 'LUNCH' },
  { label: 'Merienda',        value: 'MORNING_SNACK' },
  { label: 'Cena',            value: 'DINNER' },
];

const MEAL_EMOJI: Record<string, string> = {
  BREAKFAST: '🌅', MORNING_SNACK: '🍎', LUNCH: '🥗',
  AFTERNOON_SNACK: '🧃', DINNER: '🍽️',
};

export default function MisRecetasPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<MealType | 'ALL'>('ALL');
  const [search, setSearch]  = useState('');

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
    const matchesFilter = filter === 'ALL' || r.mealType === filter;
    const matchesSearch = !search.trim() ||
      r.name.toLowerCase().includes(search.toLowerCase());
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
              <div className="text-3xl mb-3">{MEAL_EMOJI[recipe.mealType ?? ''] ?? '🍽️'}</div>
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
                {recipe.preparationSteps?.length ? (
                  <details className="flex-1">
                    <summary
                      className="text-[12px] font-bold cursor-pointer px-3 py-2 rounded-[9px] text-center"
                      style={{ background: '#EEF5E2', color: '#4A6C1A', listStyle: 'none' }}
                    >
                      Ver preparación
                    </summary>
                    <ol className="mt-2 space-y-1 text-[12px]" style={{ color: '#6B5A47' }}>
                      {recipe.preparationSteps.map((step, i) => (
                        <li key={i}>{i + 1}. {step}</li>
                      ))}
                    </ol>
                  </details>
                ) : null}
                <button
                  onClick={() => deleteMutation.mutate(recipe.id)}
                  disabled={deleteMutation.isPending}
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
```

- [ ] **Step 2: Verificar en navegador**

Navegar a `http://localhost:3000/recipes`. Verificar:
- Muestra las recetas guardadas en formato grid.
- El filtro por tipo de comida funciona.
- No aparece ningún formulario de generación de recetas.
- El estado vacío muestra el mensaje correcto.

- [ ] **Step 3: Verificar tipos**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(app\)/recipes/page.tsx
git commit -m "feat: convert recipes page to saved favorites library"
```

---

## Task 10: Mi Perfil — preferencias editables

**Files:**
- Create: `apps/web/src/app/(app)/perfil/page.tsx`

- [ ] **Step 1: Crear la carpeta y el archivo**

```bash
mkdir -p apps/web/src/app/\(app\)/perfil
```

- [ ] **Step 2: Escribir la página**

```typescript
// apps/web/src/app/(app)/perfil/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { PreferenceChipGrid } from '@/components/preference-chip-grid';
import {
  COMMON_ALLERGIES,
  COMMON_CUISINES,
  COMMON_DISLIKED_FOODS,
  chipLabels,
} from '@/lib/food-preference-options';
import type { Sex, ActivityLevel, NutritionGoal, DietaryType, NutritionTargets } from '@nutriplan/shared';
import { ACTIVITY_LABELS, GOAL_LABELS } from '@nutriplan/shared';

interface UserProfile {
  firstName: string;
  birthDate: string;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
}

interface UserPreferences {
  goal: NutritionGoal;
  dietaryType: DietaryType;
  mealsPerDay: number;
  allergies: string[];
  dislikedFoods: string[];
  preferredCuisines: string[];
}

export default function MiPerfilPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const { data: profileData, isLoading: loadingProfile } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: () => apiFetch('/users/me/profile'),
  });

  const { data: prefsData, isLoading: loadingPrefs } = useQuery<UserPreferences>({
    queryKey: ['user-preferences'],
    queryFn: () => apiFetch('/users/me/preferences'),
  });

  const { data: targets } = useQuery<NutritionTargets>({
    queryKey: ['nutrition-targets'],
    queryFn: () => apiFetch('/nutrition/targets'),
  });

  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});
  const [prefsForm, setPrefsForm]     = useState<Partial<UserPreferences>>({});
  const [profileSaved, setProfileSaved] = useState(false);
  const [prefsSaved, setPrefsSaved]     = useState(false);

  // Merged values: form overrides fetched data
  const profile: UserProfile = {
    firstName:     profileForm.firstName     ?? profileData?.firstName     ?? '',
    birthDate:     profileForm.birthDate     ?? profileData?.birthDate     ?? '',
    sex:           profileForm.sex           ?? profileData?.sex           ?? 'MALE',
    heightCm:      profileForm.heightCm      ?? profileData?.heightCm      ?? 170,
    weightKg:      profileForm.weightKg      ?? profileData?.weightKg      ?? 70,
    activityLevel: profileForm.activityLevel ?? profileData?.activityLevel ?? 'MODERATELY_ACTIVE',
  };

  const prefs: UserPreferences = {
    goal:              prefsForm.goal              ?? prefsData?.goal              ?? 'MAINTAIN',
    dietaryType:       prefsForm.dietaryType       ?? prefsData?.dietaryType       ?? 'OMNIVORE',
    mealsPerDay:       prefsForm.mealsPerDay       ?? prefsData?.mealsPerDay       ?? 4,
    allergies:         prefsForm.allergies         ?? prefsData?.allergies         ?? [],
    dislikedFoods:     prefsForm.dislikedFoods     ?? prefsData?.dislikedFoods     ?? [],
    preferredCuisines: prefsForm.preferredCuisines ?? prefsData?.preferredCuisines ?? [],
  };

  const saveProfileMutation = useMutation({
    mutationFn: () =>
      apiFetch('/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...profile, birthDate: new Date(profile.birthDate).toISOString() }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-profile'] });
      void qc.invalidateQueries({ queryKey: ['nutrition-targets'] });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    },
  });

  const savePrefsMutation = useMutation({
    mutationFn: () =>
      apiFetch('/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          goal:              prefs.goal,
          dietaryType:       prefs.dietaryType,
          mealsPerDay:       prefs.mealsPerDay,
          allergies:         prefs.allergies,
          dislikedFoods:     prefs.dislikedFoods,
          preferredCuisines: prefs.preferredCuisines,
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-preferences'] });
      void qc.invalidateQueries({ queryKey: ['nutrition-targets'] });
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 3000);
    },
  });

  function toggleAllergy(a: string) {
    const next = prefs.allergies.includes(a)
      ? prefs.allergies.filter(x => x !== a)
      : [...prefs.allergies, a];
    setPrefsForm(f => ({ ...f, allergies: next }));
  }

  function toggleDisliked(a: string) {
    const next = prefs.dislikedFoods.includes(a)
      ? prefs.dislikedFoods.filter(x => x !== a)
      : [...prefs.dislikedFoods, a];
    setPrefsForm(f => ({ ...f, dislikedFoods: next }));
  }

  function toggleCuisine(a: string) {
    const next = prefs.preferredCuisines.includes(a)
      ? prefs.preferredCuisines.filter(x => x !== a)
      : [...prefs.preferredCuisines, a];
    setPrefsForm(f => ({ ...f, preferredCuisines: next }));
  }

  if (loadingProfile || loadingPrefs) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const sectionClass = "bg-white rounded-[16px] p-5 mb-4";
  const sectionStyle = { border: '1px solid #EDE3D2', boxShadow: '0 1px 4px rgba(44,36,22,0.04)' };
  const labelClass   = "text-[12px] font-bold uppercase tracking-[0.4px] block mb-1";
  const labelStyle   = { color: '#9A8B7A' };
  const inputClass   = "w-full border rounded-[10px] px-4 py-3 text-[14px] font-semibold outline-none";
  const inputStyle   = { borderColor: '#EDE3D2', color: '#2C2416' };
  const saveBtn      = "w-full py-3 rounded-[12px] font-bold text-[14px] text-white mt-4 disabled:opacity-60";
  const saveBtnStyle = { background: '#5C7A2C' };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-black mb-1" style={{ color: '#2C2416' }}>Mi Perfil</h1>
        <p className="text-[13px]" style={{ color: '#9A8B7A' }}>
          Tus cambios se aplican la próxima vez que generes el plan.
        </p>
      </div>

      {/* Targets summary */}
      {targets && (
        <div className="rounded-[16px] p-4 mb-5 flex gap-4" style={{ background: '#EEF5E2', border: '1px solid #C8DFA0' }}>
          <div className="text-center flex-1">
            <div className="text-[18px] font-black" style={{ color: '#2C2416' }}>{targets.calories}</div>
            <div className="text-[10px] font-bold uppercase" style={{ color: '#5C7A2C' }}>kcal/día</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-[18px] font-black" style={{ color: '#2C2416' }}>{targets.bmr}</div>
            <div className="text-[10px] font-bold uppercase" style={{ color: '#5C7A2C' }}>TMB</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-[18px] font-black" style={{ color: '#2C2416' }}>{targets.tdee}</div>
            <div className="text-[10px] font-bold uppercase" style={{ color: '#5C7A2C' }}>TDEE</div>
          </div>
        </div>
      )}

      {/* ── Section 1: Personal data ── */}
      <div className={sectionClass} style={sectionStyle}>
        <h2 className="text-[15px] font-extrabold mb-4" style={{ color: '#2C2416' }}>Datos personales</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass} style={labelStyle}>Nombre</label>
            <input className={inputClass} style={inputStyle}
              value={profile.firstName}
              onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Sexo</label>
            <select className={inputClass} style={inputStyle}
              value={profile.sex}
              onChange={e => setProfileForm(f => ({ ...f, sex: e.target.value as Sex }))}>
              <option value="MALE">Masculino</option>
              <option value="FEMALE">Femenino</option>
            </select>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Fecha de nacimiento</label>
            <input type="date" className={inputClass} style={inputStyle}
              value={profile.birthDate?.split('T')[0] ?? ''}
              onChange={e => setProfileForm(f => ({ ...f, birthDate: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Altura (cm)</label>
            <input type="number" className={inputClass} style={inputStyle}
              value={profile.heightCm}
              onChange={e => setProfileForm(f => ({ ...f, heightCm: Number(e.target.value) }))} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Peso (kg)</label>
            <input type="number" className={inputClass} style={inputStyle}
              value={profile.weightKg}
              onChange={e => setProfileForm(f => ({ ...f, weightKg: Number(e.target.value) }))} />
          </div>
          <div className="col-span-2">
            <label className={labelClass} style={labelStyle}>Nivel de actividad</label>
            <select className={inputClass} style={inputStyle}
              value={profile.activityLevel}
              onChange={e => setProfileForm(f => ({ ...f, activityLevel: e.target.value as ActivityLevel }))}>
              {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        {profileSaved && <p className="text-[12px] font-bold mt-2" style={{ color: '#16A34A' }}>✓ Guardado</p>}
        <button
          className={saveBtn} style={saveBtnStyle}
          disabled={saveProfileMutation.isPending}
          onClick={() => saveProfileMutation.mutate()}
        >
          {saveProfileMutation.isPending ? 'Guardando...' : 'Guardar datos personales'}
        </button>
      </div>

      {/* ── Section 2: Objective & preferences ── */}
      <div className={sectionClass} style={sectionStyle}>
        <h2 className="text-[15px] font-extrabold mb-4" style={{ color: '#2C2416' }}>Objetivo y preferencias</h2>

        <label className={labelClass} style={labelStyle}>Objetivo</label>
        <div className="space-y-2 mb-4">
          {(Object.entries(GOAL_LABELS) as [NutritionGoal, string][]).map(([k, v]) => (
            <button key={k} type="button"
              onClick={() => setPrefsForm(f => ({ ...f, goal: k }))}
              className="w-full px-4 py-3 rounded-[10px] border-2 text-left font-semibold text-[14px] transition"
              style={prefs.goal === k
                ? { borderColor: '#5C7A2C', background: '#EEF5E2', color: '#3A5018' }
                : { borderColor: '#EDE3D2', color: '#7A6E63' }}>
              {v}
            </button>
          ))}
        </div>

        <label className={labelClass} style={labelStyle}>Tipo de dieta</label>
        <select className={inputClass + ' mb-4'} style={inputStyle}
          value={prefs.dietaryType}
          onChange={e => setPrefsForm(f => ({ ...f, dietaryType: e.target.value as DietaryType }))}>
          <option value="OMNIVORE">Omnívoro (como de todo)</option>
          <option value="VEGETARIAN">Vegetariano</option>
          <option value="VEGAN">Vegano</option>
          <option value="PESCATARIAN">Pescetariano</option>
          <option value="KETO">Cetogénico (Keto)</option>
          <option value="PALEO">Paleo</option>
        </select>

        <label className={labelClass} style={labelStyle}>Comidas por día</label>
        <div className="flex gap-3 mb-4">
          {[3, 4, 5, 6].map(n => (
            <button key={n} type="button"
              onClick={() => setPrefsForm(f => ({ ...f, mealsPerDay: n }))}
              className="flex-1 py-3 rounded-[10px] border-2 font-bold text-[14px] transition"
              style={prefs.mealsPerDay === n
                ? { borderColor: '#5C7A2C', background: '#EEF5E2', color: '#3A5018' }
                : { borderColor: '#EDE3D2', color: '#7A6E63' }}>
              {n}
            </button>
          ))}
        </div>

        <label className={labelClass} style={labelStyle}>Alergias e intolerancias</label>
        <PreferenceChipGrid
          labels={chipLabels(COMMON_ALLERGIES, prefs.allergies)}
          selected={prefs.allergies}
          onToggle={toggleAllergy}
        />

        <label className={labelClass + ' mt-4'} style={labelStyle}>Comidas que preferís evitar</label>
        <PreferenceChipGrid
          labels={chipLabels(COMMON_DISLIKED_FOODS, prefs.dislikedFoods)}
          selected={prefs.dislikedFoods}
          onToggle={toggleDisliked}
        />

        <label className={labelClass + ' mt-4'} style={labelStyle}>Cocinas que te gustan</label>
        <PreferenceChipGrid
          labels={chipLabels(COMMON_CUISINES, prefs.preferredCuisines)}
          selected={prefs.preferredCuisines}
          onToggle={toggleCuisine}
        />

        {prefsSaved && <p className="text-[12px] font-bold mt-2" style={{ color: '#16A34A' }}>✓ Guardado</p>}
        <button
          className={saveBtn} style={saveBtnStyle}
          disabled={savePrefsMutation.isPending}
          onClick={() => savePrefsMutation.mutate()}
        >
          {savePrefsMutation.isPending ? 'Guardando...' : 'Guardar preferencias'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar tipos**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 4: Verificar en navegador**

Navegar a `http://localhost:3000/perfil`. Verificar:
- Se ven los datos del usuario pre-cargados.
- El resumen de TMB/TDEE/kcal se muestra correctamente.
- Guardar datos personales llama a `PUT /users/me/profile` y muestra "✓ Guardado".
- Guardar preferencias llama a `PUT /users/me/preferences`.
- Las queries `nutrition-targets` se invalidan al guardar (el resumen del dashboard refleja el cambio).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(app\)/perfil/page.tsx
git commit -m "feat: add Mi Perfil editable preferences page"
```

---

## Task 11: Dashboard — actualizar CTA

**Files:**
- Modify: `apps/web/src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Cambiar el link del estado vacío**

En `apps/web/src/app/(app)/dashboard/page.tsx`, buscar el link a `/generate-plan` en el estado vacío del plan (línea ~248) y reemplazarlo:

```typescript
// Antes:
<Link href="/generate-plan" className="...">
  🌱 Generar mi plan con IA
</Link>

// Después:
<Link href="/mi-semana" className="...">
  🌱 Crear mi plan semanal
</Link>
```

También buscar el link "Registrar en el menú →" (línea ~229) y actualizarlo si apunta a `/menu`:

```typescript
// Si dice href="/menu", cambiar a:
href="/mi-semana"
```

- [ ] **Step 2: Verificar en navegador**

Navegar a `http://localhost:3000/dashboard` sin plan activo. Verificar que el botón lleva a `/mi-semana`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(app\)/dashboard/page.tsx
git commit -m "feat: update dashboard CTA links to mi-semana"
```

---

## Task 12: Build final y verificación

- [ ] **Step 1: Build completo**

```bash
pnpm run build
```

Esperado: build exitoso sin errores de TypeScript ni de Next.js.

- [ ] **Step 2: Verificación de flujo completo**

Con el servidor corriendo (`pnpm dev`), verificar el flujo completo:

1. Ir a `/mi-semana` → aparecen las tabs de la semana, el resumen de macros y el botón "Generar semana".
2. Hacer click en "Generar semana" → se muestra la barra de progreso y los días se van poblando.
3. Cambiar de tab → se ve el plan del día seleccionado.
4. Hacer click en "🔄 Cambiar" en la próxima comida → se swapea y actualiza.
5. Ajustar la porción con + / − → los macros de la pill se recalculan en tiempo real.
6. Hacer click en "＋ Agregar comida propia" → se abre el modal, completar y guardar → los macros del resumen se actualizan.
7. Ir a `/recipes` → se ven las recetas guardadas, los filtros funcionan.
8. Ir a `/perfil` → se ven los datos pre-cargados, guardar muestra "✓ Guardado".
9. Ir a `/menu` o `/generate-plan` → redirigen a `/mi-semana`.

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "feat: Mi Semana, Mis Recetas y Mi Perfil — usabilidad completa"
```
