#!/bin/bash
# AeonSage Colab Quick Setup Script
# Run this in a Colab cell: !bash colab/quick_setup.sh

set -e

echo "🚀 Starting AeonSage Colab Setup with Ollama Integration..."

echo "📦 Installing Ollama for zero-token-cost AI inference..."
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama service in background
nohup ollama serve > /tmp/ollama.log 2>&1 &
echo "⏳ Waiting for Ollama to start..."
sleep 10

# Install Node.js 22
echo "📦 Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Install pnpm
echo "📦 Installing pnpm..."
npm install -g pnpm@10.23.0

# Clone repository
echo "📥 Cloning AeonSage repository..."
if [ -d "aeonsage" ]; then
    rm -rf aeonsage
fi
git clone https://github.com/Vleonone/AeonsagePro.git aeonsage
cd aeonsage

# Install dependencies
echo "🔧 Installing dependencies..."
pnpm install

# Build project
echo "🔨 Building project..."
pnpm build

# Download Ollama models for CognitiveRouter tiers
echo "📥 Downloading Ollama models..."
ollama pull qwen2.5:0.5b    # Oracle classifier (smallest, fastest)
ollama pull qwen2.5:1.5b    # REFLEX tier (light inference)
ollama pull llama3.1:8b     # STANDARD tier fallback
ollama pull qwen2.5:7b      # STANDARD tier

echo "✅ Ollama models downloaded"

echo "⚙️  Setting up AeonSage environment..."
cat > .env << EOF
# AeonSage Colab Configuration
NODE_ENV=development
AEONSAGE_PROFILE=colab
AEONSAGE_GATEWAY_PORT=18789
AEONSAGE_GATEWAY_BIND=0.0.0.0
EOF

# Configure AeonSage to use Ollama for zero-token-cost inference
echo "⚙️  Configuring AeonSage to use Ollama..."
if [ -f "node_modules/.bin/aeonsage" ]; then
    echo "Setting Ollama as default provider"
    mkdir -p ~/.aeonsage
    cat > ~/.aeonsage/config.json << CONFIG_EOF
{
  "models": {
    "providers": {
      "ollama": {
        "apiKey": "ollama",
        "baseUrl": "http://127.0.0.1:11434/v1"
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "ollama/llama3.1:8b"
      }
    }
  }
}
CONFIG_EOF
fi

# Verify installation
echo "✅ Verifying installation..."
pnpm aeonsage --version
echo "🎉 Setup complete! Ollama is now integrated for zero-token-cost AI inference!"