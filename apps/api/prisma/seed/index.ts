import { PrismaClient } from '@prisma/client';
import { seedUsdaFoods } from './usda-foods.js';
import { seedArgentineFoods } from './ar-foods.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  console.log('📦 Seeding Argentine curated foods...');
  const arCount = await seedArgentineFoods(prisma);
  console.log(`   ✅ ${arCount} Argentine foods seeded`);

  console.log('🌎 Seeding USDA foods...');
  const usdaCount = await seedUsdaFoods(prisma);
  console.log(`   ✅ ${usdaCount} USDA foods seeded`);

  const total = await prisma.food.count();
  console.log(`\n✅ Total foods in database: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
