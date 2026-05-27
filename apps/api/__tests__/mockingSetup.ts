/**
 * @fileoverview Módulo de mocking para aislar los tests de la persistencia y servicios externos.
 * Permite simular respuestas de PrismaClient, el motor nutricional y los datos del inventario sin tocar la DB real.
 */

import { prisma } from '@prisma/client';

// --- Mocking de Servicios Externos (Placeholder) ---

/**
 * Simula las llamadas al servicio que debería calcular el plan semanal complejo.
 * @returns {Promise<any>} Un objeto simulado con los requerimientos esperados para un test específico.
 */
export const mockNutritionService = {
    // Retorna una estructura predecible y controlada para testing, sin llamar a la lógica real.
    getMockPlan: () => ({ 
        meals: [
            { mealType: 'Breakfast', name: 'Avena con semillas y frutos rojos', requiredIngredients: [{ foodId: 'mock-1', name: 'Avena', requiredAmount: 50, unit: 'g' }, { foodId: null, name: 'Frutos Rojos', requiredAmount: 75, unit: 'g' }] },
            { mealType: 'Lunch', name: 'Bowl de quinua con vegetales', requiredIngredients: [{ foodId: null, name: 'Quinua', requiredAmount: 200, unit: 'g' }, { foodId: null, name: 'Brócoli', requiredAmount: 150, unit: 'g' }] }
        ]
    })
};

// --- Mocking de Prisma (Mocking Layer) ---

/**
 * Mockeamos las funciones principales de la DB para que los tests sean rápidos y no dependan del estado real.
 */
export const mockPrisma = {
    shoppingListArtifact: {
        create: async ({ data }) => ({ ...data, id: 'mock-uuid-123' }), // Simula creación exitosa con un ID fijo
    },
    requirementLineItem: {
        createMany: async ({ data }) => ({ count: data.length }), // Simula inserción exitosa contando los elementos pasados
    },
    inventoryItem: {
        findMany: async () => ([
            // Ejemplo de stock disponible, con y sin minStockQuantity
            { foodId: 'food-1', customName: 'Lechuga mixta', quantity: 500.00, unit: 'g', minStockQuantity: 100 }, // Stock OK
            { foodId: 'food-2', customName: 'Pechuga de pollo', quantity: 30.00, unit: 'g', minStockQuantity: 150 }  // Stock CRÍTICO BAJO
        ]),
    },
};

/**
 * Wrapper para pasar la dependencia del mock a los módulos que lo necesitan.
 */
export const mockDependencyInjector = {
    prismaClient: mockPrisma,
    nutritionService: mockNutritionService
};