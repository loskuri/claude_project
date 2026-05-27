import Link from 'next/link';

const FEATURES = [
  {
    icon: '🧮',
    title: 'Macros personalizados',
    desc: 'Calculamos tu TMB y TDEE con la fórmula Mifflin-St Jeor y distribuimos tus macros según tu objetivo.',
    bg: 'bg-cream-200',
    iconBg: 'bg-accent-100',
    border: 'border-cream-400',
    iconColor: 'text-accent-600',
  },
  {
    icon: '🍳',
    title: 'Recetas con IA',
    desc: 'Nuestra IA genera recetas priorizando los ingredientes que ya tenés en casa, adaptadas a la cocina argentina.',
    bg: 'bg-brand-50',
    iconBg: 'bg-brand-100',
    border: 'border-brand-100',
    iconColor: 'text-brand-700',
  },
  {
    icon: '📅',
    title: 'Plan semanal inteligente',
    desc: 'Un menú completo para toda la semana, con variedad y equilibrio, listo en segundos.',
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    border: 'border-amber-100',
    iconColor: 'text-amber-700',
  },
  {
    icon: '📈',
    title: 'Seguí tu progreso',
    desc: 'Registrá tu peso, visualizá tu evolución y mantené el ritmo hacia tus metas.',
    bg: 'bg-cream-200',
    iconBg: 'bg-brand-100',
    border: 'border-cream-400',
    iconColor: 'text-brand-600',
  },
];

const STATS = [
  { value: '2,400+', label: 'usuarios activos' },
  { value: '98%', label: 'satisfacción' },
  { value: '12 seg', label: 'para tu primer plan' },
];

const TESTIMONIALS = [
  { name: 'Sofía M.', city: 'Buenos Aires', text: 'Perdí 8kg en 3 meses sin pasar hambre. Los planes son deliciosos y adaptados a lo que tengo en casa.' },
  { name: 'Diego R.', city: 'Rosario', text: 'Como personal trainer, recomiendo NutriPlan a todos mis clientes. Los macros son precisos y las recetas buenísimas.' },
  { name: 'Laura G.', city: 'Córdoba', text: 'Por fin una app que entiende la comida argentina. El locro y la milanesa están en el plan!' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FBF5EE' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-10 backdrop-blur-sm border-b" style={{ backgroundColor: 'rgba(251,245,238,0.9)', borderColor: '#EDD5B6' }}>
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ background: 'linear-gradient(135deg, #6B8F35, #4A6020)' }}>
              N
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base leading-tight">NutriPlan</div>
              <div className="text-[10px] leading-tight" style={{ color: '#9A7B5A' }}>Tu asistente nutricional</div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Link href="/login" className="px-4 py-2 font-medium rounded-xl transition text-sm hover:bg-cream-300" style={{ color: '#5C7A2C' }}>
              Ingresar
            </Link>
            <Link href="/register" className="px-4 py-2.5 text-white font-semibold rounded-xl transition text-sm shadow-sm" style={{ backgroundColor: '#D4622A' }}>
              Empezar gratis →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full mb-8 border" style={{ backgroundColor: '#E3EDDA', color: '#4A6020', borderColor: '#C8DBB5' }}>
          🌿 Nutrición inteligente para Argentina
        </span>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Comé bien, sin<br />
          <span style={{ color: '#5C7A2C' }}>complicarte la vida</span>
        </h1>
        <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: '#6B5A47' }}>
          Tu asistente nutricional con IA: planes personalizados, recetas argentinas y macros calculados en segundos.
        </p>
        <div className="flex gap-3 justify-center flex-wrap mb-16">
          <Link
            href="/register"
            className="px-8 py-4 text-white text-base font-bold rounded-2xl transition flex items-center gap-2 shadow-lg"
            style={{ backgroundColor: '#D4622A', boxShadow: '0 8px 24px rgba(212,98,42,0.28)' }}
          >
            🌱 Crear mi plan gratis
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 text-base font-semibold rounded-2xl transition border-2"
            style={{ borderColor: '#C8DBB5', color: '#4A6020', backgroundColor: 'white' }}
          >
            Ya tengo cuenta
          </Link>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-10 flex-wrap">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold" style={{ color: '#4A6020' }}>{s.value}</div>
              <div className="text-sm mt-0.5" style={{ color: '#9A7B5A' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Todo lo que necesitás</h2>
          <p className="max-w-xl mx-auto" style={{ color: '#6B5A47' }}>
            Herramientas pensadas para que comer bien sea simple, no un trabajo.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`${f.bg} border ${f.border} rounded-2xl p-6 flex items-start gap-4 hover:shadow-md transition-shadow`}
            >
              <div className={`${f.iconBg} w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0`}>
                {f.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B5A47' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Lo que dicen nuestros usuarios</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: '#EDD5B6' }}>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#4A3728' }}>"{t.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#5C7A2C' }}>
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                  <div className="text-xs" style={{ color: '#9A7B5A' }}>{t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-3xl p-10 text-center shadow-xl" style={{ background: 'linear-gradient(135deg, #5C7A2C, #4A6020)' }}>
          <div className="text-5xl mb-4">🥗</div>
          <h2 className="text-3xl font-bold text-white mb-3">Empezá hoy, gratis</h2>
          <p className="mb-8 max-w-md mx-auto" style={{ color: '#C8DBB5' }}>
            Completá tu perfil en menos de 2 minutos y recibí tu plan nutricional personalizado al instante.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 font-bold rounded-2xl transition text-base shadow-lg"
            style={{ backgroundColor: '#D4622A', color: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
          >
            🌱 Crear mi plan con IA
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t" style={{ borderColor: '#EDD5B6' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: 'linear-gradient(135deg, #6B8F35, #4A6020)' }}>N</div>
          <span className="font-bold text-sm" style={{ color: '#4A6020' }}>NutriPlan</span>
        </div>
        <p className="text-xs" style={{ color: '#9A7B5A' }}>© 2026 NutriPlan. Hecho con amor en Argentina.</p>
      </footer>
    </main>
  );
}
