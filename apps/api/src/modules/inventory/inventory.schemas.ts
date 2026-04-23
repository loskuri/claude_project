import { z } from 'zod';

export const addInventoryItemSchema = z.object({
  foodId: z.string().optional(),
  customName: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.enum(['g', 'kg', 'ml', 'L', 'units']),
  expiryDate: z.string().datetime().optional(),
}).refine((d) => d.foodId || d.customName, {
  message: 'Se requiere foodId o customName',
});

export const updateInventoryItemSchema = z.object({
  quantity: z.number().positive().optional(),
  unit: z.enum(['g', 'kg', 'ml', 'L', 'units']).optional(),
  expiryDate: z.string().datetime().nullable().optional(),
});

export const expiringQuerySchema = z.object({
  days: z.coerce.number().min(1).max(30).default(3),
});
