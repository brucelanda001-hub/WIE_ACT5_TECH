@echo off
REM Starts EdNova against the organisers' platform.
REM Key and base URL stay in .env.local; this file only holds non-secret settings.
cd /d "%~dp0.."

REM Stop an older EdNova dev server still listening on port 3000 (Next allows one per project).
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTENING') do (
  echo Stopping old dev server on port 3000 [PID %%p]
  taskkill /PID %%p /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

set MOCK_MODE=false
set LLM_MODEL_COMPACT=qwen3.5-0.8b
set LLM_MODEL_MID=llama3.1-8b
set LLM_MAX_CONCURRENCY_COMPACT=1
set LLM_MAX_CONCURRENCY_MID=1
set LLM_RPM_LIMIT=20
call npm run dev
pause
