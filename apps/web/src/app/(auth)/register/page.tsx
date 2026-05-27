'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { API_URL } from '@/lib/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ firstName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string; user?: { id: string; email: string; firstName: string }; accessToken?: string; refreshToken?: string };
      if (!res.ok) throw new Error(data.error ?? 'Error al registrarse');
      setAuth(data.user!, data.accessToken!, data.refreshToken!);
      router.push('/onboarding');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#FBF5EE' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #D4622A 0%, #8C3C16 100%)' }}>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-xl">N</div>
            <span className="text-white font-bold text-lg">NutriPlan</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">Empezá<br />tu camino</h2>
          <p className="text-lg leading-relaxed" style={{ color: '#FAE5D2' }}>Un plan nutricional personalizado, listo en segundos.</p>
        </div>
        <div className="relative z-10 space-y-4">
          {[
            { icon: '🌿', text: 'Plan semanal generado por IA' },
            { icon: '🍽️', text: 'Recetas adaptadas a tu cocina' },
            { icon: '📊', text: 'Macros calculados con precisión' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium" style={{ color: '#FAE5D2' }}>{item.text}</span>
            </div>
          ))}
        </div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: '#E07336' }} />
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-10" style={{ backgroundColor: '#FAE5D2' }} />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm" style={{ background: 'linear-gradient(135deg, #6B8F35, #4A6020)' }}>N</div>
            <div>
              <div className="font-bold text-gray-900 text-lg leading-tight">NutriPlan</div>
              <div className="text-xs leading-tight" style={{ color: '#9A7B5A' }}>Tu asistente nutricional</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border" style={{ borderColor: '#EDD5B6' }}>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Creá tu cuenta gratis</h1>
            <p className="text-sm mb-8" style={{ color: '#9A7B5A' }}>Empezá a planificar tu nutrición hoy 🌱</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={update('firstName')}
                  required
                  minLength={2}
                  autoComplete="given-name"
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition text-sm"
                  style={{ backgroundColor: '#FBF5EE', borderColor: '#EDD5B6' }}
                  placeholder="¿Cómo te llamás?"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition text-sm"
                  style={{ backgroundColor: '#FBF5EE', borderColor: '#EDD5B6' }}
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={update('password')}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition text-sm"
                  style={{ backgroundColor: '#FBF5EE', borderColor: '#EDD5B6' }}
                  placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <span className="mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-white font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 text-sm mt-2"
                style={{ backgroundColor: '#D4622A' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creando cuenta...
                  </span>
                ) : 'Crear cuenta gratis →'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: '#EDD5B6' }} /></div>
              <div className="relative flex justify-center"><span className="px-3 bg-white text-xs" style={{ color: '#9A7B5A' }}>¿Ya tenés cuenta?</span></div>
            </div>

            <Link
              href="/login"
              className="w-full flex items-center justify-center py-3 border-2 font-semibold rounded-xl transition text-sm"
              style={{ borderColor: '#C8DBB5', color: '#4A6020' }}
            >
              Ingresar
            </Link>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: '#9A7B5A' }}>
            Al registrarte aceptás nuestros términos y política de privacidad.
          </p>
        </div>
      </div>
    </div>
  );
}
