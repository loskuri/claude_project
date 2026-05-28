import { ScrollReveal } from './ScrollReveal';

const STEPS = [
  {
    num: 1,
    title: 'Completá tu perfil',
    desc: 'Objetivo, peso, altura y preferencias. Menos de 2 minutos, sin complicaciones.',
  },
  {
    num: 2,
    title: 'La IA genera tu plan',
    desc: 'Menú semanal completo, macros calculados y recetas adaptadas a la cocina argentina.',
  },
  {
    num: 3,
    title: 'Cocinás y registrás',
    desc: 'Lista de compras automática, registro de comidas y seguimiento de tu progreso.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-16 px-6" style={{ background: '#2C3E1A' }}>
      <div className="max-w-6xl mx-auto">
        <div
          className="text-xs font-bold tracking-[2.5px] uppercase mb-3"
          style={{ color: '#B8D98A' }}
        >
          ✦ Simple y rápido
        </div>
        <h2 className="font-fraunces font-black text-4xl leading-tight tracking-tight text-white mb-12">
          Tres pasos y ya{' '}
          <em className="font-fraunces font-normal" style={{ color: '#B8D98A', fontStyle: 'italic' }}>
            estás comiendo bien.
          </em>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line — visible only on md+ */}
          <div
            className="hidden md:block absolute top-6 left-[22%] right-[22%] h-px"
            style={{ background: 'rgba(184,217,138,0.2)' }}
          />

          {STEPS.map((step, i) => (
            <ScrollReveal key={step.num} delay={i * 120}>
              <div className="flex flex-col items-center text-center relative z-10">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-fraunces font-black text-xl text-white mb-5"
                  style={{
                    background: 'linear-gradient(135deg, #5C7A2C, #4A6020)',
                    boxShadow: '0 4px 16px rgba(92,122,44,0.4)',
                  }}
                >
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {step.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
