@echo off
title NutriPlan - Deteniendo
color 0C
echo.
echo  Deteniendo NutriPlan...
echo.
docker compose down
echo.
echo  Base de datos detenida.
echo  Cierra las ventanas negras de API y Web si siguen abiertas.
echo.
pause
