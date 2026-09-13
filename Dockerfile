# ============================================================
#  Liga Rocket League — imagen Docker
#  ------------------------------------------------------------
#  Incluye la app + Tesseract (OCR local para leer capturas).
#  Se despliega igual en Render, Railway, Fly.io, Hugging Face,
#  cualquier VPS o tu propia máquina.
# ============================================================
FROM python:3.11-slim

# --- 1. Herramientas del sistema + Tesseract (OCR) ---
RUN apt-get update && apt-get install -y --no-install-recommends \
        tesseract-ocr \
        tesseract-ocr-spa \
        tesseract-ocr-eng \
        curl \
    && rm -rf /var/lib/apt/lists/*

# --- 2. App ---
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# la BD vive en data/ (podrás montar un volumen ahí para persistir)
RUN mkdir -p data backups

# --- 3. Puerto y arranque ---
ENV PORT=12000
ENV PYTHONUNBUFFERED=1

EXPOSE 12000

# salud: usa un script sencillo de flask + gunicorn
CMD ["sh", "-c", "python3 -m gunicorn --chdir /app -w ${WORKERS:-2} -b 0.0.0.0:${PORT:-12000} --timeout 60 wsgi:application"]