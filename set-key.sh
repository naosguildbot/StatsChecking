#!/usr/bin/env bash
# Easily swap the Hypixel API key used by the app.
#   ./set-key.sh <new-api-key>
# Updates HYPIXEL_API_KEY in .env (creating .env from .env.example if needed).
set -euo pipefail
cd "$(dirname "$0")"

KEY="${1:-}"
if [[ -z "$KEY" ]]; then
  echo "Usage: ./set-key.sh <new-api-key>"
  exit 1
fi

# Basic sanity check: keys look like a UUID.
if ! [[ "$KEY" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  echo "Warning: that doesn't look like a UUID-style key, setting it anyway."
fi

[[ -f .env ]] || cp .env.example .env

if grep -q '^HYPIXEL_API_KEY=' .env; then
  # Portable in-place edit (works on macOS + Linux).
  tmp="$(mktemp)"
  sed "s|^HYPIXEL_API_KEY=.*|HYPIXEL_API_KEY=$KEY|" .env > "$tmp" && mv "$tmp" .env
else
  printf '\nHYPIXEL_API_KEY=%s\n' "$KEY" >> .env
fi

echo "Key updated in .env. Restart the app to use it:"
echo "  pkill -f 'node server.js'; npm start"
