#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${AEONSAGE_IMAGE:-aeonsage:local}"
CONFIG_DIR="${AEONSAGE_CONFIG_DIR:-$HOME/.aeonsage}"
WORKSPACE_DIR="${AEONSAGE_WORKSPACE_DIR:-$HOME/aeonsage}"
PROFILE_FILE="${AEONSAGE_PROFILE_FILE:-$HOME/.profile}"

PROFILE_MOUNT=()
if [[ -f "$PROFILE_FILE" ]]; then
  PROFILE_MOUNT=(-v "$PROFILE_FILE":/home/node/.profile:ro)
fi

echo "==> Build image: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" -f "$ROOT_DIR/Dockerfile" "$ROOT_DIR"

echo "==> Run live model tests (profile keys)"
docker run --rm -t \
  --entrypoint bash \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -e HOME=/home/node \
  -e NODE_OPTIONS=--disable-warning=ExperimentalWarning \
  -e AEONSAGE_LIVE_TEST=1 \
  -e AEONSAGE_LIVE_MODELS="${AEONSAGE_LIVE_MODELS:-all}" \
  -e AEONSAGE_LIVE_PROVIDERS="${AEONSAGE_LIVE_PROVIDERS:-}" \
  -e AEONSAGE_LIVE_MODEL_TIMEOUT_MS="${AEONSAGE_LIVE_MODEL_TIMEOUT_MS:-}" \
  -e AEONSAGE_LIVE_REQUIRE_PROFILE_KEYS="${AEONSAGE_LIVE_REQUIRE_PROFILE_KEYS:-}" \
  -v "$CONFIG_DIR":/home/node/.aeonsage \
  -v "$WORKSPACE_DIR":/home/node/aeonsage \
  "${PROFILE_MOUNT[@]}" \
  "$IMAGE_NAME" \
  -lc "set -euo pipefail; [ -f \"$HOME/.profile\" ] && source \"$HOME/.profile\" || true; cd /app && pnpm test:live"

