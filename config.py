import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "liga.db")
BACKUP_DIR = os.path.join(DATA_DIR, "backups")

# Cambiar en producción por una clave segura
SECRET_KEY = os.environ.get("SECRET_KEY", "cambia-esto-en-produccion-2026")
# Clave del panel de administración
ADMIN_PASS = os.environ.get("ADMIN_PASS", "admin1234")

# Dejar 1 para la seed del admin la primera vez
MAX_EQUIPOS = 6
FORMATO_SERIES = "RL"