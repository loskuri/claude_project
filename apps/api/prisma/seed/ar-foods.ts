import type { PrismaClient } from '@prisma/client';

const ARGENTINE_FOODS = [
  // Carnes
  { name: 'Asado de tira', nameEs: 'Asado de tira', category: 'Carnes', calories: 289, proteinG: 26.1, carbsG: 0, fatG: 20.2 },
  { name: 'Vacío de res', nameEs: 'Vacío de res', category: 'Carnes', calories: 214, proteinG: 28.0, carbsG: 0, fatG: 11.2 },
  { name: 'Milanesa de ternera', nameEs: 'Milanesa de ternera', category: 'Carnes', calories: 220, proteinG: 24.0, carbsG: 10.0, fatG: 9.0 },
  { name: 'Matambre de res', nameEs: 'Matambre de res', category: 'Carnes', calories: 250, proteinG: 27.0, carbsG: 0, fatG: 15.0 },
  { name: 'Chorizo criollo', nameEs: 'Chorizo criollo', category: 'Carnes', calories: 340, proteinG: 19.0, carbsG: 1.0, fatG: 29.0 },
  { name: 'Morcilla', nameEs: 'Morcilla', category: 'Carnes', calories: 370, proteinG: 16.0, carbsG: 3.0, fatG: 32.0 },
  { name: 'Pollo entero', nameEs: 'Pollo entero', category: 'Aves', calories: 215, proteinG: 18.0, carbsG: 0, fatG: 15.0 },
  { name: 'Pechuga de pollo sin piel', nameEs: 'Pechuga de pollo sin piel', category: 'Aves', calories: 165, proteinG: 31.0, carbsG: 0, fatG: 3.6 },
  { name: 'Muslos de pollo', nameEs: 'Muslos de pollo', category: 'Aves', calories: 209, proteinG: 26.0, carbsG: 0, fatG: 11.5 },
  // Pescados
  { name: 'Merluza', nameEs: 'Merluza', category: 'Pescados', calories: 90, proteinG: 18.0, carbsG: 0, fatG: 2.0 },
  { name: 'Pejerrey', nameEs: 'Pejerrey', category: 'Pescados', calories: 96, proteinG: 19.0, carbsG: 0, fatG: 2.2 },
  { name: 'Atún en agua (lata)', nameEs: 'Atún en agua (lata)', category: 'Pescados', calories: 116, proteinG: 25.5, carbsG: 0, fatG: 1.0 },
  // Lácteos
  { name: 'Leche entera', nameEs: 'Leche entera', category: 'Lácteos', calories: 61, proteinG: 3.2, carbsG: 4.8, fatG: 3.2 },
  { name: 'Yogur natural entero', nameEs: 'Yogur natural entero', category: 'Lácteos', calories: 61, proteinG: 3.5, carbsG: 4.7, fatG: 3.3 },
  { name: 'Queso fresco', nameEs: 'Queso fresco', category: 'Lácteos', calories: 264, proteinG: 18.0, carbsG: 2.0, fatG: 21.0 },
  { name: 'Queso cremoso', nameEs: 'Queso cremoso', category: 'Lácteos', calories: 330, proteinG: 20.0, carbsG: 1.5, fatG: 27.0 },
  { name: 'Dulce de leche', nameEs: 'Dulce de leche', category: 'Dulces', calories: 320, proteinG: 6.5, carbsG: 55.0, fatG: 8.0 },
  // Panificados y masas
  { name: 'Pan francés', nameEs: 'Pan francés', category: 'Panificados', calories: 270, proteinG: 9.0, carbsG: 54.0, fatG: 2.5 },
  { name: 'Medialunas de manteca', nameEs: 'Medialunas de manteca', category: 'Panificados', calories: 380, proteinG: 7.0, carbsG: 50.0, fatG: 17.0 },
  { name: 'Facturas surtidas', nameEs: 'Facturas surtidas', category: 'Panificados', calories: 340, proteinG: 7.0, carbsG: 48.0, fatG: 14.0 },
  { name: 'Empanada de carne', nameEs: 'Empanada de carne', category: 'Comidas', calories: 310, proteinG: 13.0, carbsG: 28.0, fatG: 16.0 },
  { name: 'Empanada de queso y jamón', nameEs: 'Empanada de queso y jamón', category: 'Comidas', calories: 280, proteinG: 12.0, carbsG: 28.0, fatG: 14.0 },
  // Cereales y legumbres
  { name: 'Arroz blanco', nameEs: 'Arroz blanco', category: 'Cereales', calories: 364, proteinG: 7.0, carbsG: 80.0, fatG: 0.6 },
  { name: 'Fideos secos', nameEs: 'Fideos secos', category: 'Cereales', calories: 350, proteinG: 12.0, carbsG: 70.0, fatG: 1.5 },
  { name: 'Polenta', nameEs: 'Polenta', category: 'Cereales', calories: 362, proteinG: 8.0, carbsG: 78.0, fatG: 3.5 },
  { name: 'Lentejas secas', nameEs: 'Lentejas secas', category: 'Legumbres', calories: 353, proteinG: 24.0, carbsG: 60.0, fatG: 1.1 },
  { name: 'Porotos negros', nameEs: 'Porotos negros', category: 'Legumbres', calories: 341, proteinG: 21.0, carbsG: 62.0, fatG: 1.4 },
  { name: 'Garbanzos', nameEs: 'Garbanzos', category: 'Legumbres', calories: 364, proteinG: 19.0, carbsG: 61.0, fatG: 6.0 },
  // Verduras típicas
  { name: 'Zapallo', nameEs: 'Zapallo', category: 'Verduras', calories: 26, proteinG: 1.0, carbsG: 6.5, fatG: 0.1 },
  { name: 'Choclo', nameEs: 'Choclo', category: 'Verduras', calories: 86, proteinG: 3.2, carbsG: 19.0, fatG: 1.2 },
  { name: 'Berenjena', nameEs: 'Berenjena', category: 'Verduras', calories: 25, proteinG: 1.0, carbsG: 5.9, fatG: 0.2 },
  { name: 'Morrón rojo', nameEs: 'Morrón rojo', category: 'Verduras', calories: 31, proteinG: 1.0, carbsG: 7.0, fatG: 0.3 },
  { name: 'Cebolla', nameEs: 'Cebolla', category: 'Verduras', calories: 40, proteinG: 1.1, carbsG: 9.3, fatG: 0.1 },
  { name: 'Tomate', nameEs: 'Tomate', category: 'Verduras', calories: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2 },
  { name: 'Lechuga', nameEs: 'Lechuga', category: 'Verduras', calories: 15, proteinG: 1.4, carbsG: 2.2, fatG: 0.2 },
  // Condimentos y otros
  { name: 'Chimichurri', nameEs: 'Chimichurri', category: 'Condimentos', calories: 210, proteinG: 1.5, carbsG: 4.0, fatG: 22.0 },
  { name: 'Salsa criolla', nameEs: 'Salsa criolla', category: 'Condimentos', calories: 45, proteinG: 1.0, carbsG: 5.0, fatG: 2.5 },
  { name: 'Yerba mate', nameEs: 'Yerba mate', category: 'Bebidas', calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  // Platos preparados
  { name: 'Locro criollo', nameEs: 'Locro criollo', category: 'Comidas', calories: 185, proteinG: 12.0, carbsG: 22.0, fatG: 6.0 },
  { name: 'Carbonada', nameEs: 'Carbonada', category: 'Comidas', calories: 140, proteinG: 10.0, carbsG: 18.0, fatG: 4.0 },
  { name: 'Guiso de lentejas', nameEs: 'Guiso de lentejas', category: 'Comidas', calories: 130, proteinG: 8.0, carbsG: 20.0, fatG: 3.0 },
  { name: 'Milanesa a la napolitana', nameEs: 'Milanesa a la napolitana', category: 'Comidas', calories: 280, proteinG: 22.0, carbsG: 12.0, fatG: 15.0 },
  // Frutas
  { name: 'Manzana', nameEs: 'Manzana', category: 'Frutas', calories: 52, proteinG: 0.3, carbsG: 14.0, fatG: 0.2 },
  { name: 'Banana', nameEs: 'Banana', category: 'Frutas', calories: 89, proteinG: 1.1, carbsG: 23.0, fatG: 0.3 },
  { name: 'Naranja', nameEs: 'Naranja', category: 'Frutas', calories: 47, proteinG: 0.9, carbsG: 12.0, fatG: 0.1 },
  { name: 'Pera', nameEs: 'Pera', category: 'Frutas', calories: 57, proteinG: 0.4, carbsG: 15.0, fatG: 0.1 },
  { name: 'Uvas', nameEs: 'Uvas', category: 'Frutas', calories: 69, proteinG: 0.7, carbsG: 18.0, fatG: 0.2 },
  // Aceites y grasas
  { name: 'Aceite de girasol', nameEs: 'Aceite de girasol', category: 'Aceites', calories: 884, proteinG: 0, carbsG: 0, fatG: 100 },
  { name: 'Manteca', nameEs: 'Manteca', category: 'Lácteos', calories: 717, proteinG: 0.9, carbsG: 0.1, fatG: 81.0 },
  // Huevos
  { name: 'Huevo entero', nameEs: 'Huevo entero', category: 'Huevos', calories: 143, proteinG: 13.0, carbsG: 1.1, fatG: 9.5 },
  // Postres
  { name: 'Alfajor de maicena', nameEs: 'Alfajor de maicena', category: 'Postres', calories: 360, proteinG: 5.0, carbsG: 58.0, fatG: 13.0 },
  { name: 'Pasta frola', nameEs: 'Pasta frola', category: 'Postres', calories: 370, proteinG: 6.0, carbsG: 55.0, fatG: 14.0 },
  { name: 'Arroz con leche', nameEs: 'Arroz con leche', category: 'Postres', calories: 130, proteinG: 4.0, carbsG: 25.0, fatG: 2.5 },
  { name: 'Flan casero', nameEs: 'Flan casero', category: 'Postres', calories: 120, proteinG: 5.0, carbsG: 18.0, fatG: 3.5 },
];

export async function seedArgentineFoods(prisma: PrismaClient): Promise<number> {
  const foods = ARGENTINE_FOODS.map((f, i) => ({
    ...f,
    fdcId: `AR-${String(i + 1).padStart(3, '0')}`,
    source: 'AR_CURATED',
    servingSizeG: 100,
    fiberG: null as number | null,
    sodiumMg: null as number | null,
  }));

  await prisma.food.createMany({
    data: foods,
    skipDuplicates: true,
  });

  return foods.length;
}
