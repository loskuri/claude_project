import type { PrismaClient } from '@prisma/client';

const ARGENTINE_FOODS = [
  // ─── Carnes ───────────────────────────────────────────────
  { name: 'Asado de tira', nameEs: 'Asado de tira', category: 'Carnes', calories: 289, proteinG: 26.1, carbsG: 0, fatG: 20.2 },
  { name: 'Vacío de res', nameEs: 'Vacío de res', category: 'Carnes', calories: 214, proteinG: 28.0, carbsG: 0, fatG: 11.2 },
  { name: 'Milanesa de ternera', nameEs: 'Milanesa de ternera', category: 'Carnes', calories: 220, proteinG: 24.0, carbsG: 10.0, fatG: 9.0 },
  { name: 'Matambre de res', nameEs: 'Matambre de res', category: 'Carnes', calories: 250, proteinG: 27.0, carbsG: 0, fatG: 15.0 },
  { name: 'Chorizo criollo', nameEs: 'Chorizo criollo', category: 'Carnes', calories: 340, proteinG: 19.0, carbsG: 1.0, fatG: 29.0 },
  { name: 'Morcilla', nameEs: 'Morcilla', category: 'Carnes', calories: 370, proteinG: 16.0, carbsG: 3.0, fatG: 32.0 },
  { name: 'Pollo entero', nameEs: 'Pollo entero', category: 'Aves', calories: 215, proteinG: 18.0, carbsG: 0, fatG: 15.0 },
  { name: 'Pechuga de pollo sin piel', nameEs: 'Pechuga de pollo sin piel', category: 'Aves', calories: 165, proteinG: 31.0, carbsG: 0, fatG: 3.6 },
  { name: 'Muslos de pollo', nameEs: 'Muslos de pollo', category: 'Aves', calories: 209, proteinG: 26.0, carbsG: 0, fatG: 11.5 },
  // ─── Pescados ─────────────────────────────────────────────
  { name: 'Merluza', nameEs: 'Merluza', category: 'Pescados', calories: 90, proteinG: 18.0, carbsG: 0, fatG: 2.0 },
  { name: 'Pejerrey', nameEs: 'Pejerrey', category: 'Pescados', calories: 96, proteinG: 19.0, carbsG: 0, fatG: 2.2 },
  { name: 'Atún en agua (lata)', nameEs: 'Atún en agua (lata)', category: 'Pescados', calories: 116, proteinG: 25.5, carbsG: 0, fatG: 1.0 },
  // ─── Lácteos con barcodes ─────────────────────────────────
  { name: 'Leche entera La Serenísima', nameEs: 'Leche entera La Serenísima', category: 'Lácteos', barcode: '7790315005033', calories: 61, proteinG: 3.2, carbsG: 4.8, fatG: 3.2 },
  { name: 'Leche descremada La Serenísima', nameEs: 'Leche descremada La Serenísima', category: 'Lácteos', barcode: '7790315005040', calories: 35, proteinG: 3.5, carbsG: 5.0, fatG: 0.1 },
  { name: 'Yogur natural Danone', nameEs: 'Yogur natural Danone', category: 'Lácteos', barcode: '7791337001017', calories: 57, proteinG: 5.5, carbsG: 7.8, fatG: 0.2 },
  { name: 'Yogur bebible Actimel', nameEs: 'Yogur bebible Actimel', category: 'Lácteos', barcode: '7791337024016', calories: 76, proteinG: 3.0, carbsG: 13.0, fatG: 1.2 },
  { name: 'Queso fresco Manfrey', nameEs: 'Queso fresco Manfrey', category: 'Lácteos', barcode: '7793790003458', calories: 264, proteinG: 18.0, carbsG: 2.0, fatG: 21.0 },
  { name: 'Queso cremoso Ilolay', nameEs: 'Queso cremoso Ilolay', category: 'Lácteos', barcode: '7794190001103', calories: 330, proteinG: 20.0, carbsG: 1.5, fatG: 27.0 },
  { name: 'Dulce de leche La Serenísima', nameEs: 'Dulce de leche La Serenísima', category: 'Dulces', barcode: '7790315020951', calories: 320, proteinG: 6.5, carbsG: 55.0, fatG: 8.0 },
  { name: 'Crema de leche La Serenísima', nameEs: 'Crema de leche La Serenísima', category: 'Lácteos', barcode: '7790315001745', calories: 298, proteinG: 2.5, carbsG: 3.4, fatG: 31.0 },
  // ─── Panificados ──────────────────────────────────────────
  { name: 'Pan francés', nameEs: 'Pan francés', category: 'Panificados', calories: 270, proteinG: 9.0, carbsG: 54.0, fatG: 2.5 },
  { name: 'Medialunas de manteca', nameEs: 'Medialunas de manteca', category: 'Panificados', calories: 380, proteinG: 7.0, carbsG: 50.0, fatG: 17.0 },
  { name: 'Facturas surtidas', nameEs: 'Facturas surtidas', category: 'Panificados', calories: 340, proteinG: 7.0, carbsG: 48.0, fatG: 14.0 },
  { name: 'Empanada de carne', nameEs: 'Empanada de carne', category: 'Comidas', calories: 310, proteinG: 13.0, carbsG: 28.0, fatG: 16.0 },
  { name: 'Empanada de queso y jamón', nameEs: 'Empanada de queso y jamón', category: 'Comidas', calories: 280, proteinG: 12.0, carbsG: 28.0, fatG: 14.0 },
  // ─── Cereales y pastas con barcodes ───────────────────────
  { name: 'Arroz largo fino Gallo Oro', nameEs: 'Arroz largo fino Gallo Oro', category: 'Cereales', barcode: '7792361000125', calories: 360, proteinG: 7.0, carbsG: 79.0, fatG: 0.5 },
  { name: 'Fideos Canale spaghetti', nameEs: 'Fideos Canale spaghetti', category: 'Cereales', barcode: '7791290000117', calories: 348, proteinG: 12.5, carbsG: 70.0, fatG: 1.4 },
  { name: 'Fideos Matarazzo moño', nameEs: 'Fideos Matarazzo moño', category: 'Cereales', barcode: '7791290001046', calories: 350, proteinG: 12.0, carbsG: 70.5, fatG: 1.5 },
  { name: 'Polenta Instantánea Instantina', nameEs: 'Polenta Instantánea Instantina', category: 'Cereales', barcode: '7790380001018', calories: 340, proteinG: 8.0, carbsG: 72.0, fatG: 2.0 },
  { name: 'Avena Quaker', nameEs: 'Avena Quaker', category: 'Cereales', barcode: '7793510000010', calories: 375, proteinG: 13.5, carbsG: 63.0, fatG: 7.5 },
  { name: 'Lentejas secas Dos Anclas', nameEs: 'Lentejas secas Dos Anclas', category: 'Legumbres', barcode: '7790280000109', calories: 353, proteinG: 24.0, carbsG: 60.0, fatG: 1.1 },
  { name: 'Porotos negros Dos Anclas', nameEs: 'Porotos negros Dos Anclas', category: 'Legumbres', barcode: '7790280000291', calories: 341, proteinG: 21.0, carbsG: 62.0, fatG: 1.4 },
  { name: 'Garbanzos Dos Anclas', nameEs: 'Garbanzos Dos Anclas', category: 'Legumbres', barcode: '7790280000116', calories: 364, proteinG: 19.0, carbsG: 61.0, fatG: 6.0 },
  // ─── Galletitas con barcodes ──────────────────────────────
  { name: 'Galletitas Oreo', nameEs: 'Galletitas Oreo', category: 'Galletitas', barcode: '7622300489076', calories: 471, proteinG: 5.0, carbsG: 70.0, fatG: 20.0 },
  { name: 'Galletitas Tita', nameEs: 'Galletitas Tita', category: 'Galletitas', barcode: '7790040010050', calories: 460, proteinG: 6.0, carbsG: 69.0, fatG: 19.0 },
  { name: 'Galletitas Vocación', nameEs: 'Galletitas Vocación', category: 'Galletitas', barcode: '7790040120025', calories: 415, proteinG: 9.0, carbsG: 71.0, fatG: 12.0 },
  { name: 'Galletitas Lincoln', nameEs: 'Galletitas Lincoln', category: 'Galletitas', barcode: '7790040002062', calories: 430, proteinG: 9.0, carbsG: 68.0, fatG: 15.0 },
  { name: 'Alfajor Havanna maicena', nameEs: 'Alfajor Havanna maicena', category: 'Postres', barcode: '7790258000019', calories: 380, proteinG: 5.0, carbsG: 60.0, fatG: 14.0 },
  { name: 'Alfajor Milka triple', nameEs: 'Alfajor Milka triple', category: 'Postres', barcode: '7622210720023', calories: 490, proteinG: 6.0, carbsG: 65.0, fatG: 23.0 },
  // ─── Aceites y condimentos con barcodes ───────────────────
  { name: 'Aceite de girasol Cocinero', nameEs: 'Aceite de girasol Cocinero', category: 'Aceites', barcode: '7790250031005', calories: 884, proteinG: 0, carbsG: 0, fatG: 100 },
  { name: 'Aceite de oliva Carbonell', nameEs: 'Aceite de oliva Carbonell', category: 'Aceites', barcode: '8410041010115', calories: 884, proteinG: 0, carbsG: 0, fatG: 100 },
  { name: 'Manteca La Serenísima', nameEs: 'Manteca La Serenísima', category: 'Lácteos', barcode: '7790315000038', calories: 717, proteinG: 0.9, carbsG: 0.1, fatG: 81.0 },
  { name: 'Mayonesa Hellmann\'s', nameEs: 'Mayonesa Hellmann\'s', category: 'Condimentos', barcode: '7791290010049', calories: 680, proteinG: 1.0, carbsG: 2.0, fatG: 75.0 },
  // ─── Bebidas con barcodes ─────────────────────────────────
  { name: 'Coca-Cola 237ml', nameEs: 'Coca-Cola 237ml', category: 'Bebidas', barcode: '7790895004007', calories: 42, proteinG: 0, carbsG: 10.6, fatG: 0 },
  { name: 'Agua Villavicencio 500ml', nameEs: 'Agua Villavicencio 500ml', category: 'Bebidas', barcode: '7791293000101', calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  { name: 'Jugo Cepita naranja 200ml', nameEs: 'Jugo Cepita naranja 200ml', category: 'Bebidas', barcode: '7791290020574', calories: 46, proteinG: 0.5, carbsG: 11.0, fatG: 0 },
  { name: 'Gatorade naranja 500ml', nameEs: 'Gatorade naranja 500ml', category: 'Bebidas', barcode: '7790895061628', calories: 25, proteinG: 0, carbsG: 6.0, fatG: 0 },
  { name: 'Yerba mate Taragüi', nameEs: 'Yerba mate Taragüi', category: 'Bebidas', barcode: '7790864000019', calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  // ─── Verduras típicas ─────────────────────────────────────
  { name: 'Zapallo', nameEs: 'Zapallo', category: 'Verduras', calories: 26, proteinG: 1.0, carbsG: 6.5, fatG: 0.1 },
  { name: 'Choclo', nameEs: 'Choclo', category: 'Verduras', calories: 86, proteinG: 3.2, carbsG: 19.0, fatG: 1.2 },
  { name: 'Berenjena', nameEs: 'Berenjena', category: 'Verduras', calories: 25, proteinG: 1.0, carbsG: 5.9, fatG: 0.2 },
  { name: 'Morrón rojo', nameEs: 'Morrón rojo', category: 'Verduras', calories: 31, proteinG: 1.0, carbsG: 7.0, fatG: 0.3 },
  { name: 'Cebolla', nameEs: 'Cebolla', category: 'Verduras', calories: 40, proteinG: 1.1, carbsG: 9.3, fatG: 0.1 },
  { name: 'Tomate', nameEs: 'Tomate', category: 'Verduras', calories: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2 },
  { name: 'Lechuga', nameEs: 'Lechuga', category: 'Verduras', calories: 15, proteinG: 1.4, carbsG: 2.2, fatG: 0.2 },
  { name: 'Papa', nameEs: 'Papa', category: 'Verduras', calories: 77, proteinG: 2.0, carbsG: 17.0, fatG: 0.1 },
  { name: 'Boniato/Batata', nameEs: 'Batata', category: 'Verduras', calories: 86, proteinG: 1.6, carbsG: 20.0, fatG: 0.1 },
  { name: 'Espinaca', nameEs: 'Espinaca', category: 'Verduras', calories: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4 },
  { name: 'Brócoli', nameEs: 'Brócoli', category: 'Verduras', calories: 34, proteinG: 2.8, carbsG: 7.0, fatG: 0.4 },
  { name: 'Zanahoria', nameEs: 'Zanahoria', category: 'Verduras', calories: 41, proteinG: 0.9, carbsG: 10.0, fatG: 0.2 },
  { name: 'Ajo', nameEs: 'Ajo', category: 'Verduras', calories: 149, proteinG: 6.4, carbsG: 33.1, fatG: 0.5 },
  // ─── Frutas ───────────────────────────────────────────────
  { name: 'Manzana', nameEs: 'Manzana', category: 'Frutas', calories: 52, proteinG: 0.3, carbsG: 14.0, fatG: 0.2 },
  { name: 'Banana', nameEs: 'Banana', category: 'Frutas', calories: 89, proteinG: 1.1, carbsG: 23.0, fatG: 0.3 },
  { name: 'Naranja', nameEs: 'Naranja', category: 'Frutas', calories: 47, proteinG: 0.9, carbsG: 12.0, fatG: 0.1 },
  { name: 'Pera', nameEs: 'Pera', category: 'Frutas', calories: 57, proteinG: 0.4, carbsG: 15.0, fatG: 0.1 },
  { name: 'Uvas', nameEs: 'Uvas', category: 'Frutas', calories: 69, proteinG: 0.7, carbsG: 18.0, fatG: 0.2 },
  { name: 'Durazno', nameEs: 'Durazno', category: 'Frutas', calories: 39, proteinG: 0.9, carbsG: 10.0, fatG: 0.3 },
  { name: 'Sandía', nameEs: 'Sandía', category: 'Frutas', calories: 30, proteinG: 0.6, carbsG: 7.6, fatG: 0.2 },
  { name: 'Mandarina', nameEs: 'Mandarina', category: 'Frutas', calories: 53, proteinG: 0.8, carbsG: 13.3, fatG: 0.3 },
  // ─── Enlatados con barcodes ───────────────────────────────
  { name: 'Atún La Campagnola al natural', nameEs: 'Atún La Campagnola al natural', category: 'Pescados', barcode: '7790215101083', calories: 110, proteinG: 25.0, carbsG: 0, fatG: 1.0 },
  { name: 'Tomates perita La Campagnola', nameEs: 'Tomates perita La Campagnola', category: 'Verduras', barcode: '7790215010033', calories: 20, proteinG: 1.0, carbsG: 4.0, fatG: 0.2 },
  { name: 'Choclo lata Arcor', nameEs: 'Choclo lata Arcor', category: 'Verduras', barcode: '7790580432900', calories: 82, proteinG: 3.0, carbsG: 18.0, fatG: 1.0 },
  // ─── Condimentos y otros ──────────────────────────────────
  { name: 'Chimichurri', nameEs: 'Chimichurri', category: 'Condimentos', calories: 210, proteinG: 1.5, carbsG: 4.0, fatG: 22.0 },
  { name: 'Salsa criolla', nameEs: 'Salsa criolla', category: 'Condimentos', calories: 45, proteinG: 1.0, carbsG: 5.0, fatG: 2.5 },
  // ─── Platos preparados ────────────────────────────────────
  { name: 'Locro criollo', nameEs: 'Locro criollo', category: 'Comidas', calories: 185, proteinG: 12.0, carbsG: 22.0, fatG: 6.0 },
  { name: 'Carbonada', nameEs: 'Carbonada', category: 'Comidas', calories: 140, proteinG: 10.0, carbsG: 18.0, fatG: 4.0 },
  { name: 'Guiso de lentejas', nameEs: 'Guiso de lentejas', category: 'Comidas', calories: 130, proteinG: 8.0, carbsG: 20.0, fatG: 3.0 },
  { name: 'Milanesa a la napolitana', nameEs: 'Milanesa a la napolitana', category: 'Comidas', calories: 280, proteinG: 22.0, carbsG: 12.0, fatG: 15.0 },
  // ─── Snacks con barcodes ──────────────────────────────────
  { name: 'Maní sin sal Dori', nameEs: 'Maní sin sal Dori', category: 'Snacks', barcode: '7790375004012', calories: 567, proteinG: 26.0, carbsG: 16.0, fatG: 49.0 },
  { name: 'Papas fritas Lay\'s clásicas', nameEs: 'Papas fritas Lay\'s clásicas', category: 'Snacks', barcode: '7790895047063', calories: 536, proteinG: 7.0, carbsG: 53.0, fatG: 34.0 },
  { name: 'Barrita cereal Quaker miel', nameEs: 'Barrita cereal Quaker miel', category: 'Snacks', barcode: '7793510010057', calories: 381, proteinG: 8.0, carbsG: 72.0, fatG: 7.5 },
  // ─── Huevos y proteínas ───────────────────────────────────
  { name: 'Huevo entero', nameEs: 'Huevo entero', category: 'Huevos', calories: 143, proteinG: 13.0, carbsG: 1.1, fatG: 9.5 },
  { name: 'Proteína whey chocolate', nameEs: 'Proteína whey chocolate', category: 'Suplementos', calories: 390, proteinG: 75.0, carbsG: 10.0, fatG: 7.0 },
  // ─── Postres ──────────────────────────────────────────────
  { name: 'Alfajor de maicena', nameEs: 'Alfajor de maicena', category: 'Postres', calories: 360, proteinG: 5.0, carbsG: 58.0, fatG: 13.0 },
  { name: 'Pasta frola', nameEs: 'Pasta frola', category: 'Postres', calories: 370, proteinG: 6.0, carbsG: 55.0, fatG: 14.0 },
  { name: 'Arroz con leche', nameEs: 'Arroz con leche', category: 'Postres', calories: 130, proteinG: 4.0, carbsG: 25.0, fatG: 2.5 },
  { name: 'Flan casero', nameEs: 'Flan casero', category: 'Postres', calories: 120, proteinG: 5.0, carbsG: 18.0, fatG: 3.5 },
];

type FoodInput = {
  name: string;
  nameEs: string;
  category: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  barcode?: string;
};

export async function seedArgentineFoods(prisma: PrismaClient): Promise<number> {
  const foods = (ARGENTINE_FOODS as FoodInput[]).map((f, i) => ({
    ...f,
    fdcId: `AR-${String(i + 1).padStart(3, '0')}`,
    source: 'AR_CURATED',
    servingSizeG: 100,
    fiberG: null as number | null,
    sodiumMg: null as number | null,
    barcode: f.barcode ?? null,
  }));

  await prisma.food.createMany({
    data: foods,
    skipDuplicates: true,
  });

  return foods.length;
}
