#!/bin/bash
# Start Ollama Service for AeonsagePro Gateway

echo "🚀 Starting Ollama service..."

# Check if Ollama is already running
if curl -s http://127.0.0.1:11434/api/version > /dev/null 2>&1; then
    echo "✅ Ollama is already running"
else
    echo "⏳ Starting Ollama daemon..."

    # Start Ollama in the background
    nohup ollama serve > /tmp/ollama.log 2>&1 &

    # Wait for Ollama to be ready
    for i in {1..30}; do
        if curl -s http://127.0.0.1:11434/api/version > /dev/null 2>&1; then
            echo "✅ Ollama started successfully"
            break
        fi
        sleep 1
        echo -n "."
    done
fi

# Preload the Oracle model
echo "⏳ Preloading qwen2.5:0.5b model..."
ollama run qwen2.5:0.5b "test" > /dev/null 2>&1 &

echo "✅ Ollama service is ready for Oracle Engine"
