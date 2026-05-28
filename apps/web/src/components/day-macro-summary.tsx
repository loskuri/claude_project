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
