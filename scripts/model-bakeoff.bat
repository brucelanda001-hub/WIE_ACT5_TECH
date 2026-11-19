@echo off
cd /d "%~dp0.."
node scripts\model-bakeoff.mjs
echo.
echo Done. You can close this window.
pause
