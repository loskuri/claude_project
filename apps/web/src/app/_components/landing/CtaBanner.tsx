import Link from 'next/link';

export function CtaBanner() {
  return (
    <>
      <section className="px-6 pb-7">
        <div
          className="max-w-6xl mx-auto rounded-3xl py-14 px-10 text-center"
          style={{
            background: 'linear-gradient(135deg, #3D5A1E, #2C4418)',
            boxShadow: '0 8px 32px rgba(44,68,24,0.25)',
          }}
        >
          <div
            className="text-xs font-bold tracking-[2.5px] uppercase mb-4"
            style={{ color: '#B8D98A' }}
          >
            ✦ Empezá ahora
          </div>
          <h2 className="font-fraunces font-black text-4xl leading-tight tracking-tight text-white mb-3">
            Tu plan nutricional,{' '}
            <em className="font-fraunces font-normal" style={{ color: '#B8D98A', fontStyle: 'italic' }}>
              en 12 segundos.
            </em>
          </h2>
          <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Completá tu perfil y recibí tu menú semanal personalizado al instante.
            Sin tarjeta de crédito.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 text-white font-bold rounded-2xl text-sm transition-transform active:scale-[0.98]"
            style={{ background: '#D4622A', boxShadow: '0 6px 20px rgba(212,98,42,0.4)' }}
          >
            🌱 Crear mi plan gratis
          </Link>
          <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Sin tarjeta de crédito · Cancelás cuando querés
          </p>
        </div>
      </section>

      <footer
        className="py-5 px-6 border-t flex items-center justify-between"
        style={{ borderColor: '#EDD5B6' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-black"
            style={{ background: 'linear-gradient(135deg, #6B8F35, #4A6020)' }}
          >
            N
          </div>
          <span className="text-sm font-bold" style={{ color: '#4A6020' }}>NutriPlan</span>
        </div>
        <p className="text-xs" style={{ color: '#B0A090' }}>© 2026 NutriPlan · Hecho con amor en Argentina</p>
      </footer>
    </>
  );
}
