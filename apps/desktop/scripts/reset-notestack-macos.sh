#!/usr/bin/env bash
# Reset NoteStack on macOS: quit the app, remove the .app bundle, and delete local data.
# Re-download the DMG from notestack.fyi and install fresh to see onboarding again.
#
# Usage:
#   chmod +x reset-notestack-macos.sh
#   ./reset-notestack-macos.sh          # asks for confirmation
#   ./reset-notestack-macos.sh --yes    # no prompt

set -euo pipefail

APP_NAME="NoteStack"
BUNDLE_ID="com.notestack.app"

confirm=true
if [[ "${1:-}" == "--yes" || "${1:-}" == "-y" ]]; then
  confirm=false
fi

data_dir="${HOME}/Library/Application Support/${APP_NAME}"
legacy_data_dir="${HOME}/Library/Application Support/Record Plus"
app_paths=(
  "/Applications/${APP_NAME}.app"
  "${HOME}/Applications/${APP_NAME}.app"
)
extra_paths=(
  "${HOME}/Library/Application Support/${BUNDLE_ID}"
  "${HOME}/Library/Caches/${BUNDLE_ID}"
  "${HOME}/Library/Preferences/${BUNDLE_ID}.plist"
  "${HOME}/Library/Preferences/${BUNDLE_ID}.plist.lockfile"
  "${HOME}/Library/Saved Application State/${BUNDLE_ID}.savedState"
)

echo "This will:"
echo "  • Quit ${APP_NAME} if it is running"
echo "  • Remove the app from Applications (if present)"
echo "  • Delete: ${data_dir}"
echo "  • Delete legacy folder (if present): ${legacy_data_dir}"
echo "  • Remove Tauri/macOS support files for ${BUNDLE_ID} (if present)"
echo ""
echo "Your Ollama models are NOT removed (they live under ~/.ollama)."
echo ""

if $confirm; then
  read -r -p "Continue? [y/N] " reply
  if [[ ! "${reply}" =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
  fi
fi

echo "Quitting ${APP_NAME}…"
osascript -e "quit app \"${APP_NAME}\"" 2>/dev/null || true
sleep 1
if pgrep -xq "${APP_NAME}" 2>/dev/null; then
  pkill -x "${APP_NAME}" 2>/dev/null || true
  sleep 1
fi

for p in "${app_paths[@]}"; do
  if [[ -e "${p}" ]]; then
    echo "Removing ${p}"
    rm -rf "${p}"
  fi
done

if [[ -d "${data_dir}" ]]; then
  echo "Removing ${data_dir}"
  rm -rf "${data_dir}"
fi

if [[ -d "${legacy_data_dir}" ]]; then
  echo "Removing ${legacy_data_dir}"
  rm -rf "${legacy_data_dir}"
fi

for p in "${extra_paths[@]}"; do
  if [[ -e "${p}" ]]; then
    echo "Removing ${p}"
    rm -rf "${p}"
  fi
done

echo ""
echo "Done. ${APP_NAME} is removed locally."
echo "Next: download the DMG again, install to Applications, and open the app for onboarding."
