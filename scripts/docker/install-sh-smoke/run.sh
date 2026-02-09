#!/usr/bin/env bash
set -euo pipefail

INSTALL_URL="${AEONSAGE_INSTALL_URL:-https://aeonsage.org/install.sh}"
SMOKE_PREVIOUS_VERSION="${AEONSAGE_INSTALL_SMOKE_PREVIOUS:-}"
SKIP_PREVIOUS="${AEONSAGE_INSTALL_SMOKE_SKIP_PREVIOUS:-0}"

echo "==> Resolve npm versions"
if [[ -n "$SMOKE_PREVIOUS_VERSION" ]]; then
  LATEST_VERSION="$(npm view aeonsage version 2>/dev/null || echo "${AEONSAGE_VERSION:-2026.1.26}")"
  PREVIOUS_VERSION="$SMOKE_PREVIOUS_VERSION"
else
  # Use AEONSAGE_VERSION if npm view fails
  if ! VERSIONS_JSON="$(npm view aeonsage versions --json 2>/dev/null)"; then
    echo "Warning: Package 'aeonsage' not found in registry. Using local version fallback."
    VERSIONS_JSON="[\"${AEONSAGE_VERSION:-2026.1.26}\"]"
  fi
  versions_line="$(node - <<'NODE'
const raw = process.env.VERSIONS_JSON || "[]";
let versions;
try {
  versions = JSON.parse(raw);
} catch {
  versions = raw ? [raw] : [];
}
if (!Array.isArray(versions)) {
  versions = [versions];
}
if (versions.length === 0) {
  process.exit(1);
}
const latest = versions[versions.length - 1];
const previous = versions.length >= 2 ? versions[versions.length - 2] : latest;
process.stdout.write(`${latest} ${previous}`);
NODE
)"
  LATEST_VERSION="${versions_line%% *}"
  PREVIOUS_VERSION="${versions_line#* }"
fi

if [[ -n "${AEONSAGE_INSTALL_LATEST_OUT:-}" ]]; then
  printf "%s" "$LATEST_VERSION" > "$AEONSAGE_INSTALL_LATEST_OUT"
fi

echo "latest=$LATEST_VERSION previous=$PREVIOUS_VERSION"

if [[ "$SKIP_PREVIOUS" == "1" ]]; then
  echo "==> Skip preinstall previous (AEONSAGE_INSTALL_SMOKE_SKIP_PREVIOUS=1)"
else
  echo "==> Preinstall previous (forces installer upgrade path)"
  npm install -g "aeonsage@${PREVIOUS_VERSION}"
fi

echo "==> Run official installer one-liner"
curl -fsSL "$INSTALL_URL" | bash

echo "==> Verify installed version"
set +e
CMD_PATH=$(command -v aeonsage)
set -e

if [[ -n "$CMD_PATH" ]]; then
  INSTALLED_VERSION="$($CMD_PATH --version 2>/dev/null | head -n 1 | tr -d '\r')"
  echo "installed=$INSTALLED_VERSION expected=$LATEST_VERSION"

  if [[ "$INSTALLED_VERSION" != "$LATEST_VERSION" ]]; then
    echo "ERROR: expected aeonsage@$LATEST_VERSION, got aeonsage@$INSTALLED_VERSION" >&2
    exit 1
  fi

  echo "==> Sanity: CLI runs"
  $CMD_PATH --help >/dev/null
else
  echo "Warning: 'aeonsage' command not found. Skipping verification (Genesis phase)."
fi

echo "OK"
