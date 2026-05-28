# Shopping List — Normalización de Unidades y Cantidades

**Fecha:** 2026-05-28  
**Alcance:** Backend (`apps/api`) + Web frontend (`apps/web`) — display tweak  
**Archivo principal:** `apps/api/src/modules/diet/diet.shopping.ts`

---

## Problema

El servicio `getShoppingList()` agrega los ingredientes del plan semanal sin normalizar las unidades ni las cantidades que genera la IA. Esto produce:

1. **Unidades inconsistentes**: la IA puede escribir `"gramos"`, `"g"`, `"gr"` para el mismo concepto → tres ítems separados en vez de uno sumado.
2. **Cantidades absurdas**: `0.2 ml de leche`, `0.003 kg de arroz`, `0.7 huevos`.
3. **Mismo ingrediente con distintas unidades**: `"leche: 200 ml"` + `"leche: 0.5 litros"` → dos ítems en vez de uno.
4. **Fracciones de ítems contables**: `0.5 huevos`, `1.3 bananas`.

---

## Solución

Agregar una etapa de normalización en el pipeline de `getShoppingList()`, entre la agregación y la categorización. Sin cambios en la API (mismo contrato), sin cambios en el schema de la base de datos.

### Pipeline actualizado

```
ingredientes del plan semanal
  ↓ normalizeUnit() — estandariza texto libre a unidad canónica
  ↓ re-agregar con key name|unidad_canónica
  ↓ normalizeItem() por cada ítem — escala + mínimos + count-based
  ↓ categorizar y ordenar
  → respuesta al cliente
```

---

## Componentes

### 1. `normalizeUnit(raw: string): string`

Mapea variantes de texto libre a unidades canónicas. Case-insensitive. Si no reconoce la unidad, devuelve `"u"` (unidad genérica).

| Entrada (variantes) | Salida canónica |
|---------------------|-----------------|
| `g`, `gr`, `gramo`, `gramos`, `gram`, `grams` | `g` |
| `kg`, `kilo`, `kilos`, `kilogramo`, `kilogramos` | `kg` |
| `ml`, `mililitro`, `mililitros`, `milliliter` | `ml` |
| `L`, `l`, `litro`, `litros`, `liter` | `L` |
| `u`, `unidad`, `unidades`, `unit`, `units`, `pieza`, `piezas`, `trozo`, `trozos`, `lata`, `latas`, `botella`, `botellas`, `pote`, `potes`, `feta`, `fetas`, `rebanada`, `rebanadas`, `lonja`, `lonjas` | `u` |
| `taza`, `tazas` | `taza` |
| `cda`, `cucharada`, `cucharadas` | `cda` |
| `cdta`, `cucharadita`, `cucharaditas` | `cdta` |
| cualquier otro | `u` |

### 2. `isCountBased(name: string): boolean`

Devuelve `true` si el ingrediente se compra por unidad. Compara contra keywords (match parcial, case-insensitive).

Keywords count-based: `huevo`, `banana`, `manzana`, `naranja`, `pera`, `limón`, `limon`, `durazno`, `ciruela`, `kiwi`, `mandarina`, `pan de molde`, `baguette`, `lata`, `botella`, `pote`, `yogur`, `flan`.

**Nota:** ingredientes como `queso`, `leche`, `harina` NO son count-based — se miden en g/ml/kg.

### 3. `normalizeItem(item: ShoppingListItem): ShoppingListItem`

Aplica en este orden:

1. **Si `isCountBased(name)` y unit ≠ `"u"`**: ignorar la unidad de la IA, forzar `unit = "u"` y `quantity = Math.ceil(quantity)`. *Razón: la IA a veces pone `"huevo: 150g"` siendo que un huevo es ~60g. Lo correcto para el supermercado es "3 huevos".*

2. **Conversión de escala** (solo para g/ml):
   - `quantity ≥ 1000` y `unit = "g"` → dividir por 1000, `unit = "kg"`, redondear a 1 decimal.
   - `quantity ≥ 1000` y `unit = "ml"` → dividir por 1000, `unit = "L"`, redondear a 1 decimal.

3. **Mínimos útiles** (cantidades demasiado pequeñas para ser de utilidad):
   - `unit = "g"` y `quantity < 5` → `quantity = 5`.
   - `unit = "ml"` y `quantity < 10` → `quantity = 10`.
   - `unit = "kg"` y `quantity < 0.05` → convertir a gramos, aplicar mínimo 5g.
   - `unit = "L"` y `quantity < 0.05` → convertir a ml, aplicar mínimo 10ml.

4. **Redondeo final**:
   - `unit = "u"`, `taza`, `cda`, `cdta` → `Math.ceil()` (siempre entero hacia arriba).
   - `unit = "kg"` o `"L"` → 1 decimal (e.g., 0.5 kg).
   - `unit = "g"` o `"ml"` → entero (`Math.round()`).

### 4. Re-agregación post-normalización

Después de normalizar unidades, se vuelve a agregar con key `name|unidad_canónica` para que `"leche: 200ml"` + `"leche: 0.5 litros"` queden como un solo ítem `"leche: 700ml"` → luego `"leche: 0.7L"`.

### 5. Frontend: `formatQty()` — tweak cosmético

```typescript
// Antes:
function formatQty(quantity: number, unit: string): string {
  const q = quantity % 1 === 0 ? quantity : parseFloat(quantity.toFixed(1));
  return `${q} ${unit}`;
}

// Después:
function formatQty(quantity: number, unit: string): string {
  const display = unit === 'u' ? 'unidades' : unit;
  const q = Number.isInteger(quantity) ? quantity : parseFloat(quantity.toFixed(1));
  if (unit === 'u') return `${quantity} ${display}`;
  return `${q} ${display}`;
}
```

---

## Fuera de alcance

- Cambios en el schema de Prisma o en la tabla de ingredientes.
- Edición manual de la lista de compras por el usuario.
- Detección de marca o presentación (ej: "leche La Serenísima 1L").
- Integración con precios o supermercados.

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `apps/api/src/modules/diet/diet.shopping.ts` | Agregar `normalizeUnit`, `isCountBased`, `normalizeItem`; actualizar `getShoppingList()` |
| `apps/web/src/app/(app)/shopping-list/page.tsx` | Actualizar `formatQty()` |
