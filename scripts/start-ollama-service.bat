@echo off
REM Start Ollama Service for AeonsagePro Gateway (Windows)

echo Starting Ollama service...

REM Check if Ollama is already running
curl -s http://127.0.0.1:11434/api/version >nul 2>&1
if %errorlevel% equ 0 (
    echo Ollama is already running
    goto preload
)

echo Starting Ollama daemon...

REM Start Ollama in the background
start /B ollama serve

REM Wait for Ollama to be ready
timeout /t 3 /nobreak >nul

:preload
echo Preloading qwen2.5:0.5b model...
start /B ollama run qwen2.5:0.5b "test"

echo Ollama service is ready for Oracle Engine
