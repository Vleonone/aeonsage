#!/bin/bash
# Start AeonsagePro Gateway with Ollama Auto-Start

echo "🌟 AeonsagePro Gateway + Ollama Launcher"
echo "=========================================="

# 1. Start Ollama
bash "$(dirname "$0")/start-ollama-service.sh"

# 2. Wait a moment for Ollama to stabilize
sleep 2

# 3. Start the Gateway
echo ""
echo "🚀 Starting AeonsagePro Gateway..."
echo ""

cd "$(dirname "$0")/.."
pnpm gateway:dev
