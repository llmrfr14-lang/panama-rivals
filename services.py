"""Logica de negocio: equipos, calendario, partidos y estadisticas.

Separada de la web para que sea facil probar y mantener; nada depende
de Flask aqui.
"""
import json
import re
from datetime import datetime

from database import get_db, ESTADISTICAS_KEYS

# ---------------------------------------------------------------------------
# Temporadas
# ---------------------------------------------------------------------------


def listar_temporadas():
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM temporadas ORDER BY id"
        ).fetchall()
    return [dict(r) for r in rows]


def temporada_activa():
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM temporadas WHERE activa = 1 LIMIT 1"
        ).fetchone()
    return dict(row) if row else None


def obtener_temporada(tid):
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM temporadas WHERE id = ?", (tid,)
        ).fetchone()
    return dict(row) if row else None


def crear_temporada(nombre, activa=False):
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO temporadas(nombre, activa) VALUES (?, ?)",
            (nombre, 1 if activa else 0),
        )
        tid = cur.lastrowid
        if activa:
            db.execute("UPDATE temporadas SET activa = 0")
            db.execute("UPDATE temporadas SET activa = 1 WHERE id = ?", (tid,))
    return tid


def activar_temporada(tid):
    with get_db() as db:
        db.execute("UPDATE temporadas SET activa = 0")
        db.execute("UPDATE temporadas SET activa = 1 WHERE id = ?", (tid,))


# ---------------------------------------------------------------------------
# Equipos y jugadores
# ---------------------------------------------------------------------------


def listar_equipos(temporada_id):
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM equipos WHERE temporada_id = ? ORDER BY nombre",
            (temporada_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def obtener_equipo(eid):
    with get_db() as db:
        row = db.execute("SELECT * FROM equipos WHERE id = ?", (eid,)).fetchone()
    return dict(row) if row else None


def crear_equipo(temporada_id, nombre, abrev="", color=""):
    color = color or "#2ecc71"
    abrev = abrev or nombre[:3].upper()
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO equipos(temporada_id, nombre, abrev, color) VALUES (?,?,?,?)",
            (temporada_id, nombre, abrev, color),
        )
        eid = cur.lastrowid
    return eid


def editar_equipo(eid, nombre, abrev="", color=""):
    with get_db() as db:
        db.execute(
            "UPDATE equipos SET nombre=?, abrev=?, color=? WHERE id=?",
            (nombre, abrev, color, eid),
        )


def eliminar_equipo(eid):
    with get_db() as db:
        db.execute("DELETE FROM equipos WHERE id = ?", (eid,))


def jugadores_equipo(equipo_id):
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM jugadores WHERE equipo_id = ? ORDER BY nombre",
            (equipo_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def agregar_jugador(equipo_id, nombre, es_capitan=False):
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO jugadores(equipo_id, nombre, es_capitan) VALUES (?,?,?)",
            (equipo_id, nombre, 1 if es_capitan else 0),
        )
    return cur.lastrowid


def eliminar_jugador(jid):
    with get_db() as db:
        db.execute("DELETE FROM jugadores WHERE id = ?", (jid,))


# ---------------------------------------------------------------------------
# Partidos
# ---------------------------------------------------------------------------


def crear_partido(temporada_id, jornada, local_id, visitante_id, fecha="", estado="pendiente"):
    with get_db() as db:
        cur = db.execute(
            """INSERT INTO partidos
               (temporada_id, jornada, local_id, visitante_id, fecha, estado)
               VALUES (?,?,?,?,?,?)""",
            (temporada_id, jornada, local_id, visitante_id, fecha or None, estado),
        )
    return cur.lastrowid


def obtener_partido(pid):
    with get_db() as db:
        row = db.execute("SELECT * FROM partidos WHERE id = ?", (pid,)).fetchone()
    return dict(row) if row else None


def listar_partidos_temporada(temporada_id):
    with get_db() as db:
        rows = db.execute(
            """SELECT p.*, l.nombre AS local_nombre, l.abrev AS local_abrev,
                      l.color AS local_color,
                      v.nombre AS visitante_nombre, v.abrev AS visitante_abrev,
                      v.color AS visitante_color
               FROM partidos p
               LEFT JOIN equipos l ON l.id = p.local_id
               LEFT JOIN equipos v ON v.id = p.visitante_id
               WHERE p.temporada_id = ?
               ORDER BY p.jornada, p.id""",
            (temporada_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def listar_partidos_equipo(equipo_id):
    with get_db() as db:
        rows = db.execute(
            """SELECT p.*, l.nombre AS local_nombre, l.abrev AS local_abrev,
                      l.color AS local_color,
                      v.nombre AS visitante_nombre, v.abrev AS visitante_abrev,
                      v.color AS visitante_color
               FROM partidos p
               LEFT JOIN equipos l ON l.id = p.local_id
               LEFT JOIN equipos v ON v.id = p.visitante_id
               WHERE p.local_id = ? OR p.visitante_id = ?
               ORDER BY p.jornada, p.id""",
            (equipo_id, equipo_id),
        ).fetchall()
    return [dict(r) for r in rows]


def registrar_resultado(pid, goles_local, goles_visitante,
                        penales_local=None, penales_visitante=None,
                        fecha="", notas="", stats_local=None, stats_visitante=None,
                        estado="jugado"):
    """Registra el resultado de un partido y sus estadisticas por jugador.

    stats_local / stats_visitante: listas de dicts:
        {"jugador_id": int, "goles":..,"asistencias":..,"tiros":..,"salvadas":..,"puntos":..}
    """
    with get_db() as db:
        db.execute(
            """UPDATE partidos SET goles_local=?, goles_visitante=?,
                   penales_local=?, penales_visitante=?,
                   fecha=?, notas=?, estado=?
               WHERE id=?""",
            (goles_local, goles_visitante, penales_local, penales_visitante,
             fecha or None, notas or None, estado, pid),
        )
        db.execute("DELETE FROM stats_jugador_partido WHERE partido_id = ?", (pid,))
        for jug in (stats_local or []) + (stats_visitante or []):
            jid = jug.get("jugador_id")
            if not jid:
                continue
            db.execute(
                """INSERT INTO stats_jugador_partido
                   (partido_id, jugador_id, goles, asistencias, tiros, salvadas, puntos)
                   VALUES (?,?,?,?,?,?,?)""",
                (pid, jid,
                 int(jug.get("goles") or 0),
                 int(jug.get("asistencias") or 0),
                 int(jug.get("tiros") or 0),
                 int(jug.get("salvadas") or 0),
                 int(jug.get("puntos") or 0)),
            )


def eliminar_partido(pid):
    with get_db() as db:
        db.execute("DELETE FROM partidos WHERE id = ?", (pid,))


def partidos_pendientes(temporada_id):
    with get_db() as db:
        rows = db.execute(
            """SELECT p.*, l.nombre AS local_nombre, v.nombre AS visitante_nombre
               FROM partidos p
               LEFT JOIN equipos l ON l.id = p.local_id
               LEFT JOIN equipos v ON v.id = p.visitante_id
               WHERE p.temporada_id = ? AND p.estado = 'pendiente'
               ORDER BY p.jornada, p.id""",
            (temporada_id,),
        ).fetchall()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Calendario round-robin (todos contra todos, ida y vuelta)
# ---------------------------------------------------------------------------


def generar_calendario(temporada_id, equipos):
    """Genera calendario de todos contra todos (ida) y devuelve los partidos.

    equipos: lista de ids. Si ya existen partidos en ese temporada_id con
    estado distinto de 'pendiente' no se repiten; se rellenan los que falten.
    """
    n = len(equipos)
    if n < 2:
        return []
    ids = list(equipos)
    if n % 2 == 1:
        ids.append(None)  # bye (descanso)

    rondas_ids = []
    m = len(ids)
    half = m // 2
    for ronda in range(m - 1):
        pares = []
        for i in range(half):
            a = ids[i]
            b = ids[m - 1 - i]
            if a and b:
                if ronda % 2 == 1:
                    a, b = b, a
                pares.append((a, b))
        rondas_ids.append(pares)
        ids.insert(1, ids.pop())

    with get_db() as db:
        # cuantos partidos hay ya por jornada
        existentes = {
            r["jornada"]: r["n"]
            for r in db.execute(
                "SELECT jornada, COUNT(*) n FROM partidos WHERE temporada_id=? GROUP BY jornada",
                (temporada_id,),
            ).fetchall()
        }

    creados = []
    for ronda, pares in enumerate(rondas_ids, start=1):
        for local_id, visitante_id in pares:
            creados.append((ronda, local_id, visitante_id))

    # marcamos jornadas ya completadas para no duplicar
    con_equipos = [e for e in equipos if e]
    total_partidos_esperados = len(con_equipos) * (len(con_equipos) - 1) // 2
    ya_creados = sum(existentes.values())
    if ya_creados >= total_partidos_esperados:
        return []

    # crear los faltantes (revisamos si ya existe esa pareja en esa jornada)
    with get_db() as db:
        for jornada, local_id, visitante_id in creados:
            existe = db.execute(
                """SELECT 1 FROM partidos
                   WHERE temporada_id=? AND jornada=? AND local_id=? AND visitante_id=?""",
                (temporada_id, jornada, local_id, visitante_id),
            ).fetchone()
            if existe:
                continue
            db.execute(
                """INSERT INTO partidos(temporada_id, jornada, local_id, visitante_id, estado)
                   VALUES (?,?,?,?, 'pendiente')""",
                (temporada_id, jornada, local_id, visitante_id),
            )
    return creados


# ---------------------------------------------------------------------------
# Tabla de posiciones y estadisticas
# ---------------------------------------------------------------------------


def tabla_posiciones(temporada_id):
    equipos = {e["id"]: e for e in listar_equipos(temporada_id)}
    filas = {eid: {
        "equipo_id": eid, "nombre": e["nombre"], "abrev": e["abrev"],
        "color": e["color"],
        "pj": 0, "pg": 0, "pe": 0, "pp": 0,
        "gf": 0, "gc": 0, "dg": 0, "pts": 0,
        "racha": "",
    } for eid, e in equipos.items()}

    partidos = listar_partidos_temporada(temporada_id)
    for p in partidos:
        if p["estado"] != "jugado":
            continue
        l, v = p["local_id"], p["visitante_id"]
        gl, gv = p["goles_local"], p["goles_visitante"]
        if p["penales_local"] is not None:
            # victoria por penales = 2 puntos, derrota por penales = 1
            pl, pv = p["penales_local"], p["penales_visitante"]
            for eid, g, p_pen in ((l, gl, pl), (v, gv, pv)):
                filas[eid]["pj"] += 1
                filas[eid]["gf"] += g
                filas[eid]["gc"] += gv if eid == l else gl
                if p_pen > (pv if eid == l else pl):
                    filas[eid]["pg"] += 1
                    filas[eid]["pts"] += 2
                else:
                    filas[eid]["pp"] += 1
                    filas[eid]["pts"] += 1
                filas[eid]["dg"] = filas[eid]["gf"] - filas[eid]["gc"]
            continue
        # empate -> 1 punto c/u, victoria -> 3
        if gl == gv:
            filas[l]["pe"] += 1
            filas[v]["pe"] += 1
            filas[l]["pts"] += 1
            filas[v]["pts"] += 1
        elif gl > gv:
            filas[l]["pg"] += 1
            filas[l]["pts"] += 3
            filas[v]["pp"] += 1
        else:
            filas[v]["pg"] += 1
            filas[v]["pts"] += 3
            filas[l]["pp"] += 1
        filas[l]["pj"] += 1
        filas[v]["pj"] += 1
        filas[l]["gf"] += gl
        filas[l]["gc"] += gv
        filas[v]["gf"] += gv
        filas[v]["gc"] += gl
        filas[l]["dg"] = filas[l]["gf"] - filas[l]["gc"]
        filas[v]["dg"] = filas[v]["gf"] - filas[v]["gc"]

    # racha: ultimos partidos jugados (hasta 5) de cada equipo
    for eid in filas:
        racha = []
        for p in partidos:
            if p["estado"] != "jugado":
                continue
            if p["local_id"] == eid or p["visitante_id"] == eid:
                racha.append(p)
        racha = racha[-5:]
        letras = []
        for p in racha:
            gl = p["goles_local"]
            gv = p["goles_visitante"]
            if p["local_id"] == eid:
                if gl > gv:
                    letras.append("G")
                elif gl < gv:
                    letras.append("P")
                else:
                    letras.append("E")
            else:
                if gv > gl:
                    letras.append("G")
                elif gv < gl:
                    letras.append("P")
                else:
                    letras.append("E")
        filas[eid]["racha"] = "".join(letras)

    orden = sorted(
        filas.values(),
        key=lambda f: (f["pts"], f["dg"], f["gf"], -f["gc"]),
        reverse=True,
    )
    for i, f in enumerate(orden, start=1):
        f["pos"] = i
    return orden


def estadisticas_jugadores(temporada_id, minimo_partidos=0):
    """Acumula estadisticas de cada jugador en una temporada."""
    with get_db() as db:
        rows = db.execute(
            """SELECT j.id AS jugador_id, j.nombre, j.equipo_id, e.nombre AS equipo,
                      e.abrev, e.color,
                      COUNT(sp.id) AS partidos,
                      SUM(sp.goles) AS goles,
                      SUM(sp.asistencias) AS asistencias,
                      SUM(sp.tiros) AS tiros,
                      SUM(sp.salvadas) AS salvadas,
                      SUM(sp.puntos) AS puntos
               FROM jugadores j
               JOIN equipos e ON e.id = j.equipo_id
               JOIN stats_jugador_partido sp ON sp.jugador_id = j.id
               JOIN partidos p ON p.id = sp.partido_id
               WHERE e.temporada_id = ? AND p.estado = 'jugado'
               GROUP BY j.id
               ORDER BY puntos DESC, goles DESC""",
            (temporada_id,),
        ).fetchall()
    out = []
    for r in rows:
        d = dict(r)
        d["jugador_id"] = r["jugador_id"]
        out.append(d)
    if minimo_partidos:
        out = [d for d in out if d["partidos"] >= minimo_partidos]
    return out


