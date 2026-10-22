#!/usr/bin/env bash
# ==============================================================================
# Stremio tv - Optional Native Stremio Desktop Launcher
# Connects native Stremio desktop application to Stremio tv UI
# ==============================================================================

STREMIO_BIN="/Applications/Stremio.app/Contents/MacOS/Stremio"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-3000}"
UI_URL="${STREMIO_TV_URL:-http://localhost:${PORT}}"

echo "🎬 Stremio tv: Connecting Native Stremio Client..."

if [ ! -f "$STREMIO_BIN" ]; then
  echo "❌ Error: Stremio.app not found at $STREMIO_BIN"
  echo "Please ensure Stremio desktop application is installed."
  exit 1
fi

# Launch the official native Stremio app pointing to our UI
echo "✨ Launching Native Stremio Desktop App pointing to ${UI_URL}..."
"$STREMIO_BIN" --webui-url="$UI_URL" --server-url="$UI_URL" "$@"
