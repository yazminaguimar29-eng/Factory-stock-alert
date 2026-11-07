@echo off
title FactoryStock - Servidor Local WMS
color 0B
echo ========================================================
echo       FACTORYSTOCK WMS - SERVIDOR LOCAL INDUSTRIAL
echo ========================================================
echo.
set "PATH=C:\Users\yazmi\.tools\node-v20.18.0-win-x64;%PATH%"
cd /d "%~dp0"

echo [OK] Nodo de ejecucion: %PATH:~0,42%
echo [OK] Carpeta del servidor: %CD%
echo.
echo --------------------------------------------------------
echo   Acceso desde esta computadora:
echo   --^> http://localhost:3000
echo.
echo   Acceso desde otros equipos o celulares en la red:
echo   --^> http://192.168.100.100:3000
echo --------------------------------------------------------
echo.
echo Iniciando motor de la aplicacion Next.js...
echo Para apagar el servidor, cierra esta ventana o presiona Ctrl + C.
echo.
npm run dev
pause
