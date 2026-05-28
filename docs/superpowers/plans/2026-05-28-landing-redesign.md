# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar `apps/web/src/app/page.tsx` con layout asimétrico, tipografía Fraunces + Plus Jakarta Sans, animaciones de scroll, y 7 secciones incluyendo "Cómo funciona" y preview del producto.

**Architecture:** La landing se extrae en 7 componentes de sección (Server Components) + 1 cliente para scroll animations + 1 nav, todos bajo `apps/web/src/app/_components/landing/`. `page.tsx` queda como un orquestador delgado que los importa. `ScrollReveal.tsx` es el único Client Component — envuelve secciones individuales para el IntersectionObserver.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, `next/font/google` (Fraunces + Plus Jakarta Sans ya existente), CSS puro para animaciones (sin Framer Motion).

---

## File Map

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Modify | `apps/web/src/app/layout.tsx` | Agregar fuente Fraunces |
| Modify | `apps/web/tailwind.config.ts` | Agregar `font-fraunces` al theme |
| Modify | `apps/web/src/app/globals.css` | CSS de `.scroll-reveal` y `.animate-fade-up` |
| Create | `apps/web/src/app/_components/landing/ScrollReveal.tsx` | Client Component con IntersectionObserver |
| Create | `apps/web/src/app/_components/landing/LandingNav.tsx` | Nav sticky con backdrop blur |
| Create | `apps/web/src/app/_components/landing/HeroSection.tsx` | Hero asimétrico con panel de stats |
| Create | `apps/web/src/app/_components/landing/HowItWorksSection.tsx` | 3 pasos sobre fondo verde oscuro |
| Create | `apps/web/src/app/_components/landing/FeaturesSection.tsx` | Grid 2×2 de tarjetas |
| Create | `apps/web/src/app/_components/landing/ProductPreviewSection.tsx` | Split layout + mockup estático del plan |
| Create | `apps/web/src/app/_components/landing/TestimonialsSection.tsx` | 3 testimonios |
| Create | `apps/web/src/app/_components/landing/CtaBanner.tsx` | CTA final + footer |
| Modify | `apps/web/src/app/page.tsx` | Orquestador delgado |

---

## Task 1: Tipografía — agregar Fraunces a layout.tsx y Tailwind

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/tailwind.config.ts`

- [ ] **Step 1: Agregar Fraunces a layout.tsx**

`Plus_Jakarta_Sans` ya existe — solo agregar `Fraunces` y su variable CSS. Reemplazar el archivo completo:

```tsx
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers/Providers';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NutriPlan - Tu asistente de nutrición personalizada',
  description:
    'Planes nutricionales personalizados, recetas inteligentes y gestión de compras para Argentina.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${jakarta.variable} ${fraunces.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Agregar `font-fraunces` a tailwind.config.ts**

Reemplazar el archivo completo:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        fraunces: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50:  '#F2F7EC',
          100: '#E3EDDA',
          200: '#C8DBB5',
          300: '#ACC990',
          400: '#90B76C',
          500: '#6B8F35',
          600: '#5C7A2C',
          700: '#4A6020',
          800: '#374814',
          900: '#232F0D',
        },
        accent: {
          50:  '#FDF4EE',
          100: '#FAE5D2',
          200: '#F5C9A3',
          300: '#F0AC74',
          400: '#EB8F45',
          500: '#E07336',
          600: '#D4622A',
          700: '#B04E1F',
          800: '#8C3C16',
          900: '#6E2D0E',
        },
        cream: {
          50:  '#FEFCF9',
          100: '#FDF8F2',
          200: '#FBF2E7',
          300: '#F8EBDB',
          400: '#F4E2CB',
          500: '#EDD5B6',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 3: Verificar que el build pasa**

```bash
pnpm --filter web build
```

Resultado esperado: sin errores TypeScript. Si falla con "cannot find module 'next/font/google'", verificar que `next` está en las dependencias del workspace web.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/layout.tsx apps/web/tailwind.config.ts
git commit -m "feat: add Fraunces font and font-fraunces Tailwind utility"
```

---

## Task 2: Animaciones CSS + ScrollReveal component

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Create: `apps/web/src/app/_components/landing/ScrollReveal.tsx`

- [ ] **Step 1: Agregar CSS de animaciones a globals.css**

Agregar al final del archivo existente (no reemplazar, solo agregar):

```css
/* Landing — hero fade-in */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-up {
  animation: fade-up 0.5s ease-out both;
}

/* Landing — scroll reveal */
.scroll-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.scroll-reveal.scroll-visible {
  opacity: 1;
  transform: translateY(0);
}
```

- [ ] **Step 2: Crear ScrollReveal.tsx**

```tsx
'use client';
import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function ScrollReveal({ children, className = '', delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add('scroll-visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`scroll-reveal ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
pnpm --filter web build
```

Resultado esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/globals.css apps/web/src/app/_components/landing/ScrollReveal.tsx
git commit -m "feat: add scroll-reveal animation system and ScrollReveal component"
```

---

## Task 3: LandingNav component

**Files:**
- Create: `apps/web/src/app/_components/landing/LandingNav.tsx`

- [ ] **Step 1: Crear LandingNav.tsx**

```tsx
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
```

- [ ] **Step 2: Verificar TypeScript**

```bash
pnpm --filter web build
```

Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/_components/landing/LandingNav.tsx
git commit -m "feat: add LandingNav component with sticky nav and anchor links"
```

---

## Task 4: HeroSection component

**Files:**
- Create: `apps/web/src/app/_components/landing/HeroSection.tsx`

- [ ] **Step 1: Crear HeroSection.tsx**

```tsx
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
              style={{ color: '#D4622A', fontStyle: 'italic', animationDelay: '100ms' }}
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
```

- [ ] **Step 2: Verificar TypeScript**

```bash
pnpm --filter web build
```

Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/_components/landing/HeroSection.tsx
git commit -m "feat: add HeroSection with asymmetric layout and fade-up animations"
```

---

## Task 5: HowItWorksSection component

**Files:**
- Create: `apps/web/src/app/_components/landing/HowItWorksSection.tsx`

- [ ] **Step 1: Crear HowItWorksSection.tsx**

```tsx
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
```

- [ ] **Step 2: Verificar TypeScript**

```bash
pnpm --filter web build
```

Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/_components/landing/HowItWorksSection.tsx
git commit -m "feat: add HowItWorksSection with 3 steps and scroll reveal"
```

---

## Task 6: FeaturesSection component

**Files:**
- Create: `apps/web/src/app/_components/landing/FeaturesSection.tsx`

- [ ] **Step 1: Crear FeaturesSection.tsx**

```tsx
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
```

- [ ] **Step 2: Verificar TypeScript**

```bash
pnpm --filter web build
```

Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/_components/landing/FeaturesSection.tsx
git commit -m "feat: add FeaturesSection with 2x2 card grid and scroll reveal"
```

---

## Task 7: ProductPreviewSection component

**Files:**
- Create: `apps/web/src/app/_components/landing/ProductPreviewSection.tsx`

- [ ] **Step 1: Crear ProductPreviewSection.tsx**

```tsx
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
```

- [ ] **Step 2: Verificar TypeScript**

```bash
pnpm --filter web build
```

Resultado esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/_components/landing/ProductPreviewSection.tsx
git commit -m "feat: add ProductPreviewSection with static weekly plan mockup"
```

---

## Task 8: TestimonialsSection + CtaBanner components

**Files:**
- Create: `apps/web/src/app/_components/landing/TestimonialsSection.tsx`
- Create: `apps/web/src/app/_components/landing/CtaBanner.tsx`

- [ ] **Step 1: Crear TestimonialsSection.tsx**

```tsx
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
```

- [ ] **Step 2: Crear CtaBanner.tsx**

```tsx
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
```

- [ ] **Step 3: Verificar TypeScript**

```bash
pnpm --filter web build
```

Resultado esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/_components/landing/TestimonialsSection.tsx apps/web/src/app/_components/landing/CtaBanner.tsx
git commit -m "feat: add TestimonialsSection and CtaBanner components"
```

---

## Task 9: Reescribir page.tsx y verificar build final

**Files:**
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Reemplazar page.tsx completo**

```tsx
import { LandingNav } from './_components/landing/LandingNav';
import { HeroSection } from './_components/landing/HeroSection';
import { HowItWorksSection } from './_components/landing/HowItWorksSection';
import { FeaturesSection } from './_components/landing/FeaturesSection';
import { ProductPreviewSection } from './_components/landing/ProductPreviewSection';
import { TestimonialsSection } from './_components/landing/TestimonialsSection';
import { CtaBanner } from './_components/landing/CtaBanner';

export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ background: '#FBF5EE' }}>
      <LandingNav />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ProductPreviewSection />
      <TestimonialsSection />
      <CtaBanner />
    </main>
  );
}
```

- [ ] **Step 2: Verificar build completo**

```bash
pnpm --filter web build
```

Resultado esperado: compilación exitosa sin errores TypeScript ni warnings de tipo.

- [ ] **Step 3: Levantar el servidor y revisar visualmente**

```bash
pnpm --filter web dev
```

Verificar en `http://localhost:3000`:
- Nav sticky al hacer scroll
- Hero asimétrico con panel verde a la derecha
- Links del nav ("Funciones", "Cómo funciona", "Testimonios") hacen scroll suave a sus secciones
- Sección "Cómo funciona" con fondo verde oscuro
- Animaciones de scroll: las secciones debajo del fold aparecen con fade-up al hacer scroll
- Preview del producto con el mockup del plan semanal
- En mobile (< 768px): todo pasa a columna única

- [ ] **Step 4: Commit final**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat: redesign landing page with asymmetric hero, Fraunces typography, and scroll animations"
```

---

## Self-Review

**Spec coverage:**
- Nav sticky con backdrop blur → Task 3 ✓
- Hero asimétrico (copy izquierda, panel stats derecha) → Task 4 ✓
- Tipografía Fraunces + Plus Jakarta Sans → Task 1 ✓
- `.animate-fade-up` escalonado en el hero → Task 2 + 4 ✓
- ScrollReveal con IntersectionObserver → Task 2 ✓
- Cómo funciona (3 pasos, fondo verde oscuro) → Task 5 ✓
- Features 2×2 grid → Task 6 ✓
- Product preview con mockup estático del plan → Task 7 ✓
- Testimonios 3 columnas → Task 8 ✓
- CTA banner + footer → Task 8 ✓
- Anchor links en nav (#como-funciona, #features, #testimonios) → Task 3 + 5 + 6 + 8 ✓
- Mobile responsive (columna única < 768px) → Tailwind `grid-cols-1 lg:grid-cols-...` en cada sección ✓
- `pnpm --filter web build` sin errores → verificado en cada task ✓
- Archivos < 500 líneas → secciones extraídas a componentes individuales ✓
- Server Components (salvo ScrollReveal) → `'use client'` solo en ScrollReveal.tsx ✓

**Placeholder scan:** ningún TBD, TODO ni código incompleto. Cada step muestra el código completo.

**Type consistency:** `ScrollReveal` definido en Task 2, importado con path relativo `'./ScrollReveal'` en Tasks 5, 6, 7, 8. `Props` interface definida en el mismo archivo que el componente — sin conflictos.
