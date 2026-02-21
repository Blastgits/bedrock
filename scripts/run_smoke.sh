#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-4173}"
OUT_DIR="${2:-output/web-game/latest}"
ACTIONS_FILE="${3:-scripts/actions/pr8-smoke.json}"
URL="http://localhost:${PORT}"
CLIENT="/Users/davidmiller/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js"

npx serve . -l "${PORT}" >/tmp/bedrock-serve.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true' EXIT

sleep 2
node --experimental-default-type=module "$CLIENT" \
  --url "$URL" \
  --actions-file "$ACTIONS_FILE" \
  --click-selector '#start-btn' \
  --iterations 2 \
  --pause-ms 180 \
  --screenshot-dir "$OUT_DIR"

echo "Smoke run complete: $OUT_DIR"
