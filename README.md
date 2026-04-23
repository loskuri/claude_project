# NutriPlan 🥗

Asistente inteligente de nutrición personalizada para Argentina. Combina un motor nutricional basado en la fórmula Mifflin-St Jeor, generación de planes de dieta y recetas vía Claude API, y un gestor de inventario con alimentos argentinos.

## Stack

| Capa | Tecnología |
|------|-----------|
| Monorepo | Turborepo + npm workspaces |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Base de datos | PostgreSQL 16 + Redis 7 |
| Auth | JWT (access 15min / refresh 30d) |
| IA | Claude API (`claude-sonnet-4-6`) con prompt caching |
| Web | Next.js 14 (App Router) + Tailwind CSS |
| Mobile | Expo (React Native) + Expo Router + NativeWind |

## Requisitos previos

- Node.js 20+
- npm 10+
- Docker + Docker Compose
- Una API key de Anthropic (`sk-ant-...`)

## Setup inicial

```bash
# 1. Clonar y entrar al repo
git clone https://github.com/loskuri/claude_project.git nutriplan
cd nutriplan

# 2. Instalar dependencias
npm install --legacy-peer-deps

# 3. Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env

# Editar apps/api/.env y completar:
# - ANTHROPIC_API_KEY=sk-ant-...  ← REQUERIDO
# - Los JWT secrets ya tienen valores por defecto para desarrollo

# 4. Levantar PostgreSQL + Redis
docker compose up -d

# 5. Correr migraciones de base de datos
npm run db:migrate

# 6. Importar base de datos de alimentos (USDA + alimentos argentinos)
npm run db:seed
```

## Desarrollo

```bash
# Levanta API (puerto 3001) + Web (puerto 3000) en paralelo
npm run dev

# Solo el backend
npm run dev --workspace=apps/api

# Solo el frontend web
npm run dev --workspace=apps/web

# App mobile (requiere Expo Go en el celular)
npm run dev --workspace=apps/mobile
```

## Variables de entorno

### `apps/api/.env`

```env
DATABASE_URL=postgresql://nutriplan:nutriplan_dev@localhost:5432/nutriplan
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=nutriplan-access-secret-super-secure-32ch
JWT_REFRESH_SECRET=nutriplan-refresh-secret-super-secure-32c
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
ANTHROPIC_API_KEY=sk-ant-...           # ← Obtener en console.anthropic.com
USDA_API_KEY=DEMO_KEY                  # Opcional: registrar en fdc.nal.usda.gov
PORT=3001
NODE_ENV=development
```

### `apps/web/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### `apps/mobile/.env`
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## API endpoints

Todos con prefijo `/api/v1`. Los marcados con 🔒 requieren `Authorization: Bearer <token>`.

```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh

GET    /users/me                     🔒
PUT    /users/me/profile             🔒
PUT    /users/me/preferences         🔒

GET    /nutrition/targets            🔒   → BMR, TDEE, macros

POST   /diet/generate               🔒   → plan semanal vía Claude AI
GET    /diet/current                🔒

GET    /foods/search?q=             🔒   → búsqueda en BD (5000+ alimentos)
GET    /foods/barcode/:code         🔒

GET    /inventory                   🔒
POST   /inventory                   🔒
PUT    /inventory/:id               🔒
DELETE /inventory/:id               🔒
GET    /inventory/expiring?days=3   🔒

POST   /recipes/generate            🔒   → SSE stream (Claude AI)
POST   /recipes/:id/save            🔒
GET    /recipes/saved               🔒

POST   /progress/weight             🔒
GET    /progress/weight             🔒
```

## Estructura del proyecto

```
nutriplan/
├── apps/
│   ├── api/          # Express backend (puerto 3001)
│   ├── web/          # Next.js 14 (puerto 3000)
│   └── mobile/       # Expo React Native
├── packages/
│   └── shared/       # Tipos TypeScript, fórmulas nutricionales compartidas
└── docker-compose.yml
```

## Arquitectura de la IA

La generación de planes y recetas usa `claude-sonnet-4-6` con **prompt caching** (`cache_control: ephemeral`) para reducir costos ~90% en llamadas repetidas.

- **Plan semanal** (`POST /diet/generate`): genera 7 días × N comidas como JSON estructurado. Validado con Zod antes de guardar en DB. Resultado cacheado en Redis 24h.
- **Recetas** (`POST /recipes/generate`): respuesta en streaming SSE, token a token en tiempo real. Guardable por el usuario.

## Fórmulas nutricionales

```
BMR (Mifflin-St Jeor):
  Hombre: 10×peso + 6.25×altura - 5×edad + 5
  Mujer:  10×peso + 6.25×altura - 5×edad - 161

TDEE = BMR × factor_actividad (1.2 a 1.9)

Macros según objetivo:
  Perder peso:    TDEE-500 | P:35% C:35% G:30%
  Mantener:       TDEE     | P:25% C:50% G:25%
  Ganar músculo:  TDEE+300 | P:30% C:45% G:25%
```

## Base de datos de alimentos

El seed importa automáticamente:
- **USDA FoodData Central** (~2000 alimentos Foundation + SR Legacy) via API pública
- **Alimentos argentinos curados** (~50 items): asado de tira, milanesa, empanadas, facturas, yerba mate, dulce de leche, locro, etc.

## Verificación rápida

```bash
# ¿La API funciona?
curl http://localhost:3001/health

# Registrar un usuario
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!","firstName":"Juan"}'

# Verificar que hay alimentos en la BD
# (requiere psql o un cliente SQL conectado a localhost:5432)
```

## Próximas features (roadmap)

- [ ] Integración de precios de supermercados (Coto, Jumbo, Carrefour)
- [ ] Bot de WhatsApp vía Twilio
- [ ] Integración con wearables (pasos, calorías quemadas)
- [ ] Comunidad y compartir recetas
- [ ] Versión PWA offline
- [ ] Tests unitarios e integración
