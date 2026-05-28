import { ScrollReveal } from './ScrollReveal';

const FEATURES = [
  {
    icon: '🧮',
    title: 'Macros personalizados',
    desc: 'Calculamos tu TMB y TDEE con Mifflin-St Jeor y distribuimos según tu objetivo.',
    bg: '#F0E8DC',
    border: '#EDD5B6',
  },
  {
    icon: '🍳',
    title: 'Recetas con IA',
    desc: 'Priorizamos los ingredientes que ya tenés, adaptadas a la cocina argentina.',
    bg: '#E3EDDA',
    border: '#C8DBB5',
  },
  {
    icon: '📅',
    title: 'Plan semanal inteligente',
    desc: 'Menú completo con variedad y equilibrio. Lista de compras incluida.',
    bg: '#FEF3E2',
    border: '#F5DFA0',
  },
  {
    icon: '📈',
    title: 'Seguí tu progreso',
    desc: 'Registrá tu peso, visualizá tu evolución y mantené el ritmo hacia tus metas.',
    bg: '#F0E8DC',
    border: '#EDD5B6',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 px-6" style={{ background: '#FBF5EE' }}>
      <div className="max-w-6xl mx-auto">
        <div
          className="text-xs font-bold tracking-[2.5px] uppercase mb-3"
          style={{ color: '#5C7A2C' }}
        >
          ✦ Todo lo que necesitás
        </div>
        <h2
          className="font-fraunces font-black text-4xl leading-tight tracking-tight mb-2"
          style={{ color: '#1A1A1A' }}
        >
          Herramientas para comer bien,
          <br className="hidden sm:block" /> sin que sea un trabajo.
        </h2>
        <p className="text-sm mb-10" style={{ color: '#6B5A47' }}>
          Pensadas para la vida real — no para nutricionistas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 80}>
              <div
                className="rounded-2xl p-5 flex items-start gap-4 border transition-shadow hover:shadow-md h-full"
                style={{ background: f.bg, borderColor: f.border }}
              >
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1" style={{ color: '#1A1A1A' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B5A47' }}>{f.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
