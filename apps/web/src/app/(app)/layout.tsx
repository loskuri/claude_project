'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { AccountSettingsModal } from '@/components/account-settings-modal';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: '🏠', desc: 'Tu resumen diario' },
  { href: '/menu', label: 'Mi menú', icon: '📅', desc: 'Plan semanal' },
  { href: '/recipes', label: 'Recetas IA', icon: '🍳', desc: 'Generá recetas' },
  { href: '/progress', label: 'Progreso', icon: '📈', desc: 'Peso y macros' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/login');
    } else if (!user.onboardingComplete) {
      router.replace('/onboarding');
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user || !user.onboardingComplete) return null;

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">N</div>
            <span className="text-xl font-bold text-brand-700">NutriPlan</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition group ${active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className="text-lg">{item.icon}</span>
                <div>
                  <div className={`text-sm font-medium ${active ? 'text-brand-700' : 'text-gray-700'}`}>{item.label}</div>
                  <div className="text-xs text-gray-400">{item.desc}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-start gap-2 px-4 py-3 mb-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.firstName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
              title="Ajustes de cuenta"
              aria-label="Ajustes de cuenta"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => { clearAuth(); router.push('/login'); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:text-red-600 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
    <AccountSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
