# NutriPlan — Rediseño de Usabilidad: Mi Semana, Recetas y Preferencias

**Fecha:** 2026-05-27  
**Alcance:** Web (Next.js) + Mobile (Expo)  
**Plataformas:** apps/web · apps/mobile

---

## Problema

El flujo actual tiene tres inconsistencias principales:

1. **Desconexión entre secciones**: "Generar Plan" y "Menú" son páginas separadas que representan lo mismo. El usuario genera un plan, navega al menú y no tiene claro que ya está poblado.
2. **Edición limitada del plan**: Existe el botón "No me gusta" para swappear comidas, pero no se puede ajustar porciones ni agregar comidas propias. Las restricciones alimentarias configuradas en el onboarding no tienen edición posterior.
3. **Recetas mal enfocadas**: La sección de recetas es un generador de recetas con IA, cuando el usuario la necesita como biblioteca de recetas favoritas guardadas.

---

## Solución: Enfoque A — Fusión de secciones

Fusionar "Generar Plan" y "Menú" en una sola sección **"Mi Semana"**. Reconvertir "Recetas" en una biblioteca de favoritos. Agregar edición de preferencias post-onboarding.

---

## Sección 1 — Mi Semana

### Descripción
Reemplaza completamente las páginas `/generate-plan` y `/menu`. Es el centro de operaciones del usuario.

### Layout
- **Header**: título "Mi Semana", badge de restricción alimentaria activa (ej: 🌿 Vegetariano), botón "Generar semana".
- **Tabs**: 7 pestañas horizontales (Lun–Dom), cada una muestra día abreviado y punto indicador. Días sin plan aparecen atenuados.
- **Resumen del día activo**: calorías consumidas / objetivo con barra de progreso; Proteína / Carbohidratos / Grasas en formato `consumido / objetivo g` con nombres completos.
- **Lista de comidas**: cards verticales para Desayuno, Merienda mañana, Almuerzo, Merienda tarde, Cena.

### Estados de comida
| Estado | Visual |
|--------|--------|
| Registrada | Fondo verde claro, badge "✓ Listo" |
| Próxima | Borde verde oliva, label "próxima comida" |
| Pendiente | Opacidad reducida |

### Acciones por comida
- **Cambiar**: llama al endpoint existente `POST /diet/meal/:id/swap/stream` (SSE). Reemplaza la comida con una alternativa que respeta las restricciones activas del usuario.
- **Porción** (solo comida próxima): controles −/+ que modifican un multiplicador local (0.5×, 1×, 1.5×, 2×). Al registrar la comida como consumida, se envía el valor ajustado al log. No modifica el plan guardado.
- **Receta**: navega a la receta guardada de esa comida en "Mis Recetas".
- **Agregar comida propia**: botón al final de la lista. Abre un modal con campo de nombre, kcal, proteína, carbos, grasas. Se agrega al día activo y suma al progreso.

### Generación
- El botón "Generar semana" dispara la generación para los 7 días completos con SSE streaming, igual que el flujo actual de `/diet/generate/week/stream`.
- Al completarse, los 7 tabs se pueblan con los días generados y el tab "HOY" queda activo.
- La generación respeta siempre las preferencias vigentes del perfil del usuario (tipo de dieta, alergias, comidas excluidas).
- Se elimina la página `/generate-plan`.

### Navegación
- La entrada al sidebar/nav cambia de "Menú" → "Mi Semana".
- La entrada "Generar Plan" se elimina del sidebar.

---

## Sección 2 — Mis Recetas

### Descripción
La página `/recipes` se reconvierte de generador a biblioteca personal de recetas guardadas.

### Layout
- Grid de cards (2 columnas en web, 1 en mobile).
- Cada card muestra: emoji de comida, nombre de la receta, macros resumidos (kcal · proteína), botón "Ver preparación".
- Filtros simples: Desayuno / Almuerzo / Merienda / Cena / Todas.
- Estado vacío: "Todavía no tenés recetas guardadas. Generá tu plan semanal y las recetas se guardan solas."

### Guardado automático
- Cuando el plan semanal se genera, las recetas de cada comida se guardan automáticamente (comportamiento ya existente via `autoGenerateRecipes`).
- El usuario puede marcar/desmarcar favoritos con un ícono ⭐ en cada card.
- Desde "Mi Semana", el botón "📋 Receta" de cada comida navega directamente a esa receta en la biblioteca.

### Eliminación
- Se elimina el formulario de generación manual de recetas.
- Se elimina el endpoint SSE de generación de recetas desde la UI (el endpoint del backend se mantiene para uso interno del plan).

---

## Sección 3 — Mi Perfil / Preferencias

### Descripción
Nueva sección accesible desde la sidebar que permite editar toda la configuración del onboarding en cualquier momento.

### Contenido
Mismo wizard de onboarding pero en formato de página de configuración con secciones colapsables:

1. **Datos personales**: nombre, fecha de nacimiento, sexo, altura, peso, nivel de actividad.
2. **Objetivo**: perder peso / mantener / ganar músculo. Muestra el TDEE calculado con el objetivo actual.
3. **Tipo de dieta**: omnívoro, vegetariano, vegano, pescetariano, keto, paleo.
4. **Comidas por día**: 3 / 4 / 5 / 6.
5. **Alergias e intolerancias**: chips seleccionables (igual que onboarding).
6. **Comidas que prefiero evitar**: chips seleccionables.
7. **Cocinas preferidas**: chips seleccionables.

### Comportamiento
- Cada sección tiene su propio botón "Guardar" que llama a `PUT /users/me/profile` o `PUT /users/me/preferences` según corresponda.
- Al guardar, se invalidan las queries de `nutrition-targets` y `diet-current` para reflejar los nuevos objetivos.
- Se muestra un aviso: "Tus cambios se aplicarán la próxima vez que generes el plan."

### Nota de contexto
- El badge de restricción en "Mi Semana" refleja el `dietaryType` activo (ej: 🌿 Vegetariano, 🐟 Pescetariano).

---

## Cambios en navegación (sidebar)

| Antes | Después |
|-------|---------|
| Generar Plan | *(eliminado)* |
| Menú | Mi Semana |
| Recetas | Mis Recetas |
| *(no existía)* | Mi Perfil |
| Dashboard | Dashboard *(sin cambios)* |
| Progreso | Progreso *(sin cambios)* |
| Inventario | Inventario *(sin cambios)* |
| Lista de compras | Lista de compras *(sin cambios)* |

---

## Fuera de alcance

- Rediseño visual/estético (paleta, tipografía, componentes) — se abordará en un spec separado.
- Cambios en el backend / API — los endpoints existentes son suficientes.
- App mobile: misma lógica, se adapta el layout a pantalla chica (tabs con scroll horizontal, cards full-width). Se abordará como sub-tarea de implementación.
- Dashboard: sin cambios de estructura, solo actualizar el link "Generar mi plan con IA" → "Mi Semana".
