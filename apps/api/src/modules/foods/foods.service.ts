import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error.middleware.js';

export async function searchFoods(query: string, limit = 20, category?: string) {
  return prisma.food.findMany({
    where: {
      AND: [
        {
          OR: [
            { nameEs: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        category ? { category: { equals: category, mode: 'insensitive' } } : {},
      ],
    },
    take: limit,
    orderBy: [{ source: 'asc' }, { nameEs: 'asc' }],
  });
}

export async function getFoodById(id: string) {
  const food = await prisma.food.findUnique({ where: { id } });
  if (!food) throw new AppError(404, 'Alimento no encontrado');
  return food;
}

export async function getFoodByBarcode(barcode: string) {
  const food = await prisma.food.findUnique({ where: { barcode } });
  if (!food) throw new AppError(404, 'Producto no encontrado');
  return food;
}
