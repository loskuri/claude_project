import { ScrollReveal } from './ScrollReveal';

const TESTIMONIALS = [
  {
    name: 'Sofía M.',
    city: 'Buenos Aires',
    result: 'Bajó 8kg',
    initial: 'S',
    color: '#5C7A2C',
    text: 'Perdí 8kg en 3 meses sin pasar hambre. Los planes incluyen milanesa y locro, no podía creerlo.',
  },
  {
    name: 'Diego R.',
    city: 'Rosario',
    result: 'Personal Trainer',
    initial: 'D',
    color: '#4A6020',
    text: 'Como personal trainer, recomiendo NutriPlan a todos mis clientes. Los macros son precisos y las recetas buenísimas.',
  },
  {
    name: 'Laura G.',
    city: 'Córdoba',
    result: 'Bajó 3kg en 3 semanas',
    initial: 'L',
    color: '#D4622A',
    text: 'En 3 semanas bajé 3kg y lo mejor es que comí asado el fin de semana. La app te enseña a balancear, no a privarte.',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonios" className="py-16 px-6" style={{ background: '#FBF5EE' }}>
      <div className="max-w-6xl mx-auto">
        <h2
          className="font-fraunces font-black text-4xl tracking-tight text-center mb-10"
          style={{ color: '#1A1A1A' }}
        >
          Lo que dicen nuestros usuarios
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 100}>
              <div
                className="bg-white rounded-2xl p-6 border shadow-sm flex flex-col h-full"
                style={{ borderColor: '#EDD5B6' }}
              >
                <div className="text-sm mb-3" style={{ color: '#D4622A', letterSpacing: '1px' }}>
                  ★★★★★
                </div>
                <p className="text-sm leading-relaxed italic flex-1 mb-5" style={{ color: '#4A3728' }}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: t.color }}
                  >
                    {t.initial}
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{t.name}</div>
                    <div className="text-xs" style={{ color: '#9A7B5A' }}>{t.city} · {t.result}</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
