#!/usr/bin/env bash
# Build or run Record Plus desktop (Tauri). Run from repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
DESKTOP="$ROOT/apps/desktop"

if [[ ! -f "$DESKTOP/package.json" ]]; then
  echo "error: $DESKTOP/package.json not found."
  echo "Restore the repo:  cd \"$ROOT\" && git fetch origin && git reset --hard origin/main"
  exit 1
fi

cd "$DESKTOP"

MODE="${1:-build}"
case "$MODE" in
  build)
    npm install
    npm run tauri build
    ;;
  dev)
    npm install
    npm run tauri dev
    ;;
  *)
    echo "usage: $0 [build|dev]   (default: build)"
    exit 1
    ;;
esac
