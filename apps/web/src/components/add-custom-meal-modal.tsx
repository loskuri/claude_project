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
