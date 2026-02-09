#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${AEONSAGE_INSTALL_E2E_IMAGE:-aeonsage-install-e2e:local}"
INSTALL_URL="${AEONSAGE_INSTALL_URL:-https://aeonsage.org/install.sh}"

OPENAI_API_KEY="${OPENAI_API_KEY:-}"
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"
ANTHROPIC_API_TOKEN="${ANTHROPIC_API_TOKEN:-}"
AEONSAGE_E2E_MODELS="${AEONSAGE_E2E_MODELS:-}"

echo "==> Build image: $IMAGE_NAME"
docker build \
  -t "$IMAGE_NAME" \
  -f "$ROOT_DIR/scripts/docker/install-sh-e2e/Dockerfile" \
  "$ROOT_DIR/scripts/docker/install-sh-e2e"

echo "==> Run E2E installer test"
docker run --rm \
  -e AEONSAGE_INSTALL_URL="$INSTALL_URL" \
  -e AEONSAGE_INSTALL_TAG="${AEONSAGE_INSTALL_TAG:-latest}" \
  -e AEONSAGE_E2E_MODELS="$AEONSAGE_E2E_MODELS" \
  -e AEONSAGE_INSTALL_E2E_PREVIOUS="${AEONSAGE_INSTALL_E2E_PREVIOUS:-}" \
  -e AEONSAGE_INSTALL_E2E_SKIP_PREVIOUS="${AEONSAGE_INSTALL_E2E_SKIP_PREVIOUS:-0}" \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  -e ANTHROPIC_API_TOKEN="$ANTHROPIC_API_TOKEN" \
  "$IMAGE_NAME"
