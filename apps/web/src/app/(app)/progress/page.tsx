'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { MacroHistoryChart } from '@/components/macro-history-chart';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface WeightLog { id: string; date: string; weightKg: number; notes?: string; }

type ActiveTab = 'weight' | 'macros';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ProgressPage() {
  const qc = useQueryClient();
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(todayISO());
  const [tab, setTab] = useState<ActiveTab>('weight');

  const { data: weightData, isLoading: loadingWeight } = useQuery<{ logs: WeightLog[] }>({
    queryKey: ['progress-weight'],
    queryFn: () => apiFetch('/progress/weight'),
  });

  const addMutation = useMutation({
    mutationFn: (body: object) => apiFetch('/progress/weight', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['progress-weight'] }); setWeight(''); setNotes(''); setDate(todayISO()); },
  });

  const logs = weightData?.logs ?? [];

  const weightChartData = logs.map((l) => ({
    date: new Date(l.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
    peso: l.weightKg,
  }));

  const latest = logs[logs.length - 1];
  const first = logs[0];
  const delta = latest && first ? (latest.weightKg - first.weightKg).toFixed(1) : null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mi progreso</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Registrar peso</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addMutation.mutate({
                weightKg: Number(weight),
                date: new Date(date).toISOString(),
                notes: notes || undefined,
              });
            }}
            className="space-y-3"
          >
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Fecha</label>
              <input
                type="date" required value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Peso (kg)</label>
              <input
                type="number" step="0.1" required value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                placeholder="70.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Notas (opcional)</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl" placeholder="¿Cómo te sentís?" />
            </div>
            <button type="submit" disabled={addMutation.isPending}
              className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl disabled:opacity-60">
              {addMutation.isPending ? 'Guardando...' : 'Registrar'}
            </button>
          </form>

          {latest && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="text-3xl font-bold text-gray-900">{latest.weightKg} kg</div>
              <div className="text-sm text-gray-500 mt-1">Último registro</div>
              {delta !== null && (
                <div className={`mt-2 text-sm font-medium ${Number(delta) < 0 ? 'text-brand-600' : Number(delta) > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
                  {Number(delta) >= 0 ? '+' : ''}{delta} kg desde el inicio
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              {tab === 'weight' ? 'Evolución del peso' : 'Macros por día (últimos 30 días)'}
            </h2>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {(['weight', 'macros'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${tab === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>
                  {t === 'weight' ? 'Peso' : 'Macros'}
                </button>
              ))}
            </div>
          </div>

          {tab === 'weight' ? (
            loadingWeight ? (
              <div className="animate-pulse h-48 bg-gray-100 rounded-xl" />
            ) : weightChartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip formatter={(v: number) => [`${v} kg`, 'Peso']} />
                  <Line type="monotone" dataKey="peso" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                Registrá al menos 2 pesos para ver la gráfica
              </div>
            )
          ) : (
            <MacroHistoryChart days={30} height={200} enabled={tab === 'macros'} />
          )}
        </div>
      </div>

      {logs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Historial de peso</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[...logs].reverse().map((log) => (
              <div key={log.id} className="px-6 py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm text-gray-700 font-medium">
                    {new Date(log.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {log.notes && (
                    <p className="text-xs text-gray-400 mt-0.5">{log.notes}</p>
                  )}
                </div>
                <span className="font-semibold text-gray-900 shrink-0">{log.weightKg} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
