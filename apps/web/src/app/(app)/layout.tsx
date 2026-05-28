'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { AccountSettingsModal } from '@/components/account-settings-modal';

const NAV_ITEMS = [
  { href: '/mi-semana',     label: 'Mi Semana',   icon: '📅', desc: 'Tu plan semanal',         iconBg: 'bg-amber-100' },
  { href: '/shopping-list', label: 'Compras',     icon: '🛒', desc: 'Lista semanal',            iconBg: 'bg-teal-100' },
  { href: '/inventory',     label: 'Inventario',  icon: '🥫', desc: 'Lo que tenés',             iconBg: 'bg-lime-100' },
  { href: '/recipes',       label: 'Mis Recetas', icon: '🍳', desc: 'Tus recetas guardadas',    iconBg: 'bg-orange-100' },
  { href: '/perfil',        label: 'Mi Perfil',   icon: '⚙️', desc: 'Preferencias y objetivo', iconBg: 'bg-gray-100' },
  { href: '/progress',      label: 'Progreso',    icon: '📈', desc: 'Tu evolución',             iconBg: 'bg-purple-100' },
];

function UserAvatar({ name }: { name: string }) {
  const initials = name.trim().split(/\s+/).map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #6B8F35, #4A6020)' }}>
      {initials || '?'}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace('/login');
    else if (!user.onboardingComplete) router.replace('/onboarding');
  }, [hydrated, user, router]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (!hydrated || !user || !user.onboardingComplete) return null;

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.firstName;

  return (
    <>
      <div className="min-h-screen flex" style={{ backgroundColor: '#FBF5EE' }}>
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/40 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`fixed md:static inset-y-0 left-0 z-30 w-64 flex flex-col shadow-sm transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: '#FEFCF9', borderRight: '1px solid #EDD5B6' }}>
          {/* Logo */}
          <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid #EDD5B6' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ background: 'linear-gradient(135deg, #6B8F35, #4A6020)' }}>
                N
              </div>
              <div>
                <div className="font-bold text-gray-900 text-base leading-tight">NutriPlan</div>
                <div className="text-[10px] leading-tight" style={{ color: '#9A7B5A' }}>Tu asistente nutricional</div>
              </div>
            </div>
            <button className="md:hidden p-1.5 rounded-lg transition" style={{ color: '#9A7B5A' }} onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href + item.label} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative" style={active ? { backgroundColor: '#E3EDDA' } : {}}>
                  {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full" style={{ backgroundColor: '#5C7A2C' }} />}
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 transition-colors ${active ? 'bg-brand-100' : item.iconBg}`}>
                    {item.icon}
                  </span>
                  <div>
                    <div className="text-sm font-semibold leading-tight" style={{ color: active ? '#4A6020' : '#2D2015' }}>{item.label}</div>
                    <div className="text-xs leading-tight mt-0.5" style={{ color: '#9A7B5A' }}>{item.desc}</div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="px-3 py-4" style={{ borderTop: '1px solid #EDD5B6' }}>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl transition mb-1" style={{}}>
              <UserAvatar name={displayName} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs truncate" style={{ color: '#9A7B5A' }}>{user.email}</p>
              </div>
              <button type="button" onClick={() => setSettingsOpen(true)} className="shrink-0 p-2 rounded-lg transition" style={{ color: '#9A7B5A' }} aria-label="Ajustes de cuenta">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            <button onClick={() => { clearAuth(); router.push('/login'); }} className="w-full text-left px-3 py-2 text-xs rounded-lg transition hover:bg-red-50 hover:text-red-500" style={{ color: '#9A7B5A' }}>
              Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar */}
          <header className="md:hidden sticky top-0 z-10 px-4 py-3 flex items-center gap-3 shadow-sm" style={{ backgroundColor: '#FEFCF9', borderBottom: '1px solid #EDD5B6' }}>
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl transition" style={{ color: '#5C7A2C' }} aria-label="Abrir menú">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: 'linear-gradient(135deg, #6B8F35, #4A6020)' }}>N</div>
              <span className="font-bold text-gray-900">NutriPlan</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
      <AccountSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
