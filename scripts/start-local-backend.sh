#!/bin/bash
# Brings up the whole backend stack on this machine, in the order it needs:
# Postgres/Redis -> API -> BullMQ workers -> ngrok tunnel. Ctrl+C stops
# everything (the ngrok process in the foreground, and the background API/
# worker processes via the EXIT trap below).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

if [ -z "${NGROK_DOMAIN:-}" ]; then
  echo "NGROK_DOMAIN is not set. Add it to the root .env file (see .env.example)." >&2
  echo "Reserve a free fixed domain in the ngrok dashboard first; see DEPLOY.md." >&2
  exit 1
fi

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok is not installed or not on PATH. Install it first; see DEPLOY.md." >&2
  exit 1
fi

PIDS=()
cleanup() {
  echo ""
  echo "Shutting down API and workers..."
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT

echo "==> Starting Postgres and Redis (Docker Compose)..."
(cd "$ROOT_DIR" && docker compose up -d)

echo "==> Waiting for Postgres and Redis health checks..."
until [ "$(docker inspect -f '{{.State.Health.Status}}' mapeador-editais-postgres 2>/dev/null)" = "healthy" ] \
  && [ "$(docker inspect -f '{{.State.Health.Status}}' mapeador-editais-redis 2>/dev/null)" = "healthy" ]; do
  sleep 1
done

echo "==> Building backend..."
(cd "$BACKEND_DIR" && npm run build)

echo "==> Starting API..."
(cd "$BACKEND_DIR" && node dist/src/main.js) &
PIDS+=($!)

echo "==> Waiting for the API to respond..."
until curl -sf "http://localhost:${PORT:-3000}/api/v1/health" >/dev/null 2>&1; do
  sleep 1
done

echo "==> Starting workers (scraper, document, ai-analysis, geolocation, notification)..."
for worker in scraper document ai-analysis geolocation notification; do
  (cd "$BACKEND_DIR" && node "dist/src/workers/${worker}.worker.js") &
  PIDS+=($!)
done

echo "==> Starting ngrok tunnel on domain: $NGROK_DOMAIN"
echo "    (Ctrl+C stops the tunnel, the API, and the workers; Postgres/Redis keep running)"
ngrok http "${PORT:-3000}" --domain="$NGROK_DOMAIN"
