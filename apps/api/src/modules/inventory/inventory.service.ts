import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error.middleware.js';
import { daysUntil } from '@nutriplan/shared';

function enrichWithExpiry(item: { expiryDate: Date | null; [key: string]: unknown }) {
  return {
    ...item,
    daysUntilExpiry: item.expiryDate ? daysUntil(item.expiryDate) : null,
  };
}

const itemSelect = {
  id: true,
  userId: true,
  foodId: true,
  customName: true,
  quantity: true,
  unit: true,
  expiryDate: true,
  addedAt: true,
  food: {
    select: {
      id: true,
      nameEs: true,
      name: true,
      category: true,
      calories: true,
      proteinG: true,
      carbsG: true,
      fatG: true,
    },
  },
};

export async function getInventory(userId: string) {
  const items = await prisma.inventoryItem.findMany({
    where: { userId },
    select: itemSelect,
    orderBy: { addedAt: 'desc' },
  });
  return items.map(enrichWithExpiry);
}

export async function addItem(
  userId: string,
  data: { foodId?: string; customName?: string; quantity: number; unit: string; expiryDate?: string },
) {
  const item = await prisma.inventoryItem.create({
    data: {
      userId,
      foodId: data.foodId,
      customName: data.customName,
      quantity: data.quantity,
      unit: data.unit,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
    },
    select: itemSelect,
  });
  return enrichWithExpiry(item);
}

export async function updateItem(
  userId: string,
  itemId: string,
  data: { quantity?: number; unit?: string; expiryDate?: string | null },
) {
  const existing = await prisma.inventoryItem.findFirst({ where: { id: itemId, userId } });
  if (!existing) throw new AppError(404, 'Item no encontrado');

  const item = await prisma.inventoryItem.update({
    where: { id: itemId },
    data: {
      quantity: data.quantity,
      unit: data.unit,
      expiryDate: data.expiryDate === null ? null : data.expiryDate ? new Date(data.expiryDate) : undefined,
    },
    select: itemSelect,
  });
  return enrichWithExpiry(item);
}

export async function deleteItem(userId: string, itemId: string) {
  const existing = await prisma.inventoryItem.findFirst({ where: { id: itemId, userId } });
  if (!existing) throw new AppError(404, 'Item no encontrado');
  await prisma.inventoryItem.delete({ where: { id: itemId } });
}

export async function getExpiringItems(userId: string, days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  const items = await prisma.inventoryItem.findMany({
    where: {
      userId,
      expiryDate: { lte: cutoff, gte: new Date() },
    },
    select: itemSelect,
    orderBy: { expiryDate: 'asc' },
  });
  return items.map(enrichWithExpiry);
}
