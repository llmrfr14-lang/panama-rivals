import os
import re
import functools

from flask import (
    Flask, render_template, request, redirect, url_for, session,
    flash, jsonify, abort, send_from_directory,
)

import services
import database
import vision  # lector OCR local (tesseract)
from config import SECRET_KEY, ADMIN_PASS, DATA_DIR, BACKUP_DIR

app = Flask(__name__)
app.secret_key = SECRET_KEY


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def temporada_contexto():
    """Devuelve temporada activa + lista de temporadas para la barra."""
    activa = services.temporada_activa()
    return {
        "temporada": activa,
        "temporadas": services.listar_temporadas(),
    }


@app.context_processor
def inject_globals():
    ctx = temporada_contexto()
    return {
        "TEMP_ACTIVA": ctx["temporada"],
        "TEMP_LISTA": ctx["temporadas"],
    }


def login_requerido(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("admin"):
            return redirect(url_for("admin_login"))
        return f(*args, **kwargs)
    return wrapper


def jornadas_datos(temporada_id):
    """Agrupa los partidos de una temporada por jornada."""
    partidos = services.listar_partidos_temporada(temporada_id)
    jornadas = {}
    for p in partidos:
        jornadas.setdefault(p["jornada"], []).append(p)
    return partidos, jornadas


def id_nombre_por_equipo(temporada_id):
    return {
        e["id"]: e
        for e in services.listar_equipos(temporada_id)
    }


# ---------------------------------------------------------------------------
# Vistas publicas
# ---------------------------------------------------------------------------


@app.route("/")
def index():
    ctx = temporada_contexto()
    t = ctx["temporada"]
    if not t:
        return render_template("public/index.html", datos=None)
    jugadores = services.estadisticas_jugadores(t["id"])
    partidos, jornadas = jornadas_datos(t["id"])
    return render_template(
        "public/index.html",
        datos={
            "tabla": services.tabla_posiciones(t["id"]),
            "jugadores": jugadores,
            "equipos": services.listar_equipos(t["id"]),
            "partidos": partidos,
            "jornadas": jornadas,
            "comentario": "Temporada {0}".format(t["nombre"]),
        },
    )


@app.route("/posiciones")
def posiciones():
    t = temporada_contexto()["temporada"]
    if not t:
        return render_template("public/posiciones.html", tabla=[], equipos=[])
    return render_template(
        "public/posiciones.html",
        tabla=services.tabla_posiciones(t["id"]),
        equipos=services.listar_equipos(t["id"]),
    )


@app.route("/calendario")
def calendario():
    t = temporada_contexto()["temporada"]
    if not t:
        return render_template("public/calendario.html", jornadas={}, equipos={})
    partidos, jornadas = jornadas_datos(t["id"])
    return render_template(
        "public/calendario.html",
        jornadas=jornadas,
        equipos=id_nombre_por_equipo(t["id"]),
    )


@app.route("/estadisticas")
def estadisticas():
    t = temporada_contexto()["temporada"]
    if not t:
        return render_template("public/estadisticas.html", jugadores=[])
    return render_template(
        "public/estadisticas.html",
        jugadores=services.estadisticas_jugadores(t["id"]),
    )


@app.route("/equipos")
def equipos():
    t = temporada_contexto()["temporada"]
    if not t:
        return render_template("public/equipos.html", equipos=[])
    equipos = services.listar_equipos(t["id"])
    detalle = []
    for e in equipos:
        detalle.append({
            "equipo": e,
            "jugadores": services.jugadores_equipo(e["id"]),
            "partidos": services.listar_partidos_equipo(e["id"]),
        })
    return render_template("public/equipos.html", detalle=detalle)


@app.route("/equipo/<int:eid>")
def equipo_detalle(eid):
    t = temporada_contexto()["temporada"]
    e = services.obtener_equipo(eid)
    if not e:
        abort(404)
    return render_template(
        "public/equipo.html",
        equipo=e,
        jugadores=services.jugadores_equipo(eid),
        partidos=services.listar_partidos_equipo(eid),
    )


@app.route("/historial")
def historial():
    temporadas = services.listar_temporadas()
    datos_temporadas = []
    for t in temporadas:
        # posiciones solo si hay equipos y partidos
        equipos = services.listar_equipos(t["id"])
        partidos = services.listar_partidos_temporada(t["id"])
        datos_temporadas.append({
            "temporada": t,
            "equipos": equipos,
            "partidos": partidos,
            "tabla": services.tabla_posiciones(t["id"]) if equipos else [],
            "jugadores_estadisticas": services.estadisticas_jugadores(t["id"]),
        })
    return render_template(
        "public/historial.html",
        temporadas=datos_temporadas,
    )


@app.route("/partido/<int:pid>")
def partido_detalle(pid):
    p = services.obtener_partido(pid)
    if not p:
        abort(404)
    with database.get_db() as db:
        stats_rows = db.execute(
            """SELECT sp.*, j.nombre AS jugador, j.equipo_id,
                      e.nombre AS equipo, e.abrev, e.color
               FROM stats_jugador_partido sp
               JOIN jugadores j ON j.id = sp.jugador_id
               JOIN equipos e ON e.id = j.equipo_id
               WHERE sp.partido_id = ?""",
            (pid,),
        ).fetchall()
    stats = [dict(r) for r in stats_rows]
    local_equipo = services.obtener_equipo(p["local_id"]) if p["local_id"] else None
    visita_equipo = services.obtener_equipo(p["visitante_id"]) if p["visitante_id"] else None
    return render_template(
        "public/partido.html",
        partido=p,
        stats=stats,
        local=local_equipo,
        visitante=visita_equipo,
    )


# ---------------------------------------------------------------------------
# Administracion
# ---------------------------------------------------------------------------


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        clave = request.form.get("clave", "")
        guardada = database.obtener_clave_admin()
        # si no hay clave guardada aún, se usa la de configuración
        referencia = guardada or ADMIN_PASS
        if clave == referencia:
            session["admin"] = True
            return redirect(url_for("admin_dashboard"))
        flash("Clave incorrecta", "error")
    return render_template("admin/login.html")


@app.route("/admin/clave", methods=["POST"])
@login_requerido
def admin_cambiar_clave():
    actual = request.form.get("actual", "")
    nueva = request.form.get("nueva", "")
    confirmar = request.form.get("confirmar", "")
    guardada = database.obtener_clave_admin()
    referencia = guardada or ADMIN_PASS
    if actual != referencia:
        flash("La clave actual no coincide", "error")
    elif len(nueva) < 4:
        flash("La clave nueva debe tener al menos 4 caracteres", "error")
    elif nueva != confirmar:
        flash("La confirmación no coincide", "error")
    else:
        database.guardar_clave_admin(nueva)
        flash("Clave de administrador actualizada", "ok")
    return redirect(url_for("admin_seguridad"))


@app.route("/admin/seguridad")
@login_requerido
def admin_seguridad():
    return render_template("admin/seguridad.html")


@app.route("/admin/logout")
def admin_logout():
    session.pop("admin", None)
    return redirect(url_for("index"))


@app.route("/admin")
@login_requerido
def admin_dashboard():
    t = temporada_contexto()["temporada"]
    return render_template(
        "admin/dashboard.html",
        temporada=t,
    )


@app.route("/admin/resultados", methods=["GET", "POST"])
@login_requerido
def admin_resultados():
    t = temporada_contexto()["temporada"]
    if not t:
        flash("Primero crea una temporada", "error")
        return redirect(url_for("admin_temporadas"))
    mensaje = None

    if request.method == "POST":
        pid = int(request.form.get("partido_id") or 0)
        goles_local = request.form.get("goles_local", "0") or "0"
        goles_visitante = request.form.get("goles_visitante", "0") or "0"
        estado = request.form.get("estado", "jugado")
        fecha = request.form.get("fecha", "").strip()
        notas = request.form.get("notas", "").strip()

        # estadisticas por jugador: {jugador_id: {g,a,t,s,p}}
        stats_local = []
        stats_visitante = []

        partido = services.obtener_partido(pid) if pid else None
        if not partido:
            flash("Partido no encontrado", "error")
            return redirect(url_for("admin_resultados"))
        local_id = partido["local_id"]

        # se lee del body: keys jug_goles_<jugador_id>, jug_asist_<jid>, ...
        for key, val in request.form.items():
            m = re.match(r"jug_(\w+)_(\d+)$", key)
            if not m:
                continue
            campo, jid = m.group(1), int(m.group(2))
            # averiguamos el equipo del jugador para clasificar local/visitante
            with database.get_db() as db:
                row = db.execute(
                    "SELECT equipo_id FROM jugadores WHERE id=?", (jid,)
                ).fetchone()
            if not row:
                continue
            eq = row["equipo_id"]
            target = stats_local if eq == local_id else stats_visitante
            entry = next(
                (x for x in target if x["jugador_id"] == jid),
                None,
            )
            if entry is None:
                entry = {
                    "jugador_id": jid,
                    "goles": 0, "asistencias": 0,
                    "tiros": 0, "salvadas": 0, "puntos": 0,
                }
                target.append(entry)
            campo_map = {
                "goles": "goles", "asist": "asistencias",
                "tiros": "tiros", "salv": "salvadas", "puntos": "puntos",
            }
            entry[campo_map.get(campo, campo)] = int(val or 0)
        services.registrar_resultado(
            pid, int(goles_local), int(goles_visitante),
            fecha=fecha, notas=notas, estado=estado,
            stats_local=stats_local, stats_visitante=stats_visitante,
        )
        flash("Resultado guardado correctamente", "ok")
        return redirect(url_for("admin_resultados"))

    partidos = services.listar_partidos_temporada(t["id"])
    equipos_por_id = id_nombre_por_equipo(t["id"])
    # adjuntar jugadores a cada partido para el formulario
    for p in partidos:
        p["jugadores_local"] = services.jugadores_equipo(p["local_id"]) if p["local_id"] else []
        p["jugadores_visitante"] = services.jugadores_equipo(p["visitante_id"]) if p["visitante_id"] else []
    texto_ini = request.args.get("texto", "")
    return render_template(
        "admin/resultados.html",
        partidos=partidos,
        equipos_por_id=equipos_por_id,
        temporada=t,
        texto_ini=texto_ini,
    )


@app.route("/admin/equipos", methods=["GET", "POST"])
@login_requerido
def admin_equipos():
    t = temporada_contexto()["temporada"]
    if not t:
        flash("Primero crea una temporada", "error")
        return redirect(url_for("admin_temporadas"))
    if request.method == "POST":
        accion = request.form.get("accion", "")
        if accion == "crear":
            nombre = request.form.get("nombre", "").strip()
            abrev = request.form.get("abrev", "").strip()
            color = request.form.get("color", "").strip()
            if nombre:
                services.crear_equipo(t["id"], nombre, abrev, color)
                flash("Equipo creado", "ok")
        elif accion == "editar":
            eid = int(request.form.get("equipo_id") or 0)
            nombre = request.form.get("nombre", "").strip()
            abrev = request.form.get("abrev", "").strip()
            color = request.form.get("color", "").strip()
            if eid and nombre:
                services.editar_equipo(eid, nombre, abrev, color)
                flash("Equipo actualizado", "ok")
        elif accion == "eliminar":
            eid = int(request.form.get("equipo_id") or 0)
            if eid:
                services.eliminar_equipo(eid)
                flash("Equipo eliminado", "ok")
        return redirect(url_for("admin_equipos"))
    equipos = services.listar_equipos(t["id"])
    for e in equipos:
        e["jugadores"] = services.jugadores_equipo(e["id"])
    return render_template(
        "admin/equipos.html",
        equipos=equipos,
        temporada=t,
    )


@app.route("/admin/equipo/<int:eid>/jugadores", methods=["POST"])
@login_requerido
def admin_jugadores(eid):
    accion = request.form.get("accion", "")
    if accion == "agregar":
        nombre = request.form.get("nombre", "").strip()
        capitan = request.form.get("es_capitan") == "1"
        if nombre:
            services.agregar_jugador(eid, nombre, capitan)
            flash("Jugador agregado", "ok")
    elif accion == "eliminar":
        jid = int(request.form.get("jugador_id") or 0)
        if jid:
            services.eliminar_jugador(jid)
            flash("Jugador eliminado", "ok")
    return redirect(url_for("admin_equipos"))

@app.route("/admin/calendario", methods=["GET", "POST"])
@login_requerido
def admin_calendario():
    t = temporada_contexto()["temporada"]
    if not t:
        flash("Primero crea una temporada", "error")
        return redirect(url_for("admin_temporadas"))
    if request.method == "POST":
        accion = request.form.get("accion", "")
        if accion == "generar":
            equipos_ids = [e["id"] for e in services.listar_equipos(t["id"])]
            creados = services.generar_calendario(t["id"], equipos_ids)
            flash(f"Calendario generado: {len(creados)} partidos", "ok")
        elif accion == "agregar" :
            jornada = int(request.form.get("jornada") or 1)
            local_id = int(request.form.get("local_id") or 0)
            visitante_id = int(request.form.get("visitante_id") or 0)
            if local_id and visitante_id and local_id != visitante_id:
                services.crear_partido(t["id"], jornada, local_id, visitante_id)
                flash("Partido agregado", "ok")
        elif accion == "eliminar":
            pid = int(request.form.get("partido_id") or 0)
            if pid:
                services.eliminar_partido(pid)
                flash("Partido eliminado", "ok")
        return redirect(url_for("admin_calendario"))
    return render_template(
        "admin/calendario.html",
        partidos=services.listar_partidos_temporada(t["id"]),
        equipos=services.listar_equipos(t["id"]),
        temporada=t,
    )


@app.route("/admin/temporadas", methods=["GET", "POST"])
@login_requerido
def admin_temporadas():
    if request.method == "POST":
        accion = request.form.get("accion", "")
        if accion == "crear":
            nombre = request.form.get("nombre", "").strip()
            activar = request.form.get("activa") == "1"
            if nombre:
                services.crear_temporada(nombre, activar)
                flash("Temporada creada", "ok")
        elif accion == "activar":
            tid = int(request.form.get("temporada_id") or 0)
            if tid:
                services.activar_temporada(tid)
                flash("Temporada activada", "ok")
        return redirect(url_for("admin_temporadas"))
    return render_template(
        "admin/temporadas.html",
        temporadas=services.listar_temporadas(),
    )


# ---------------------------------------------------------------------------
# IA lector de resultados (local y sin depender de servicios externos)
# ---------------------------------------------------------------------------


def _extraer_ids_jugadores(nombre):
    nombre_n = nombre.strip().lower().replace(".", "").replace(",", "")
    coincidencias = []
    # buscamos jugador por nombre posicional
    with database.get_db() as db:
        rows = db.execute(
            """SELECT j.id, j.nombre, j.equipo_id, e.nombre equipo
               FROM jugadores j JOIN equipos e ON e.id = j.equipo_id"""
        ).fetchall()
    for r in rows:
        if nombre_n in r["nombre"].lower():
            coincidencias.append({"id": r["id"], "equipo_id": r["equipo_id"]})
    return coincidencias


def _norma_equipo(txt):
    """Normaliza un nombre de equipo para buscar coincidencias.

    Quita acentos, pasa a minúscula y borra cualquier espacio.
    Sirve para OCR que sale todo junto: 'PUMATITANS' -> 'pumatitans'.
    """
    mapa = {
        "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u",
        "ñ": "n", "ü": "u",
    }
    txt = txt.lower().strip()
    for a, b in mapa.items():
        txt = txt.replace(a, b)
    return re.sub(r"\s+", "", txt)


def _buscar_equipo(txt_normalizado, equipos):
    """Encuentra el equipo cuyo nombre normalizado (sin espacios) coincida.

    `txt_normalizado` ya viene sin espacios. Compara contra el nombre del
    equipo normalizado igual (sin espacios) para tolerar OCR 'PUMATITANS'.
    """
    for e in equipos:
        if _norma_equipo(e["nombre"]) == txt_normalizado:
            return e
    for e in equipos:
        if txt_normalizado.startswith(_norma_equipo(e["nombre"])) or \
           _norma_equipo(e["nombre"]).startswith(txt_normalizado):
            return e
    return None


def interpretar_resultado_texto(texto, temporada_id):
    """Interpreta un texto/captura del resultado y devuelve candidatos.

    Devuelve una lista de dicts:
      {partido_id, goles_local, goles_visitante, stats: [...], confianza}
    """
    resultado = {"partidos": [], "mensaje": "", "confianza": 0}
    lineas = [l.strip() for l in (texto or "").splitlines() if l.strip()]
    # patrón: "EquipoA 3 - 2 EquipoB" (tolera el nombre unido sin espacios)
    pat = re.compile(r"^(?P<local>.+?)\s+(?P<gl>\d+)\s*[-:]\s*(?P<gv>\d+)\s+(?P<visit>.+)$")
    pendientes = services.partidos_pendientes(temporada_id)
    equipos = services.listar_equipos(temporada_id)

    for linea in lineas:
        m = pat.match(linea)
        if not m:
            continue
        local_txt = _norma_equipo(m.group("local"))
        visit_txt = _norma_equipo(m.group("visit"))
        gl, gv = int(m.group("gl")), int(m.group("gv"))

        local = _buscar_equipo(local_txt, equipos)
        visitante = _buscar_equipo(visit_txt, equipos)
        if not local or not visitante:
            continue
        # buscar el partido pendiente entre ambos
        partido = next(
            (p for p in pendientes
             if p["local_id"] == local["id"] and p["visitante_id"] == visitante["id"]),
            None,
        ) or next(
            (p for p in pendientes
             if p["visitante_id"] == local["id"] and p["local_id"] == visitante["id"]),
            None,
        )
        if not partido:
            continue
        # ALINEAR según la localía real del calendario, respetando el orden
        # del texto leído: el primer nombre es quien anotó `gl`.
        if partido["local_id"] == local["id"]:
            goles_local, goles_visitante = gl, gv
        else:
            # en el texto venía primero el equipo que en el calendario es visitante
            goles_local, goles_visitante = gv, gl
        resultado["partidos"].append({
            "partido_id": partido["id"],
            "goles_local": goles_local,
            "goles_visitante": goles_visitante,
            "stats": [],
            "confianza": 0.9,  # texto parseado
        })
    resultado["confianza"] = min(1.0, 0.9 if resultado["partidos"] else 0)
    if not resultado["partidos"]:
        resultado["mensaje"] = (
            "No pude interpretar ningún resultado. Usá el formato: "
            "Equipo 3 - 2 Equipo2"
        )
    return resultado


# endpooint para proponer interpretacion (sin guardar)
@app.route("/admin/ia/proponer", methods=["POST"])
@login_requerido
def ia_proponer():
    t = temporada_contexto()["temporada"]
    if not t:
        return jsonify({"error": "sin temporada"}), 400
    texto = request.form.get("texto", "")
    res = interpretar_resultado_texto(texto, t["id"])
    return jsonify(res)


@app.route("/admin/ia/lectura", methods=["POST"])
@login_requerido
def ia_lectura():
    """Recibe una captura de pantalla y devuelve el texto leído (OCR local)."""
    t = temporada_contexto()["temporada"]
    if "imagen" not in request.files:
        return jsonify({"error": "No se recibió ninguna imagen"}), 400
    archivo = request.files["imagen"]
    if not archivo.filename:
        return jsonify({"error": "Archivo vacío"}), 400
    datos = archivo.read()
    if not datos:
        return jsonify({"error": "El archivo está vacío"}), 400

    if not vision.disponible():
        return jsonify({
            "error": "El OCR local (tesseract) no está instalado en este servidor"
        }), 503

    try:
        texto = vision.text_from_bytes(datos)
        # además intentamos interpretar el resultado directamente
        res = interpretar_resultado_texto(texto, t["id"])
        res["texto_leido"] = texto
        return jsonify(res)
    except Exception as exc:
        return jsonify({"error": f"No pude leer la imagen: {exc}"}), 400


@app.route("/admin/ia/aplicar", methods=["POST"])
@login_requerido
def ia_aplicar():
    """Aplica lo que el usuario confirmó desde la propuesta de IA."""
    t = temporada_contexto()["temporada"]
    if not t:
        return jsonify({"error": "sin temporada"}), 400
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "JSON inválido"}), 400
    aplicados = 0
    for item in data.get("partidos", []):
        pid = int(item.get("partido_id") or 0)
        gl = int(item.get("goles_local", 0))
        gv = int(item.get("goles_visitante", 0))
        p = services.obtener_partido(pid)
        if not p or p["temporada_id"] != t["id"]:
            continue
        stats_local = item.get("stats_local") or []
        stats_visitante = item.get("stats_visitante") or []
        services.registrar_resultado(
            pid, gl, gv,
            fecha=item.get("fecha", "") or "",
            notas=item.get("notas", "") or "",
            estado="jugado",
            stats_local=stats_local,
            stats_visitante=stats_visitante,
        )
        aplicados += 1
    return jsonify({"ok": True, "aplicados": aplicados})


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

@app.route("/admin/backup", methods=["POST"])
@login_requerido
def admin_backup():
    dest = database.backup_db()
    flash(f"Backup creado: {os.path.basename(dest)}", "ok")
    return redirect(url_for("admin_dashboard"))


@app.route("/robots.txt")
def robots():
    return "User-agent: *\nDisallow: /admin\n", 200, {"Content-Type": "text/plain"}


@app.route("/healthz")
def healthz():
    """Endpoint de salud: comprueba que la DB responde y el OCR está listo.

    Usado por el servicio de hosting (Render/Railway/Fly) para
    monitorear que la web esté viva y reiniciarla si algo falla.
    """
    db_ok = True
    try:
        with database.get_db() as db:
            db.execute("SELECT 1").fetchone()
    except Exception:
        db_ok = False
    status = 200 if db_ok else 503
    activa = services.temporada_activa()
    return jsonify({
        "ok": db_ok,
        "db": db_ok,
        "ocr": vision.disponible(),
        "temporada": activa["nombre"] if activa else None,
    }), status


if __name__ == "__main__":
    database.init_db()
    # guardar admin pass por defecto en settings la primera vez
    from config import ADMIN_PASS
    existing = database.obtener_clave_admin()
    if not existing:
        database.guardar_clave_admin(ADMIN_PASS)
    port = int(os.environ.get("PORT", 12000))
    app.run(host="0.0.0.0", port=port, debug=False)