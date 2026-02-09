@echo off
REM Start AeonsagePro Gateway with Ollama Auto-Start (Windows)

echo AeonsagePro Gateway + Ollama Launcher
echo ==========================================

REM 1. Start Ollama
call "%~dp0start-ollama-service.bat"

REM 2. Wait a moment for Ollama to stabilize
timeout /t 2 /nobreak >nul

REM 3. Start the Gateway
echo.
echo Starting AeonsagePro Gateway...
echo.

cd /d "%~dp0.."
pnpm gateway:dev
