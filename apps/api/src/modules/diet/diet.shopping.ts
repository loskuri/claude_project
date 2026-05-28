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
      'pollo', 'carne', 'res', 'cerdo', 'pescado', 'atún', 'salmón', 'merluza', 'lenguado',
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
      'palta', 'aguacate',
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

const COUNT_BASED_KEYWORDS = [
  'huevo', 'banana', 'manzana', 'naranja', 'pera', 'limón', 'limon',
  'durazno', 'ciruela', 'kiwi', 'mandarina', 'pan de molde', 'baguette',
  'lata', 'botella', 'pote', 'yogur', 'flan',
];

function isCountBased(name: string): boolean {
  const lower = name.toLowerCase();
  return COUNT_BASED_KEYWORDS.some((kw) => lower.includes(kw));
}

function normalizeItem(item: ShoppingListItem): ShoppingListItem {
  let { name, quantity, unit } = item;

  // 1. Count-based items: ignore AI unit, force integer count
  if (isCountBased(name) && unit !== 'u') {
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

export async function getShoppingList(userId: string): Promise<ShoppingListCategory[]> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
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
        const canonicalUnit = normalizeUnit(ing.unit);
        const key = `${ing.name.trim().toLowerCase()}|${canonicalUnit}`;
        const existing = aggregated.get(key);
        if (existing) {
          existing.quantity = Math.round((existing.quantity + ing.quantity) * 100) / 100;
        } else {
          aggregated.set(key, { name: ing.name.trim(), quantity: ing.quantity, unit: canonicalUnit });
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
      existing.quantity += norm.quantity;
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
