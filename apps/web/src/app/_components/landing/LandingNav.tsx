import Link from 'next/link';

export function LandingNav() {
  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-sm"
      style={{ background: 'rgba(251,245,238,0.92)', borderColor: '#EDD5B6' }}
    >
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-sm"
            style={{ background: 'linear-gradient(135deg, #6B8F35, #4A6020)' }}
          >
            N
          </div>
          <div>
            <div className="text-sm font-black leading-tight" style={{ color: '#2C3E1A' }}>NutriPlan</div>
            <div className="text-[10px] leading-tight" style={{ color: '#9A7B5A' }}>Tu asistente nutricional</div>
          </div>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-xs font-medium transition-colors" style={{ color: '#6B5A47' }}>
            Funciones
          </a>
          <a href="#como-funciona" className="text-xs font-medium transition-colors" style={{ color: '#6B5A47' }}>
            Cómo funciona
          </a>
          <a href="#testimonios" className="text-xs font-medium transition-colors" style={{ color: '#6B5A47' }}>
            Testimonios
          </a>
          <Link href="/login" className="text-xs font-semibold" style={{ color: '#5C7A2C' }}>
            Ingresar
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-white text-xs font-bold rounded-lg transition-transform active:scale-[0.98]"
            style={{ background: '#D4622A', boxShadow: '0 2px 8px rgba(212,98,42,0.3)' }}
          >
            Empezar gratis →
          </Link>
        </div>

        {/* Mobile CTA only */}
        <Link
          href="/register"
          className="md:hidden px-3 py-1.5 text-white text-xs font-bold rounded-lg"
          style={{ background: '#D4622A' }}
        >
          Empezar →
        </Link>
      </div>
    </nav>
  );
}
