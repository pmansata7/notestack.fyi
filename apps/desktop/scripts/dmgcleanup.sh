#!/usr/bin/env bash
# One-liner helper: download and run the latest NoteStack macOS reset script from main.
set -euo pipefail
SCRIPT_URL="https://raw.githubusercontent.com/pmansata7/notestack.fyi/main/apps/desktop/scripts/reset-notestack-macos.sh"
curl -fsSL "${SCRIPT_URL}" -o reset-notestack-macos.sh
chmod +x reset-notestack-macos.sh
exec ./reset-notestack-macos.sh "$@"
