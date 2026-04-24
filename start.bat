@echo off
title NutriPlan
color 0A
echo.
echo  ============================================
echo          NutriPlan - Iniciando...
echo  ============================================
echo.

REM Verificar si setup fue ejecutado (node_modules existe)
if not exist "node_modules" (
    echo  [!] Parece que no ejecutaste setup.bat todavia.
    echo  Ejecuta setup.bat primero para configurar la app.
    echo.
    pause
    exit /b 1
)

REM Verificar Docker Desktop
docker info >nul 2>&1
if errorlevel 1 (
    echo  [!] Docker no esta corriendo. Iniciando Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo  Esperando que Docker arranque (puede tardar 30-60 segundos)...
    :waitdocker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if errorlevel 1 goto waitdocker
    echo  [OK] Docker listo
)

echo  [1/3] Iniciando base de datos...
docker compose up -d >nul 2>&1
timeout /t 5 /nobreak >nul
echo  [OK] Base de datos lista

echo.
echo  [2/3] Iniciando servidor API...
start "NutriPlan - API (no cierres esta ventana)" cmd /k "cd /d %~dp0apps\api && npm run dev"
timeout /t 4 /nobreak >nul

echo  [3/3] Iniciando aplicacion web...
start "NutriPlan - Web (no cierres esta ventana)" cmd /k "cd /d %~dp0apps\web && npm run dev"
timeout /t 6 /nobreak >nul

echo.
echo  Abriendo NutriPlan en el navegador...
start "" http://localhost:3000

echo.
echo  ============================================
echo    NutriPlan esta corriendo!
echo.
echo    Web:  http://localhost:3000
echo    API:  http://localhost:3001
echo.
echo    Para cerrar la app, ejecuta stop.bat
echo    o cierra las dos ventanas negras.
echo  ============================================
echo.
pause
