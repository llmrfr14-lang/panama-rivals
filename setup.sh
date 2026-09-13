#!/usr/bin/env bash
# ============================================================
#  Liga Rocket League - Instalación
#  ------------------------------------------------------------
#  Prepara el servidor: instala Tesseract (OCR local para leer
#  capturas de pantalla) y las dependencias Python.
#
#  Uso:  ./setup.sh
# ============================================================
set -e
cd "$(dirname "$0")"

echo "[1/3] Instalando tesseract (OCR local + idiomas)..."
if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq tesseract-ocr tesseract-ocr-spa tesseract-ocr-eng
elif command -v brew >/dev/null 2>&1; then
  brew install tesseract
else
  echo "⚠ no detecté apt-get ni brew; instala tesseract-ocr manualmente."
fi

echo "[2/3] Instalando dependencias Python..."
pip install -r requirements.txt

echo "[3/3] Verificando OCR..."
python3 - <<'EOF'
import vision
import sys
if vision.disponible():
    print("  ✅ Tesseract listo: podrás subir capturas de pantalla.")
else:
    print("  ⚠ Tesseract no disponible; lectura de capturas deshabilitada.")
EOF

echo "Listo. Arranca con:  ./start.sh"