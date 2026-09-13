#!/usr/bin/env bash
# Arranque robusto de la liga: gunicorn + auto-reinicio.
set -u

cd "$(dirname "$0")"

PORT="${PORT:-12000}"
WORKERS="${WORKERS:-2}"
HOST="${HOST:-0.0.0.0}"

export SECRET_KEY="${SECRET_KEY:-cambia-esto-en-produccion-2026}"
export ADMIN_PASS="${ADMIN_PASS:-admin1234}"

echo "==> Liga RL: iniciando en $HOST:$PORT (workers=$WORKERS)"
echo "==> Dirección:  http://localhost:$PORT   Público:  https://<host>"

# Usa python -m gunicorn para robustez (evita depender del PATH)
exec python3 -m gunicorn --chdir "$PWD" \
  -w "$WORKERS" \
  -b "$HOST:$PORT" \
  --timeout 60 \
  --graceful-timeout 10 \
  --access-logfile - \
  --error-logfile - \
  --capture-output \
  wsgi:application