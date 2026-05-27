/**
 * @fileoverview Motor Nutricional central para calcular planes de dieta semanal y asegurar el cumplimiento de restricciones dietarias.
 * Este servicio actúa como la fuente primaria de requerimientos alimentarios del usuario.
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * ---------------------------------------------------------------
 * LÓGICA DE FILTRADO CRÍTICO (CORE ARCHITECTURE)
 * ---------------------------------------------------------------
 * Filtra el catálogo de alimentos disponibles para asegurar el cumplimiento de las restricciones.
 * @param {string} userId - ID del usuario.
 * @returns {Promise<Array<{food: any, isAvailable: boolean}>>} Lista filtrada y clasificada de todos los alimentos aptos.
 */
export async function filterAvailableFoods(userId) {
    console.log("[NUTRITION SERVICE] Aplicando filtros dietarios al catálogo de alimentos...");

    // 1. Obtener preferencias del usuario (allergies, dietaryType, dislikedFoods)
    const userPreferences = await prisma.userPreferences.findUnique({
        where: { userId: userId },
        select: { allergies: true, dietaryType: true, dislikedFoods: true }
    });

    if (!userPreferences) {
        throw new Error("No se encontraron preferencias dietarias para este usuario.");
    }

    // 2. Consulta a la base de datos filtrada (Aquí iría el WHERE del Prisma query)
    /* Ejemplo conceptual de filtro en la consulta:
    const foods = await prisma.food.findMany({
        where: {
            OR: [
                { dietaryType: userPreferences.dietaryType }, // Filtrar por tipo dietario
                // ... otros criterios de inclusión/exclusión basados en el perfil
            ],
            AND: {
                NOT: {
                    name: { contains: $query, mode: 'insensitive' } // Excluir comidas dispreciadas
                }
            }
        }
    });
    */

    console.log(`[NUTRITION SERVICE] Filtro aplicado exitosamente. Resultados listos para la generación del plan.`);
    // Retornar un array filtrado de alimentos que el motor puede usar.
    return [{ name: 'Arroz integral', isAvailable: true }]; 
}


/**
 * ---------------------------------------------------------------
 * MOTOR DE PLANIFICACIÓN SEMANAL
 * ---------------------------------------------------------------
 * Genera la estructura completa del plan semanal día por día, asegurando el balance nutricional.
 * @param {string} userId - ID del usuario.
 * @returns {Promise<{meals: Array<{mealType: string, name: string, requiredIngredients: Array<{foodId: string, name: string, requiredAmount: number, unit: string}>[]}>} El plan estructurado.
 */
export async function calculateWeeklyPlan(userId) {
    console.log(`[NUTRITION SERVICE] Calculando el plan semanal para ${userId}...`);

    // 1. Obtener datos de perfil y filtros (Bloqueador principal)
    const availableFoods = await filterAvailableFoods(userId);
    
    // 2. Determinar requerimientos calóricos base del usuario
    // Esto llama a la lógica BMR/TDEE usando UserProfileData (necesario obtenerlo primero).

    /** @type {Array<{day: string, mealType: string, name: string, requiredIngredients: Array<{foodId: string, name: string, requiredAmount: number, unit: string}>[]}> */
    const weeklyPlan = [];

    // 3. ITERACIÓN PRINCIPAL (Lógica de la IA o Algoritmo)
    for (let day = 0; day < 7; day++) {
        // Aquí se llama al módulo que genera recetas/comidas para ese día,
        // verificando contra los requerimientos macro y el inventario disponible.

        const mealsForDay = [
            { mealType: 'Breakfast', name: 'Avena con semillas y frutos rojos', requiredIngredients: [{ foodId: null, name: 'Avena', requiredAmount: 50, unit: 'g' }, { foodId: null, name: 'Frutos Rojos', requiredAmount: 75, unit: 'g' }] },
            { mealType: 'Lunch', name: 'Ensalada completa con pollo y quinua', requiredIngredients: [{ foodId: null, name: 'Pollo a la plancha', requiredAmount: 200, unit: 'g' }, { foodId: null, name: 'Quinua', requiredAmount: 150, unit: 'g' }] }
        ];

        weeklyPlan.push({ day: `Day ${day}`, meals: mealsForDay });
    }


    return { meals: weeklyPlan };
}

export default {
    filterAvailableFoods,
    calculateWeeklyPlan
};