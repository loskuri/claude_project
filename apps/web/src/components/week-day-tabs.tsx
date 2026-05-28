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
