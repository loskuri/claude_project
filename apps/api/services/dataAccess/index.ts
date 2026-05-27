/**
 * @fileoverview Funcionalidades de acceso a datos (Data Access Layer) para la gestión de inventario y planos nutricionales.
 */

import { PrismaClient, InventoryItem } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Obtiene un snapshot detallado del inventario actual para un usuario,
 * incluyendo el stock disponible Y el límite mínimo de seguridad predefinido.
 * 
 * @param {string} userId - ID del usuario.
 * @returns {Promise<Array<{foodId: string | null, name: string, amount: number, unit: string, minStockQuantity: number|null}>>} Lista de ítems con sus detalles.
 */
export async function getInventorySnapshot(userId) {
    console.log(`[DATA ACCESS] Obteniendo snapshot de inventario para el usuario ${userId}...`);

    // Consulta a Prisma para obtener todos los ítems del usuario
    const items = await prisma.inventoryItem.findMany({
        where: { userId: userId },
        select: {
            foodId: true,
            customName: true,
            quantity: true,
            unit: true,
            minStockQuantity: true // Campo crítico añadido al schema
        }
    });

    // Transformar el resultado en un formato de datos fácil de consumir por la lógica de negocio
    return items.map(item => ({
        foodId: item.foodId,
        name: item.customName || 'Sin nombre', // Usamos customName si está disponible
        amount: parseFloat(item.quantity.toFixed(2)), // Aseguramos formato numérico para cálculos
        unit: item.unit,
        minStockQuantity: item.minStockQuantity
    }));
}

/**
 * Función placeholder que simula la llamada al módulo de Nutrición para obtener el plan semanal.
 * TODO: Debe ser reemplazada por una llamada real a un servicio nutricional ya existente.
 * @param {string} userId 
 * @returns {Promise<any>} Datos simulados del Plan Semanal.
 */
export function getMockWeeklyPlanData(userId) {
    console.warn("[MOCK WARNING] Usando datos de plan semanal mockeados. Implementar conexión real a NutritionService.");
    // Este objeto debe simular la estructura que viene después de calcular el BMR y TDEE, y luego se desglosa en comidas.
    return {
        planId: "uuid-mock-plan",
        meals: [
            { 
                mealType: 'LUNCH', 
                name: 'Bowl de Quinua con vegetales', 
                requiredIngredients: [
                    // Ingredientes que deberían ser agregados por el servicio Nutricional.
                    { foodId: null, name: 'Quinua', requiredAmount: 200, unit: 'g' },
                    { foodId: null, name: 'Brócoli', requiredAmount: 150, unit: 'g' }
                ]
            },
             { 
                mealType: 'DINNER', 
                name: 'Pechuga al horno con ensalada mixta', 
                requiredIngredients: [
                    // Otro requerimiento para testear la agregación.
                    { foodId: null, name: 'Pechuga de pollo', requiredAmount: 300, unit: 'g' },
                    { foodId: null, name: 'Lechuga mixta', requiredAmount: 100, unit: 'g' }
                ]
            }
        ],
    };
}

export default {
    getInventorySnapshot,
    getMockWeeklyPlanData
};