#!/usr/bin/env bash
# ==============================================================================
# StremioFlix - Native Stremio Desktop Launcher with Netflix / Prime Video UI
# Reverse-engineered using REA (stremio-shell --webui-url parameter)
# ==============================================================================

STREMIO_BIN="/Applications/Stremio.app/Contents/MacOS/Stremio"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=3000
UI_URL="http://localhost:${PORT}"

echo "🎬 StremioFlix: Starting Netflix-style Native Stremio Client..."

if [ ! -f "$STREMIO_BIN" ]; then
  echo "❌ Error: Stremio.app not found at $STREMIO_BIN"
  echo "Please ensure Stremio desktop application is installed."
  exit 1
fi

# Check if Next.js dev or prod server is already running on port 3000
if ! nc -z localhost $PORT 2>/dev/null; then
  echo "🚀 Starting StremioFlix WebUI on ${UI_URL}..."
  cd "$PROJECT_DIR"
  npm run start &
  SERVER_PID=$!
  sleep 3
else
  echo "✅ StremioFlix WebUI is already running at ${UI_URL}."
fi

# Launch the official native Stremio app pointing to our Netflix UI and server handshake!
echo "✨ Launching Native Stremio Desktop App with custom Netflix UI..."
"$STREMIO_BIN" --webui-url="$UI_URL" --server-url="$UI_URL" "$@"
