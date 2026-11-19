@echo off
cd /d "%~dp0.."
node scripts\check-platform.mjs
echo.
echo Done. You can close this window.
pause
