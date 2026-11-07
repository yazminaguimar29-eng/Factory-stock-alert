@echo off
chcp 65001 >nul
title FactoryStock - Sincronizar con la Nube y Encender Servidor
color 0B

echo ====================================================================
echo   FACTORYSTOCK - SINCRONIZACION LOCAL A NUBE Y SERVIDOR WEB
echo ====================================================================
echo.

set "PATH=C:\Users\yazmi\.tools\node-v20.18.0-win-x64;%PATH%"
cd /d "C:\Users\yazmi\.gemini\antigravity\scratch\factory-stock-alerts"

echo [1/2] Sincronizando base de datos y archivos con la nube...
node scripts\sync-cloud.js

echo.
echo [2/2] Iniciando servidor web local en http://localhost:3000 ...
start "" "http://localhost:3000"
call npm run dev
pause
