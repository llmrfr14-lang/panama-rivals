"""Lector de capturas de pantalla del scoreboard (OCR 100% local).

Usa Tesseract instalado en la máquina: no llama a ninguna API externa,
por lo que nunca se cae por falta de internet o de crédito.
"""
import io
import os
import shutil
import subprocess

from PIL import Image, ImageOps, ImageFilter

try:
    import pytesseract
except Exception:  # pragma: no cover - permite importar sin tesseract
    pytesseract = None

# localizar el binario de tesseract (Path puede variar según el host)
_TESSERACT_CMD = (
    shutil.which("tesseract")
    or "/usr/bin/tesseract"
    or "/usr/local/bin/tesseract"
)
if pytesseract is not None and os.path.exists(_TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = _TESSERACT_CMD


def disponible() -> bool:
    return pytesseract is not None and os.path.exists(_TESSERACT_CMD)


def _preprocesar(img: Image.Image) -> Image.Image:
    """Ajusta la imagen para que Tesseract lea mejor el marcador."""
    img = ImageOps.exif_transpose(img)
    img = img.convert("L")  # escala de grises
    w, h = img.size
    # si es muy pequeña, agrandamos (los textos de scoreboard son finos)
    if min(w, h) < 900:
        escala = 900 / min(w, h)
        img = img.resize((int(w * escala), int(h * escala)), Image.LANCZOS)
    img = ImageOps.autocontrast(img, cutoff=2)
    img = img.filter(ImageFilter.SHARPEN)
    return img


def ocr_texto(data_bytes: bytes, psm: int = 6) -> str:
    """Recibe los bytes de una imagen y devuelve el texto detectado."""
    if not disponible():
        raise RuntimeError("Tesseract no está instalado en el servidor")
    img = _preprocesar(Image.open(io.BytesIO(data_bytes)))
    texto = pytesseract.image_to_string(
        img,
        lang="spa+eng",
        config=f"--psm {psm}",
    )
    return "\n".join(
        l.strip() for l in (texto or "").splitlines() if l.strip()
    )


def text_from_bytes(data_bytes: bytes) -> str:
    """Intenta varios modos de lectura y devuelve el que más texto útil dé."""
    candidatos = []
    for psm in (6, 11, 4):
        try:
            candidatos.append(ocr_texto(data_bytes, psm=psm))
        except Exception:
            continue
    # elegir el candidato con más líneas tipo "Equipo n - n Equipo"
    mejor = ""
    mejor_score = -1
    patron = " - "  # el marcador separa con guiones
    for c in candidatos:
        score = sum(1 for l in c.splitlines() if patron in l or ": " in l)
        if score > mejor_score or (score == mejor_score and len(c) > len(mejor)):
            mejor, mejor_score = c, score
    return mejor