#!/usr/bin/env bash
# Reset NoteStack on macOS: quit the app, remove the .app bundle, delete local data,
# and remove Ollama (GUI app, CLI symlink, and ~/.ollama models).
# Re-download the DMG from notestack.fyi and install fresh to see onboarding again.
#
# Usage:
#   chmod +x reset-notestack-macos.sh
#   ./reset-notestack-macos.sh          # asks for confirmation
#   ./reset-notestack-macos.sh --yes    # no prompt
#   ./reset-notestack-macos.sh --keep-ollama   # skip Ollama removal

set -euo pipefail

APP_NAME="NoteStack"
BUNDLE_ID="com.notestack.app"
OLLAMA_APP_NAME="Ollama"

confirm=true
remove_ollama=true
for arg in "$@"; do
  case "${arg}" in
    --yes|-y) confirm=false ;;
    --keep-ollama) remove_ollama=false ;;
  esac
done

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

ollama_app_paths=(
  "/Applications/${OLLAMA_APP_NAME}.app"
  "${HOME}/Applications/${OLLAMA_APP_NAME}.app"
)
ollama_cli_paths=(
  "/usr/local/bin/ollama"
  "/opt/homebrew/bin/ollama"
)
ollama_support_paths=(
  "${HOME}/.ollama"
  "${HOME}/Library/Application Support/Ollama"
  "${HOME}/Library/Saved Application State/com.electron.ollama.savedState"
  "${HOME}/Library/Caches/com.electron.ollama"
  "${HOME}/Library/Caches/ollama"
  "${HOME}/Library/WebKit/com.electron.ollama"
  "${HOME}/Library/Preferences/com.electron.ollama.plist"
)

remove_path_if_present() {
  local p="$1"
  if [[ -e "${p}" ]]; then
    echo "Removing ${p}"
    rm -rf "${p}"
  fi
}

remove_ollama_install() {
  echo "Quitting ${OLLAMA_APP_NAME}…"
  osascript -e "quit app \"${OLLAMA_APP_NAME}\"" 2>/dev/null || true
  pkill -x "${OLLAMA_APP_NAME}" 2>/dev/null || true
  pkill -x ollama 2>/dev/null || true
  sleep 1

  if command -v brew >/dev/null 2>&1 && brew list --cask ollama >/dev/null 2>&1; then
    echo "Uninstalling Ollama Homebrew cask (if present)…"
    brew uninstall --cask ollama 2>/dev/null || true
  fi

  for p in "${ollama_app_paths[@]}"; do
    remove_path_if_present "${p}"
  done

  for p in "${ollama_cli_paths[@]}"; do
    if [[ -e "${p}" ]]; then
      echo "Removing Ollama CLI at ${p}"
      rm -f "${p}" 2>/dev/null || sudo rm -f "${p}" 2>/dev/null || true
    fi
  done

  for p in "${ollama_support_paths[@]}"; do
    remove_path_if_present "${p}"
  done
}

echo "This will:"
echo "  • Quit ${APP_NAME} if it is running"
echo "  • Remove the app from Applications (if present)"
echo "  • Delete: ${data_dir}"
echo "  • Delete legacy folder (if present): ${legacy_data_dir}"
echo "  • Remove Tauri/macOS support files for ${BUNDLE_ID} (if present)"
if $remove_ollama; then
  echo "  • Quit ${OLLAMA_APP_NAME}, remove ${OLLAMA_APP_NAME}.app, the ollama CLI, and ~/.ollama (models)"
else
  echo "  • Leave Ollama installed (--keep-ollama)"
fi
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
  remove_path_if_present "${p}"
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
  remove_path_if_present "${p}"
done

if $remove_ollama; then
  remove_ollama_install
fi

echo ""
echo "Done. ${APP_NAME} is removed locally."
if $remove_ollama; then
  echo "Ollama (app, CLI, and local models) was removed if it was installed."
fi
echo "Next: download the DMG again, install to Applications, and open the app for onboarding."
