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

export async function getShoppingList(userId: string): Promise<ShoppingListCategory[]> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setUTCDate(today.getUTCDate() + 6);

  const plans = await prisma.nutritionPlan.findMany({
    where: { userId, date: { gte: today, lte: endDate } },
    include: { meals: true },
  });

  type AggKey = string;
  const aggregated = new Map<AggKey, ShoppingListItem>();

  for (const plan of plans) {
    for (const meal of plan.meals) {
      const ingredients = meal.ingredients as Array<{ name: string; quantity: number; unit: string }>;
      for (const ing of ingredients) {
        const key = `${ing.name.trim().toLowerCase()}|${ing.unit}`;
        const existing = aggregated.get(key);
        if (existing) {
          existing.quantity = Math.round((existing.quantity + ing.quantity) * 100) / 100;
        } else {
          aggregated.set(key, { name: ing.name.trim(), quantity: ing.quantity, unit: ing.unit });
        }
      }
    }
  }

  const byCategory = new Map<string, ShoppingListCategory>();
  for (const item of aggregated.values()) {
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
