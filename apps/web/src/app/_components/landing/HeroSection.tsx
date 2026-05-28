import Link from 'next/link';

const FEAT_CHIPS = [
  { icon: '🧮', text: 'Macros calculados al instante' },
  { icon: '🍳', text: 'Recetas con lo que tenés en casa' },
  { icon: '📅', text: 'Plan semanal completo en segundos' },
];

const TRUST_AVATARS = [
  { initial: 'S', color: '#5C7A2C' },
  { initial: 'D', color: '#4A6020' },
  { initial: 'L', color: '#6B8F35' },
  { initial: 'M', color: '#D4622A' },
];

export function HeroSection() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-16 pb-14">
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-8 lg:gap-12 items-center">

        {/* ── Copy ── */}
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5 border animate-fade-up"
            style={{ background: '#E3EDDA', borderColor: '#C8DBB5', color: '#4A6020', animationDelay: '0ms' }}
          >
            🌿 Nutrición inteligente para Argentina
          </div>

          <h1
            className="font-fraunces font-black text-5xl md:text-6xl leading-[1.0] tracking-tight mb-4 animate-fade-up"
            style={{ animationDelay: '100ms' }}
          >
            Comé bien,{' '}
            <span className="block" style={{ color: '#5C7A2C' }}>sin culpa.</span>
            <span
              className="block font-fraunces font-normal text-4xl md:text-5xl"
              style={{ color: '#D4622A', fontStyle: 'italic' }}
            >
              Vivite mejor.
            </span>
          </h1>

          <p
            className="text-base leading-relaxed mb-7 max-w-sm animate-fade-up"
            style={{ color: '#6B5A47', animationDelay: '200ms' }}
          >
            Tu asistente con IA: planes personalizados, recetas argentinas y macros precisos.
            Tu primer plan listo en 12 segundos.
          </p>

          <div
            className="flex flex-wrap gap-3 items-center mb-6 animate-fade-up"
            style={{ animationDelay: '300ms' }}
          >
            <Link
              href="/register"
              className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl text-sm transition-transform active:scale-[0.98]"
              style={{ background: '#D4622A', boxShadow: '0 4px 16px rgba(212,98,42,0.35)' }}
            >
              🌱 Crear mi plan gratis
            </Link>
            <a
              href="#como-funciona"
              className="text-sm font-semibold flex items-center gap-1"
              style={{ color: '#5C7A2C' }}
            >
              Ver cómo funciona →
            </a>
          </div>

          <div
            className="flex items-center gap-3 animate-fade-up"
            style={{ animationDelay: '400ms' }}
          >
            <div className="flex">
              {TRUST_AVATARS.map((a, i) => (
                <div
                  key={a.initial}
                  className="w-7 h-7 rounded-full border-2 border-[#FBF5EE] flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: a.color, marginLeft: i === 0 ? 0 : '-8px' }}
                >
                  {a.initial}
                </div>
              ))}
            </div>
            <p className="text-xs" style={{ color: '#9A7B5A' }}>
              Usada por <strong style={{ color: '#5C7A2C' }}>2.400+ argentinos</strong> · 98% de satisfacción
            </p>
          </div>
        </div>

        {/* ── Stats panel ── */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-3 shadow-lg animate-fade-up"
          style={{
            background: 'linear-gradient(155deg, #E3EDDA 0%, #D0DFC0 100%)',
            animationDelay: '200ms',
          }}
        >
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div
              className="font-fraunces font-black text-3xl leading-none tracking-tight"
              style={{ color: '#4A6020' }}
            >
              2.400+
            </div>
            <div className="text-xs mt-1" style={{ color: '#9A7B5A' }}>usuarios activos hoy</div>
          </div>

          {FEAT_CHIPS.map((f) => (
            <div
              key={f.text}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.7)', color: '#4A3728' }}
            >
              <span className="text-lg">{f.icon}</span>
              {f.text}
            </div>
          ))}

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div
              className="font-fraunces font-black text-3xl leading-none tracking-tight"
              style={{ color: '#4A6020' }}
            >
              12 seg
            </div>
            <div className="text-xs mt-1" style={{ color: '#9A7B5A' }}>para tu primer plan personalizado</div>
          </div>
        </div>

      </div>
    </section>
  );
}
