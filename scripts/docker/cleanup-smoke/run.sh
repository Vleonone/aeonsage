#!/usr/bin/env bash
set -euo pipefail

cd /repo

export AEONSAGE_STATE_DIR="/tmp/aeonsage-test"
export AEONSAGE_CONFIG_PATH="${AEONSAGE_STATE_DIR}/aeonsage.json"

echo "==> Seed state"
mkdir -p "${AEONSAGE_STATE_DIR}/credentials"
mkdir -p "${AEONSAGE_STATE_DIR}/agents/main/sessions"
echo '{}' >"${AEONSAGE_CONFIG_PATH}"
echo 'creds' >"${AEONSAGE_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${AEONSAGE_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm aeonsage reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${AEONSAGE_CONFIG_PATH}"
test ! -d "${AEONSAGE_STATE_DIR}/credentials"
test ! -d "${AEONSAGE_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${AEONSAGE_STATE_DIR}/credentials"
echo '{}' >"${AEONSAGE_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm aeonsage uninstall --state --yes --non-interactive

test ! -d "${AEONSAGE_STATE_DIR}"

echo "OK"
