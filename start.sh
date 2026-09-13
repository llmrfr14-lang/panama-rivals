#!/usr/bin/env bash
# ============================================================
#  Liga Rocket League - Arranque con AUTO-REINICIO
#  ------------------------------------------------------------
#  Este script inicia la web, y si el proceso se cae por
#  cualquier motivo, lo vuelve a levantar automáticamente.
#  Ideal para que la página "nunca se caiga".
#
#  Uso:
#    ./start.sh            (usa el puerto 12000 por defecto)
#    PORT=9000 ./start.sh  (usa otro puerto)
# ============================================================
set -u
cd "$(dirname "$0")"
PORT="${PORT:-12000}"

# inicializar BD y guardar la clave por defecto si no existe
python3 - <<'EOF'
import os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.getcwd())
import database
from config import ADMIN_PASS
database.init_db()
if not database.obtener_clave_admin():
    database.guardar_clave_admin(ADMIN_PASS)
    print("[init] Clave admin por defecto establecida.")
EOF

echo "==============================================="
echo "  Liga RL - Servidor (puerto $PORT)"
echo "  CTRL+C para detener."
echo "==============================================="

while true; do
  echo "[reinicio] lanzando gunicorn ..."
  bash run.sh
  echo "[aviso] El servidor se detuvo inesperadamente. Reiniciando en 2s..."
  sleep 2
done