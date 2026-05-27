/**
 * @fileoverview Servicio central de lógica para generar la lista de compras semanal del usuario.
 * Este servicio opera como un Worker Agent y debe ser llamado por un proceso programado (Cron Job).
 */

import { PrismaClient } from '@prisma/client';
import { ShoppingListArtifact, RequirementLineItem, SourceType } from '@prisma/client';
// Asumiendo que existe un cliente de API para llamar a la lógica nutricional.
import * as NutritionService from './nutritionService'; 

const prisma = new PrismaClient();

/**
 * @typedef {Object} UserInventorySnapshot - Vista de todo el inventario disponible.
 * @property {Array<{foodId: string, quantity: number, unit: string, minStockQuantity: number|null}>} inventoryItems Lista de ítems con sus cantidades y stocks mínimos.
 */

/**
 * @typedef {Object} PlanWeeklyData - Datos resumidos del plan semanal completo.
 * @property {Array<{mealType: any, name: string, requiredIngredients: Array<{foodId: string, amount: number, unit: string}[]}>} weeklyPlan Lista de comidas y sus requerimientos agregados.
 */

/**
 * Genera el artefacto persistente de la lista de compras para un usuario dado.
 * Este proceso es asíncrono (Worker/Cron Job) y debe manejar toda la complejidad de las fuentes de datos.
 * @param {string} userId - ID del usuario que genera la lista.
 * @returns {Promise<ShoppingListArtifact>} El artefacto guardado en la DB.
 */
export async function generateShoppingList(userId) {
    console.log(`[SHOPPING LIST SERVICE] Iniciando cálculo de lista para el usuario: ${userId}`);

    // 1. Obtener datos base del usuario
    const [inventorySnapshot, weeklyPlanData] = await Promise.all([
        getInventorySnapshot(userId), // Función placeholder que consulta la DB
        NutritionService.calculateWeeklyPlan(userId) // Función placeholder para obtener el plan semanal
    ]);

    // 2. Inicializar artefacto y lista de requerimientos temporales
    const newShoppingList = await prisma.shoppingListArtifact.create({
        data: {
            userId: userId,
            isPublished: false,
            shoppingListItems: { createMany: { data: [] } } // Iniciamos el array vacío
        }
    });

    /** @type {Array<RequirementLineItem>} */
    let allRequirements = [];

    // 3. Calcular Requerimientos del Plan Semanal (Fuente 1)
    const planRequirements = await processPlanWeekly(weeklyPlanData);
    allRequirements.push(...planRequirements);

    // 4. Detectar Déficit de Stock (Fuente 2 - La alerta crítica)
    const deficitItems = await calculateDeficits(inventorySnapshot, allRequirements);
    console.log(`[SHOPPING LIST SERVICE] Se detectaron ${deficitItems.length} ítems con déficit.`);
    allRequirements.push(...deficitItems);

    // 5. Guardar todos los requerimientos calculados en la DB como una transacción atómica
    const createdLines = await prisma.requirementLineItem.createMany({
        data: allRequirements,
        skipDuplicates: true // Evita errores si el mismo ítem es requerido dos veces por diferentes fuentes (aunque debería evitarse a nivel lógico)
    });

    console.log(`[SHOPPING LIST SERVICE] Se guardaron ${createdLines.count} líneas de requerimiento.`);
    return newShoppingList;
}


/**
 * Procesa los datos del plan semanal para generar todos los requerimientos iniciales.
 * @param {PlanWeeklyData} weeklyPlanData - El plan semanal calculado.
 * @returns {Promise<Array<{foodId: string, amount: number, unitOfMeasure: string, sourceType: SourceType, description?: string}>>} Array de requerimientos del plan.
 */
async function processPlanWeekly(weeklyPlanData) {
    // TODO: Implementar la lógica de iteración y agregación por ingrediente único.

    const requirements = []; 

    // Ejemplo placeholder de cómo se vería el proceso...
    console.log("DEBUG: Procesando plan semanal...");

    return [
        { foodId: 'uuid-ejemplo', amount: 150, unitOfMeasure: 'g', sourceType: SourceType.PLAN_WEEKLY, description: 'Para el almuerzo del lunes.' }
    ];
}


/**
 * Compara los requerimientos totales con el inventario actual para generar alertas de déficit.
 * @param {UserInventorySnapshot} inventorySnapshot - El stock disponible.
 * @param {Array<{foodId: string, amount: number, unitOfMeasure: string, sourceType: SourceType, description?: string}[]>} allRequirements - Requerimientos totales calculados hasta ahora.
 * @returns {Promise<Array<{foodId: string, amount: number, unitOfMeasure: string, sourceType: SourceType, description?: string}[]>>} Lista de requerimientos que superan el stock.
 */
async function calculateDeficits(inventorySnapshot, allRequirements) {
    // TODO: Implementar la lógica comparativa (RequerimientoTotal vs StockDisponible).

    const deficitList = [];
    // ... Lógica aquí ... 
    return [
        { foodId: 'uuid-ejemplo', amount: 50, unitOfMeasure: 'g', sourceType: SourceType.INVENTORY_DEFICIT, description: 'Necesario porque el stock actual es cero.' }
    ];
}

/**
 * Consulta la base de datos para obtener el estado del inventario del usuario.
 * @param {string} userId 
 * @returns {Promise<UserInventorySnapshot>}
 */
async function getInventorySnapshot(userId) {
    // TODO: Implementar consulta a prisma.inventoryItem y agregar lógica para minStockQuantity si es nula/nula.
    return []; // Retorna un array vacío temporalmente
}

export default {
    generateShoppingList,
    processPlanWeekly,
    calculateDeficits,
};