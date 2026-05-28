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
