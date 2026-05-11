'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface MacroDay {
  date: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

function utcRangeLastDays(days: number) {
  const end = new Date();
  const toStr = end.toISOString().slice(0, 10);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const fromStr = start.toISOString().slice(0, 10);
  return { fromStr, toStr };
}

export interface MacroHistoryChartProps {
  /** Días inclusivos hasta hoy (por defecto 30). */
  days?: number;
  height?: number;
  /** Si es false, no se dispara la petición (p. ej. hasta que el usuario abra la pestaña). */
  enabled?: boolean;
}

export function MacroHistoryChart({ days = 30, height = 200, enabled = true }: MacroHistoryChartProps) {
  const { fromStr, toStr } = useMemo(() => utcRangeLastDays(days), [days]);

  const { data, isLoading } = useQuery<{ history: MacroDay[] }>({
    queryKey: ['meal-logs-history', fromStr, toStr],
    queryFn: () => apiFetch(`/meal-logs/history?from=${fromStr}&to=${toStr}`),
    enabled,
  });

  const chartData = useMemo(() => {
    const history = data?.history ?? [];
    return history.map((d) => ({
      date: new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
      Proteína: Math.round(d.proteinG),
      Carbos: Math.round(d.carbsG),
      Grasas: Math.round(d.fatG),
    }));
  }, [data?.history]);

  const hasLoggedMacros = useMemo(
    () => (data?.history ?? []).some((d) => d.proteinG > 0 || d.carbsG > 0 || d.fatG > 0),
    [data?.history],
  );

  if (!enabled) {
    return null;
  }

  if (isLoading) {
    return <div className="animate-pulse bg-gray-100 rounded-xl" style={{ height }} />;
  }

  if (!hasLoggedMacros) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
        Registrá comidas para ver tus macros diarios
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value: number, name: string) => [`${value} g`, name]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Proteína" stackId="a" fill="#16a34a" />
        <Bar dataKey="Carbos" stackId="a" fill="#3b82f6" />
        <Bar dataKey="Grasas" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
