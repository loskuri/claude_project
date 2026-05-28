import { ScrollReveal } from './ScrollReveal';

const CHIPS = ['🥗 Variedad diaria', '🇦🇷 Recetas argentinas', '🛒 Lista de compras', '📊 Macros exactos'];

const DAYS = [
  {
    day: 'Lun',
    meals: ['🥣 Avena con banana y miel', '🍗 Pechuga a la plancha con ensalada', '🍝 Fideos con tuco casero'],
    kcal: '1.840',
  },
  {
    day: 'Mar',
    meals: ['🍳 Tostadas con huevo revuelto', '🥗 Ensalada de legumbres', '🥩 Milanesa de soja con puré'],
    kcal: '1.760',
  },
  {
    day: 'Mié',
    meals: ['🫐 Yogur con granola y frutas', '🥙 Wrap de pollo y vegetales', '🐟 Merluza al horno con arroz'],
    kcal: '1.820',
  },
  {
    day: 'Jue',
    meals: ['🥞 Panqueques de avena', '🍲 Locro light de invierno', '🥗 Tortilla de verduras'],
    kcal: '1.790',
  },
];

export function ProductPreviewSection() {
  return (
    <section
      className="py-16 px-6 border-y"
      style={{ background: '#F5EFE8', borderColor: '#EDD5B6' }}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 items-center">

        {/* Copy */}
        <ScrollReveal>
          <div>
            <div
              className="text-xs font-bold tracking-[2.5px] uppercase mb-3"
              style={{ color: '#5C7A2C' }}
            >
              ✦ Lo que recibís
            </div>
            <h2
              className="font-fraunces font-black text-4xl leading-tight tracking-tight mb-4"
              style={{ color: '#1A1A1A' }}
            >
              Tu plan semanal,{' '}
              <em className="font-fraunces font-normal" style={{ color: '#5C7A2C', fontStyle: 'italic' }}>
                listo en segundos.
              </em>
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: '#6B5A47' }}>
              La IA genera un menú completo y personalizado: desayuno, almuerzo, merienda y cena
              para toda la semana. Con tus macros al día.
            </p>
            <div className="flex flex-wrap gap-2">
              {CHIPS.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border"
                  style={{ background: '#E3EDDA', borderColor: '#C8DBB5', color: '#4A6020' }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Mock screen */}
        <ScrollReveal delay={140}>
          <div
            className="rounded-2xl overflow-hidden shadow-xl border"
            style={{ borderColor: '#EDD5B6' }}
          >
            {/* Topbar */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #3D5A1E, #2C4418)' }}
            >
              <span className="text-sm font-bold" style={{ color: '#B8D98A' }}>NutriPlan</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Semana del 26 mayo</span>
            </div>

            {/* Days */}
            <div className="bg-white divide-y divide-[#F0E8DC]">
              {DAYS.map((d) => (
                <div key={d.day} className="flex items-start gap-3 px-4 py-3">
                  <span
                    className="text-xs font-bold uppercase w-8 flex-shrink-0 pt-0.5"
                    style={{ color: '#5C7A2C' }}
                  >
                    {d.day}
                  </span>
                  <div className="flex-1 flex flex-col gap-0.5">
                    {d.meals.map((m) => (
                      <span key={m} className="text-xs" style={{ color: '#4A3728' }}>{m}</span>
                    ))}
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-md flex-shrink-0"
                    style={{ background: '#FEF0E8', color: '#D4622A' }}
                  >
                    {d.kcal} kcal
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
