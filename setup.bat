@echo off
title NutriPlan - Instalacion inicial
color 0A
echo.
echo  ============================================
echo    NutriPlan - Configuracion inicial
echo    (Solo necesitas hacer esto una vez)
echo  ============================================
echo.

REM Verificar Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Docker Desktop no esta corriendo.
    echo  Abri Docker Desktop y espera que cargue, luego volvé a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)
echo  [OK] Docker esta corriendo

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js no esta instalado.
    echo  Descargalo desde: https://nodejs.org  (version 18 o superior)
    echo.
    pause
    exit /b 1
)
echo  [OK] Node.js encontrado

REM Verificar .env
if not exist "apps\api\.env" (
    echo.
    echo  [IMPORTANTE] No encontramos el archivo apps\api\.env
    echo  Copiando desde el ejemplo...
    copy "apps\api\.env.example" "apps\api\.env"
    echo.
    echo  *** ACCION REQUERIDA ***
    echo  Abri el archivo apps\api\.env con el Bloc de notas
    echo  y reemplaza ANTHROPIC_API_KEY con tu clave de Anthropic.
    echo  Conseguila gratis en: https://console.anthropic.com
    echo.
    echo  Cuando lo hayas hecho, volvé a ejecutar este archivo.
    pause
    exit /b 1
)
echo  [OK] Archivo .env encontrado

echo.
echo  [1/4] Iniciando base de datos PostgreSQL y Redis...
docker compose up -d
if errorlevel 1 (
    echo  [ERROR] No se pudo iniciar Docker. Revisa que Docker Desktop este abierto.
    pause
    exit /b 1
)

echo  Esperando que la base de datos este lista...
timeout /t 8 /nobreak >nul

echo.
echo  [2/4] Instalando dependencias (puede tardar 2-3 minutos)...
npm install
if errorlevel 1 (
    echo  [ERROR] Fallo npm install.
    pause
    exit /b 1
)

echo.
echo  [3/4] Creando las tablas en la base de datos...
cd apps\api
npx prisma migrate dev --name init
if errorlevel 1 (
    echo  [ERROR] Fallo la migracion de base de datos.
    pause
    exit /b 1
)
cd ..\..

echo.
echo  [4/4] Cargando alimentos argentinos y USDA (puede tardar 2-3 minutos)...
cd apps\api
npm run db:seed
cd ..\..

echo.
echo  ============================================
echo    Instalacion completada con exito!
echo    Ahora ejecuta START.bat para abrir la app.
echo  ============================================
echo.
pause
