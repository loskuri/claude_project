# Landing Page Redesign — Design Spec

**Fecha:** 2026-05-28
**Objetivo:** Rediseñar la landing page de NutriPlan para aumentar conversión y retención de usuarios.
**Archivo a modificar:** `apps/web/src/app/page.tsx`

---

## Contexto

La landing actual (`page.tsx`) tiene la paleta correcta pero carece de personalidad tipográfica, profundidad visual y las secciones clave para retener al usuario antes de que se registre. El resultado es una página genérica que no transmite el valor real del producto.

**Decisiones de diseño tomadas:**
- Paleta: orgánica actual — sin cambios (#FBF5EE, #5C7A2C, #4A6020, #D4622A, #EDD5B6, #C8DBB5)
- Layout hero: asimétrico (copy izquierda, panel de stats/features derecha)
- Tipografía: Fraunces (headings) + Plus Jakarta Sans (cuerpo) — vía Google Fonts
- Secciones: 7 en total, 2 nuevas (Cómo funciona + Preview del producto)

---

## Tipografía

### Fuentes
- **Display / Headings:** `Fraunces` — serif óptico con variación de peso, cargado desde Google Fonts. Usado en todos los `h1`, `h2`, CTA principal y números de stats.
- **Cuerpo / UI:** `Plus Jakarta Sans` — sans-serif geométrico moderno. Usado en párrafos, labels, chips, nav y botones.

### Carga
```tsx
// En apps/web/src/app/layout.tsx
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz'],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
});
```

Las variables CSS `--font-fraunces` y `--font-jakarta` se aplican al `<html>` en `layout.tsx`. La landing las consume vía Tailwind (`font-fraunces`, `font-jakarta`) o clases CSS directas.

---

## Secciones — Estructura completa

### 1. Nav
**Comportamiento:** sticky, `backdrop-blur`, borde inferior sutil.

**Contenido:**
- Logo mark (cuadrado redondeado, gradiente verde, letra "N") + texto "NutriPlan" + subtítulo "Tu asistente nutricional"
- Links: Funciones · Cómo funciona · Testimonios
- CTA: "Empezar gratis →" (botón naranja)

**Colores:** fondo `rgba(251,245,238,0.92)`, borde `#EDD5B6`.

---

### 2. Hero asimétrico
**Layout:** `grid-template-columns: 1.35fr 1fr`, gap 32px. Alineación vertical centrada.

**Columna izquierda:**
- Pill badge: "🌿 Nutrición inteligente para Argentina" — fondo `#E3EDDA`, borde `#C8DBB5`, texto `#4A6020`
- `h1` en Fraunces 900: "Comé bien, / sin culpa. / *Vivite mejor.*" — línea 1 negra, línea 2 verde `#5C7A2C`, línea 3 en italic 400 naranja `#D4622A`
- Subtítulo: "Tu asistente con IA: planes personalizados, recetas argentinas y macros precisos. Tu primer plan listo en 12 segundos."
- Botones: primario naranja "🌱 Crear mi plan gratis" + ghost verde "Ver cómo funciona →"
- Trust row: 4 avatares apilados + texto "Usada por **2.400+ argentinos** · 98% de satisfacción"

**Columna derecha (panel verde):**
- Fondo: `linear-gradient(155deg, #E3EDDA, #D0DFC0)`, `border-radius: 20px`
- Stat card blanca: "2.400+" / "usuarios activos hoy" — número en Fraunces
- 3 feature chips: 🧮 Macros calculados al instante · 🍳 Recetas con lo que tenés en casa · 📅 Plan semanal completo en segundos
- Stat card blanca: "12 seg" / "para tu primer plan personalizado"

---

### 3. ¿Cómo funciona? — NUEVA
**Fondo:** `#2C3E1A` (verde bosque oscuro). Contraste alto, sección ancla del nav.

**Encabezado:**
- Label uppercase verde claro: "✦ Simple y rápido"
- `h2` Fraunces 900: "Tres pasos y ya *estás comiendo bien.*" — italic en verde claro `#B8D98A`

**3 pasos en grid (1fr 1fr 1fr):**
- Línea conectora horizontal entre los números (decorativa, `rgba(184,217,138,0.25)`)
- Cada paso: número circular con gradiente verde, `h3` blanco, descripción gris claro

| # | Título | Descripción |
|---|--------|-------------|
| 1 | Completá tu perfil | Objetivo, peso, altura y preferencias. Menos de 2 minutos. |
| 2 | La IA genera tu plan | Menú semanal completo, macros y recetas adaptadas a la cocina argentina. |
| 3 | Cocinás y registrás | Lista de compras automática, registro de comidas y seguimiento de progreso. |

---

### 4. Features (4 tarjetas)
**Layout:** grid 2×2.

**Encabezado:**
- Label: "✦ Todo lo que necesitás"
- `h2` Fraunces: "Herramientas para comer bien, sin que sea un trabajo."
- Subtítulo: "Pensadas para la vida real — no para nutricionistas."

**Tarjetas:**

| Icono | Título | Color fondo | Color borde |
|-------|--------|-------------|-------------|
| 🧮 | Macros personalizados | `#F0E8DC` | `#EDD5B6` |
| 🍳 | Recetas con IA | `#E3EDDA` | `#C8DBB5` |
| 📅 | Plan semanal inteligente | `#FEF3E2` | `#F5DFA0` |
| 📈 | Seguí tu progreso | `#F0E8DC` | `#EDD5B6` |

Cada tarjeta: icono en cuadrado blanco redondeado + `h3` + párrafo descriptivo.

---

### 5. Preview del producto — NUEVA
**Layout:** grid `1fr 1.2fr`. Fondo `#F5EFE8`, borde superior e inferior `#EDD5B6`.

**Columna izquierda (copy):**
- Label: "✦ Lo que recibís"
- `h2` Fraunces: "Tu plan semanal, *listo en segundos.*"
- Párrafo explicativo
- 4 chips: 🥗 Variedad diaria · 🇦🇷 Recetas argentinas · 🛒 Lista de compras · 📊 Macros exactos

**Columna derecha (mockup de pantalla):**
- Contenedor con `border-radius: 16px`, `box-shadow` sutil, borde `#EDD5B6`
- Topbar verde oscuro con logo y semana actual
- 4 filas de días (Lun–Jue) con: nombre del día · 3 comidas por día · badge de kcal totales naranja
- Contenido de ejemplo con comidas argentinas reales (milanesa, locro, fideos con tuco, asado, etc.)

**Implementación:** el mockup es HTML/CSS estático — no consume datos reales de la API.

---

### 6. Testimonios
**Layout:** grid 3 columnas.
**Fondo:** `#FBF5EE`.

**Encabezado:**
- `h2` Fraunces centrado: "Lo que dicen nuestros usuarios"

**3 tarjetas blancas** con borde `#EDD5B6`:
- 5 estrellas naranjas (`#D4622A`)
- Texto en cursiva con resultado concreto
- Avatar circular con inicial + nombre + ciudad + resultado

| Nombre | Ciudad | Resultado |
|--------|--------|-----------|
| Sofía M. | Buenos Aires | Bajó 8kg |
| Diego R. | Rosario | Personal Trainer |
| Laura G. | Córdoba | Bajó 3kg en 3 semanas |

---

### 7. CTA Final + Footer

**CTA Banner:**
- Margin horizontal 28px, `border-radius: 20px`
- Fondo: `linear-gradient(135deg, #3D5A1E, #2C4418)`
- Label: "✦ Empezá ahora"
- `h2` Fraunces: "Tu plan nutricional, *en 12 segundos.*"
- Subtítulo + botón naranja + nota "Sin tarjeta de crédito · Cancelás cuando querés"

**Footer:**
- Flex `space-between`: logo mark + nombre · copyright
- Borde superior `#EDD5B6`

---

## Animaciones

Todas implementadas con CSS puro (sin librerías), usando `animation-delay` escalonado:

- **Nav:** visible inmediatamente
- **Hero:** `fade-in` con `translateY(12px)` — pill (0s), h1 (0.1s), sub (0.2s), botones (0.3s), trust (0.4s), panel derecho (0.2s)
- **Secciones al scroll:** `IntersectionObserver` con clase `.visible` que dispara `opacity: 0 → 1` + `translateY(20px → 0)` en 0.5s ease-out. Aplicar a: pasos de "Cómo funciona", tarjetas de features, mockup de preview, testimonios.

---

## Implementación técnica

### Archivo principal
`apps/web/src/app/page.tsx` — reescritura completa. El archivo actual tiene ~170 líneas; la nueva versión tendrá entre 400–500 líneas. Si supera 500 líneas, extraer secciones a componentes en `apps/web/src/app/_components/landing/`.

### Fuentes en layout.tsx
Agregar `Fraunces` y `Plus_Jakarta_Sans` via `next/font/google`. Las variables se pasan al `<html>` como `className`. Verificar que no rompa las fuentes del resto de la app (las páginas internas no usan `--font-fraunces`).

### Tailwind
Extender `tailwind.config.ts` con:
```js
fontFamily: {
  fraunces: ['var(--font-fraunces)', 'serif'],
  jakarta: ['var(--font-jakarta)', 'sans-serif'],
}
```

### IntersectionObserver
`page.tsx` se mantiene como Server Component para preservar el SEO. Extraer el observer a un componente cliente mínimo: `apps/web/src/app/_components/landing/ScrollReveal.tsx` con `'use client'`. Recibe `children` y agrega/remueve la clase `.visible` cuando el elemento entra al viewport. Las secciones animadas lo usan como wrapper. Esto evita convertir toda la página a client component.

### No usar
- Librerías de animación (Framer Motion, GSAP) — CSS puro es suficiente
- Imágenes externas reales — el mockup de preview es HTML/CSS estático
- Nuevos componentes compartidos — todo en la landing page

---

## Criterios de aceptación

- [ ] `pnpm --filter web build` sin errores TypeScript
- [ ] La página carga en menos de 3s en Lighthouse (las fuentes de Google deben cargarse con `display: swap`)
- [ ] Responsive (`md` = 768px, `lg` = 1024px): en mobile el hero pasa a una columna (copy arriba, panel de stats abajo), "Cómo funciona" a columna única, features a 1 columna, preview a columna única (mockup debajo del copy), testimonios a 1 columna. Nav oculta los links intermedios en mobile, solo muestra logo + CTA.
- [ ] El nav sticky funciona correctamente en scroll
- [ ] Las animaciones de scroll se activan al entrar en el viewport
- [ ] Los links de nav hacen scroll suave a sus secciones (`id="como-funciona"`, `id="features"`, `id="testimonios"`)
