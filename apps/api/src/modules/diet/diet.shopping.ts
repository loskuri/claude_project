import { prisma } from '../../config/database.js';

export type ShoppingListItem = {
  name: string;
  quantity: number;
  unit: string;
};

export type ShoppingListCategory = {
  category: string;
  emoji: string;
  items: ShoppingListItem[];
};

const CATEGORIES: Array<{ category: string; emoji: string; keywords: string[] }> = [
  {
    category: 'Carnes y proteínas',
    emoji: '🥩',
    keywords: [
      'pollo', 'carne', 'cerdo', 'pescado', 'atún', 'salmón', 'merluza', 'lenguado',
      'trucha', 'sardina', 'huevo', 'jamón', 'salchicha', 'chorizo', 'morcilla', 'bondiola',
      'lomo', 'bife', 'pavo', 'cordero', 'conejo', 'langostino', 'camarón', 'pechuga',
      'muslo', 'nalga', 'vacío', 'costilla', 'osobuco',
    ],
  },
  {
    category: 'Lácteos',
    emoji: '🥛',
    keywords: [
      'leche', 'yogur', 'queso', 'crema', 'manteca', 'ricota', 'mozzarella',
      'provolone', 'roquefort', 'cheddar', 'kéfir', 'flan',
    ],
  },
  {
    category: 'Verduras y hortalizas',
    emoji: '🥦',
    keywords: [
      'tomate', 'cebolla', 'ajo', 'zanahoria', 'lechuga', 'espinaca', 'zapallo', 'brócoli',
      'choclo', 'pepino', 'apio', 'pimiento', 'berenjena', 'papa', 'batata', 'rúcula',
      'acelga', 'repollo', 'coliflor', 'remolacha', 'puerro', 'champiñón', 'hongo',
      'zucchini', 'chaucha', 'radicheta', 'verdeo', 'perejil', 'cilantro', 'albahaca',
      'palta', 'aguacate', 'calabaza', 'calabacín',
    ],
  },
  {
    category: 'Frutas',
    emoji: '🍎',
    keywords: [
      'banana', 'manzana', 'naranja', 'pera', 'uva', 'frutilla', 'durazno', 'kiwi',
      'limón', 'melón', 'sandía', 'mandarina', 'ananá', 'mango', 'ciruela', 'cereza',
      'frambuesa', 'arándano', 'pomelo', 'maracuyá', 'higo', 'dátil',
    ],
  },
  {
    category: 'Cereales y panificados',
    emoji: '🌾',
    keywords: [
      'arroz', 'pasta', 'fideos', 'pan', 'avena', 'harina', 'polenta', 'quinoa', 'trigo',
      'cebada', 'centeno', 'maíz', 'tortilla', 'galleta', 'tostada', 'pan rallado',
      'copos', 'granola', 'müsli', 'sémola',
    ],
  },
  {
    category: 'Legumbres',
    emoji: '🫘',
    keywords: ['lenteja', 'garbanzo', 'poroto', 'soja', 'arveja', 'haba', 'edamame'],
  },
  {
    category: 'Aceites y condimentos',
    emoji: '🫙',
    keywords: [
      'aceite', 'sal', 'pimienta', 'azúcar', 'vinagre', 'mostaza', 'mayonesa', 'ketchup',
      'salsa', 'orégano', 'pimentón', 'comino', 'cúrcuma', 'canela', 'tomillo', 'romero',
      'laurel', 'ají', 'miel', 'mermelada', 'caldo', 'curry', 'jengibre', 'nuez moscada',
      'almíbar', 'concentrado',
    ],
  },
  {
    category: 'Bebidas e infusiones',
    emoji: '☕',
    keywords: ['café', 'té', 'infusión', 'mate', 'yerba'],
  },
  {
    category: 'Frutas secas y semillas',
    emoji: '🥜',
    keywords: [
      'nuez', 'almendra', 'maní', 'semilla', 'chía', 'lino', 'girasol', 'sésamo',
      'pistacio', 'cajú', 'castaña', 'pecán',
    ],
  },
];

function categorize(name: string): { category: string; emoji: string } {
  const lower = name.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => lower.includes(kw))) {
      return { category: cat.category, emoji: cat.emoji };
    }
  }
  return { category: 'Otros', emoji: '🛒' };
}

const UNIT_MAP: Record<string, string> = {
  g: 'g', gr: 'g', gramo: 'g', gramos: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilo: 'kg', kilos: 'kg', kilogramo: 'kg', kilogramos: 'kg',
  ml: 'ml', mililitro: 'ml', mililitros: 'ml', milliliter: 'ml',
  l: 'L', litro: 'L', litros: 'L', liter: 'L',
  u: 'u', unidad: 'u', unidades: 'u', unit: 'u', units: 'u',
  pieza: 'u', piezas: 'u', trozo: 'u', trozos: 'u',
  lata: 'u', latas: 'u', botella: 'u', botellas: 'u',
  pote: 'u', potes: 'u', feta: 'u', fetas: 'u',
  rebanada: 'u', rebanadas: 'u', lonja: 'u', lonjas: 'u',
  taza: 'taza', tazas: 'taza',
  cda: 'cda', cucharada: 'cda', cucharadas: 'cda',
  cdta: 'cdta', cucharadita: 'cdta', cucharaditas: 'cdta',
};

function normalizeUnit(raw: string): string {
  return UNIT_MAP[raw.trim().toLowerCase()] ?? 'u';
}

function resolveUnit(rawUnit: string, ingredientName: string): string {
  const canonical = UNIT_MAP[rawUnit.trim().toLowerCase()];
  if (canonical) return canonical;
  // unknown unit: count-based items use 'u', bulk ingredients default to 'g'
  return isCountBased(ingredientName) ? 'u' : 'g';
}

const COUNT_BASED_KEYWORDS = [
  'huevo', 'banana', 'manzana', 'naranja', 'pera', 'limón', 'limon',
  'durazno', 'ciruela', 'kiwi', 'mandarina', 'pan de molde', 'baguette',
  'lata', 'botella', 'pote', 'yogur', 'flan',
];

// Typical weight in grams for one unit of each count-based ingredient
const GRAMS_PER_UNIT: Array<[string, number]> = [
  ['huevo', 55],
  ['banana', 120],
  ['manzana', 150],
  ['naranja', 180],
  ['pera', 160],
  ['limón', 80],
  ['limon', 80],
  ['durazno', 130],
  ['ciruela', 60],
  ['kiwi', 70],
  ['mandarina', 100],
  ['yogur', 200],
  ['flan', 90],
  ['lata', 400],
  ['pote', 200],
];

// Typical volume in ml for one unit of each count-based ingredient
const ML_PER_UNIT: Array<[string, number]> = [
  ['yogur', 200],
  ['flan', 90],
  ['botella', 750],
  ['pote', 200],
];

// Maps ingredient name keywords to canonical shopping names.
// ORDER MATTERS: more specific patterns must come before generic ones.
const NAME_NORMALIZATIONS: Array<[string, string]> = [
  // Bebidas con leche → extraer la leche como ingrediente de compra
  ['café con leche descremada', 'Leche descremada'],
  ['café con leche desnatada', 'Leche descremada'],
  ['café con leche', 'Leche'],
  // Café (variantes antes del genérico)
  ['café descafeinado', 'Café descafeinado'],
  // Caldos (antes de 'pollo', 'carne', 'verdura')
  ['caldo de pollo', 'Caldo de pollo'],
  ['caldo de carne', 'Caldo de carne'],
  ['caldo de verdura', 'Caldo de verduras'],
  // Leche (específico antes de genérico)
  ['leche descremada', 'Leche descremada'],
  ['leche desnatada', 'Leche descremada'],
  ['leche entera', 'Leche entera'],
  // Aceite (específico antes de genérico)
  ['aceite de girasol', 'Aceite de girasol'],
  ['aceite de oliva', 'Aceite de oliva'],
  // Tomate (procesado antes de fresco para que no se mezclen)
  ['tomate enlatado', 'Tomate enlatado'],
  ['tomate triturado', 'Tomate triturado'],
  ['tomate', 'Tomate'],
  // Maíz (enlatado antes de fresco)
  ['maíz enlatado', 'Maíz enlatado'],
  ['maiz enlatado', 'Maíz enlatado'],
  ['maíz', 'Maíz'],
  ['maiz', 'Maíz'],
  // Arroz (específico antes de genérico)
  ['arroz blanco', 'Arroz blanco'],
  ['arroz integral', 'Arroz integral'],
  ['arroz', 'Arroz'],
  // Pan (específico antes de genérico)
  ['pan de sándwich integral', 'Pan integral'],
  ['pan sandwich integral', 'Pan integral'],
  ['pan integral', 'Pan integral'],
  ['pan de molde', 'Pan'],
  ['pan blanco', 'Pan'],
  // Carne molida
  ['carne molida', 'Carne molida'],
  ['carne picada', 'Carne molida'],
  // Pollo (después de 'caldo de pollo')
  ['pechuga de pollo', 'Pollo'],
  ['pollo', 'Pollo'],
  // Queso de sándwich
  ['queso de sándwich', 'Queso de sándwich'],
  ['queso tipo sándwich', 'Queso de sándwich'],
  ['queso sandwich', 'Queso de sándwich'],
  // Verduras
  ['papa', 'Papa'],
  ['zanahoria', 'Zanahoria'],
  ['zapallo', 'Zapallo'],
  ['granola', 'Granola'],
  // Condimentos
  ['mayonesa', 'Mayonesa'],
  ['miel', 'Miel'],
  ['paprika', 'Pimentón'],
  ['mantequilla', 'Manteca'],
  // Frutas contables
  ['banana', 'Banana'],
  ['plátano', 'Banana'],
  ['platano', 'Banana'],
  ['limón', 'Limón'],
  ['limon', 'Limón'],
  // Lácteos contables
  ['huevo', 'Huevo'],
  ['yogur', 'Yogur'],
  ['flan', 'Flan'],
  // Bebidas
  ['café', 'Café'],
  ['cafe', 'Café'],
  ['té', 'Té'],
];

function isCountBased(name: string): boolean {
  const lower = name.toLowerCase();
  return COUNT_BASED_KEYWORDS.some((kw) => lower.includes(kw));
}

function gramsToUnits(name: string, grams: number): number | null {
  const lower = name.toLowerCase();
  const entry = GRAMS_PER_UNIT.find(([kw]) => lower.includes(kw));
  if (!entry) return null;
  return Math.max(1, Math.ceil(grams / entry[1]));
}

function mlToUnits(name: string, ml: number): number | null {
  const lower = name.toLowerCase();
  const entry = ML_PER_UNIT.find(([kw]) => lower.includes(kw));
  if (!entry) return null;
  return Math.max(1, Math.ceil(ml / entry[1]));
}

export function canonicalizeName(name: string): string {
  const lower = name.toLowerCase().trim();
  for (const [kw, canonical] of NAME_NORMALIZATIONS) {
    if (lower.includes(kw)) return canonical;
  }
  return name.trim();
}

function normalizeItem(item: ShoppingListItem): ShoppingListItem {
  let { name, quantity, unit } = item;

  // 1. Count-based items: convert to integer unit count
  if (isCountBased(name)) {
    if (unit === 'g' || unit === 'kg') {
      const grams = unit === 'kg' ? quantity * 1000 : quantity;
      const units = gramsToUnits(name, grams);
      if (units !== null) return { name, quantity: units, unit: 'u' };
      return { name, quantity: Math.round(grams), unit: 'g' };
    }
    if (unit === 'ml' || unit === 'L') {
      const ml = unit === 'L' ? quantity * 1000 : quantity;
      const units = mlToUnits(name, ml);
      if (units !== null) return { name, quantity: units, unit: 'u' };
      return { name, quantity: Math.round(ml), unit: 'ml' };
    }
    return { name, quantity: Math.ceil(quantity), unit: 'u' };
  }

  // 2. Scale conversion: g→kg and ml→L when quantity >= 1000
  if (unit === 'g' && quantity >= 1000) {
    quantity = Math.round((quantity / 1000) * 10) / 10;
    unit = 'kg';
  } else if (unit === 'ml' && quantity >= 1000) {
    quantity = Math.round((quantity / 1000) * 10) / 10;
    unit = 'L';
  }

  // 3. Minimum useful quantities — prevent absurd small values
  if (unit === 'g' && quantity < 5) {
    quantity = 5;
  } else if (unit === 'ml' && quantity < 10) {
    quantity = 10;
  } else if (unit === 'kg' && quantity < 0.05) {
    quantity = 5;
    unit = 'g';
  } else if (unit === 'L' && quantity < 0.05) {
    quantity = 10;
    unit = 'ml';
  }

  // 4. Final rounding by unit type
  if (unit === 'u' || unit === 'taza' || unit === 'cda' || unit === 'cdta') {
    quantity = Math.ceil(quantity);
  } else if (unit === 'kg' || unit === 'L') {
    quantity = Math.round(quantity * 10) / 10;
  } else {
    quantity = Math.round(quantity);
  }

  return { name, quantity, unit };
}

export async function getShoppingList(userId: string, localDateStr?: string): Promise<ShoppingListCategory[]> {
  const today = localDateStr ? new Date(`${localDateStr}T00:00:00.000Z`) : new Date();
  if (!localDateStr) today.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setUTCDate(today.getUTCDate() + 6);

  const plans = await prisma.nutritionPlan.findMany({
    where: { userId, date: { gte: today, lte: endDate } },
    include: { meals: true },
  });

  // Aggregate with canonical units so "gramos"/"g"/"gr" all land in the same bucket
  type AggKey = string;
  const aggregated = new Map<AggKey, ShoppingListItem>();

  for (const plan of plans) {
    for (const meal of plan.meals) {
      const ingredients = meal.ingredients as Array<{ name: string; quantity: number; unit: string }>;
      for (const ing of ingredients) {
        const canonicalName = canonicalizeName(ing.name);
        const canonicalUnit = resolveUnit(ing.unit, canonicalName);
        // Aggregate in base units (g, ml) so that g and kg of the same ingredient merge
        let aggQty = ing.quantity;
        let aggUnit = canonicalUnit;
        if (canonicalUnit === 'kg') { aggQty = ing.quantity * 1000; aggUnit = 'g'; }
        else if (canonicalUnit === 'L') { aggQty = ing.quantity * 1000; aggUnit = 'ml'; }
        const key = `${canonicalName.toLowerCase()}|${aggUnit}`;
        const existing = aggregated.get(key);
        if (existing) {
          existing.quantity = Math.round((existing.quantity + aggQty) * 100) / 100;
        } else {
          aggregated.set(key, { name: canonicalName, quantity: aggQty, unit: aggUnit });
        }
      }
    }
  }

  // Normalize each aggregated item (scale, minimums, rounding)
  // Re-aggregate after normalization: count-based items may change unit to 'u',
  // merging items that were previously split by different units
  const normalized = new Map<AggKey, ShoppingListItem>();
  for (const item of aggregated.values()) {
    const norm = normalizeItem(item);
    const key = `${norm.name.toLowerCase()}|${norm.unit}`;
    const existing = normalized.get(key);
    if (existing) {
      existing.quantity = Math.round((existing.quantity + norm.quantity) * 100) / 100;
    } else {
      normalized.set(key, { ...norm });
    }
  }

  // Final rounding pass after any post-normalization re-aggregation
  const finalItems = Array.from(normalized.values()).map(normalizeItem);

  const byCategory = new Map<string, ShoppingListCategory>();
  for (const item of finalItems) {
    const { category, emoji } = categorize(item.name);
    const existing = byCategory.get(category);
    if (existing) {
      existing.items.push(item);
    } else {
      byCategory.set(category, { category, emoji, items: [item] });
    }
  }

  const order = [...CATEGORIES.map((c) => c.category), 'Otros'];
  return order
    .map((cat) => byCategory.get(cat))
    .filter((c): c is ShoppingListCategory => c != null)
    .map((c) => ({ ...c, items: c.items.sort((a, b) => a.name.localeCompare(b.name)) }));
}
