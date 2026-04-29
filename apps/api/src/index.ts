import 'dotenv/config';
import './config/env.js';
import { createApp } from './app.js';
import { prisma } from './config/database.js';
import { redis } from './config/redis.js';
import { env } from './config/env.js';

const app = createApp();

async function main() {
  await prisma.$connect();
  console.log('✅ PostgreSQL connected');

  app.listen(env.PORT, () => {
    console.log(`🚀 NutriPlan API running on http://localhost:${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
  });
}

async function shutdown() {
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
