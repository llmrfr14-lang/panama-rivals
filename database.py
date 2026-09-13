"""Capa de base de datos SQLite.

Toda la app lee/escribe por aqui. Usamos SQLite que es un solo archivo:
no depende de servidores externos, corre sin red y nunca se cae.
"""
import os
import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime

from config import DATA_DIR, DB_PATH, BACKUP_DIR

ESTADISTICAS_KEYS = ("goles", "asistencias", "tiros", "salvadas", "puntos")


def _ensure_dirs():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(BACKUP_DIR, exist_ok=True)


@contextmanager
def get_db():
    _ensure_dirs()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


SCHEMA = """
CREATE TABLE IF NOT EXISTS temporadas (
    id INTEGER PRIMARY KEY,
    nombre TEXT UNIQUE NOT NULL,
    activa INTEGER NOT NULL DEFAULT 0,
    creado TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS equipos (
    id INTEGER PRIMARY KEY,
    temporada_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    abrev TEXT,
    color TEXT DEFAULT '#2ecc71',
    creado TEXT DEFAULT (datetime('now')),
    UNIQUE(temporada_id, nombre),
    FOREIGN KEY (temporada_id) REFERENCES temporadas(id)
);

CREATE TABLE IF NOT EXISTS jugadores (
    id INTEGER PRIMARY KEY,
    equipo_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    es_capitan INTEGER DEFAULT 0,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS partidos (
    id INTEGER PRIMARY KEY,
    temporada_id INTEGER NOT NULL,
    jornada INTEGER NOT NULL,
    fecha TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    -- equipos
    local_id INTEGER,
    visitante_id INTEGER,
    goles_local INTEGER DEFAULT 0,
    goles_visitante INTEGER DEFAULT 0,
    -- penales si aplica (dejar nulo si no)
    penales_local INTEGER,
    penales_visitante INTEGER,
    notas TEXT,
    FOREIGN KEY (temporada_id) REFERENCES temporadas(id),
    FOREIGN KEY (local_id) REFERENCES equipos(id),
    FOREIGN KEY (visitante_id) REFERENCES equipos(id)
);

CREATE TABLE IF NOT EXISTS stats_jugador_partido (
    id INTEGER PRIMARY KEY,
    partido_id INTEGER NOT NULL,
    jugador_id INTEGER NOT NULL,
    goles INTEGER DEFAULT 0,
    asistencias INTEGER DEFAULT 0,
    tiros INTEGER DEFAULT 0,
    salvadas INTEGER DEFAULT 0,
    puntos INTEGER DEFAULT 0,
    UNIQUE(partido_id, jugador_id),
    FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
    FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
    clave TEXT PRIMARY KEY,
    valor TEXT
);
"""


def init_db():
    _ensure_dirs()
    with get_db() as db:
        db.executescript(SCHEMA)
        db.execute(
            "INSERT OR IGNORE INTO temporadas(nombre, activa) VALUES (?, ?)",
            ("Temporada 3", 1),
        )
    # config.bootstrap_admin no se toca aqui


def guardar_clave_admin(clave):
    with get_db() as db:
        db.execute(
            "INSERT OR REPLACE INTO settings(clave, valor) VALUES ('admin_pass', ?)",
            (clave,),
        )


def obtener_clave_admin() -> str:
    with get_db() as db:
        row = db.execute(
            "SELECT valor FROM settings WHERE clave='admin_pass'"
        ).fetchone()
    return row["valor"] if row else ""


def backup_db():
    _ensure_dirs()
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = os.path.join(BACKUP_DIR, f"liga_{stamp}.db")
    try:
        import shutil

        if os.path.exists(DB_PATH):
            shutil.copy2(DB_PATH, dest)
    except Exception:
        pass
    # mantener solo los ultimos 30 backups
    backups = sorted(
        f for f in os.listdir(BACKUP_DIR) if f.endswith(".db")
    )
    for old in backups[:-30]:
        try:
            os.remove(os.path.join(BACKUP_DIR, old))
        except Exception:
            pass
    return dest


def listar_backups():
    _ensure_dirs()
    return sorted(
        (f for f in os.listdir(BACKUP_DIR) if f.endswith(".db")),
        reverse=True,
    )