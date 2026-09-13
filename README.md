# 🏆 Liga Rocket League — Web oficial

Página web para gestionar tu liga de **Rocket League** (temporada 3 y más),
con scoreboard estilo Rocket League, tabla de posiciones, estadísticas por
jugador (goles, asistencias, tiros, salvadas, puntos), calendario automático,
historial de temporadas y panel de administración.

**Diseñada para no caerse**: usa SQLite (un solo archivo), no depende de
servicios externos, y tiene auto-reinicio y backups.

---

## 🚀 Cómo levantar la página

### Rápido (recomendado)
```bash
./start.sh
```
Este script:
1. Inicializa la base de datos (si no existe).
2. Deja la clave de administrador por defecto `admin1234` la primera vez.
3. Lanza el servidor **y lo reinicia automáticamente** si alguna vez se cae.

La web quedará en `http://localhost:12000` (o el puerto que indiques con
`PORT=9000 ./start.sh`).

### Directo (sin auto-reinicio)
```bash
bash run.sh
```

---

## 🔑 Acceso de administración

- Entra a `http://localhost:12000/admin/login`
- Clave por defecto: `admin1234`
- **Cambia la clave desde el panel** → sección "🔐 Seguridad".

> Si cambias la variable de entorno `ADMIN_PASS`, se usa esa al iniciar una
> base nueva. La clave guardada en el panel tiene prioridad.

---

## 🧭 Cómo usar (flujo del organizador)

1. **Panel → Equipos**: crea los equipos y agrega sus 2 jugadores (2v2).
2. **Panel → Calendario**: pulsa "⚡ Generar jornadas" (todos contra todos,
   ida y vuelta, automático). También puedes agregar partidos sueltos.
3. **Panel → Resultados**: dos formas de subir resultados:
   - **🤖 Asistente IA**: pega el texto (ej: `Puma Titans 3 - 2 Neon Wolves`),
     la página lo interpreta y te lo muestra para confirmar.
   - **✍️ Manual**: elige el partido, pon el marcador y las estadísticas por
     jugador (goles, asistencias, tiros, salvadas, puntos).
4. **Panel → Temporadas**: crea y activa temporadas. Toda temporada queda
   guardada automáticamente en el **Historial**.

---

## 🤖 ¿Cómo funciona el "asistente IA"?

No usa un servidor de IA externo (por eso jamás se cae por eso): corre
**100% en tu servidor**. Tiene dos formas de usarse:

1. **Pegar texto**: escribe el resultado (ej: `Puma Titans 3 - 2 Neon Wolves`)
   y pulsa **"Interpretar texto"**.
2. **🖼 Subir captura**: sube una **captura de pantalla** del marcador final de
   Rocket League. Se usa OCR local (Tesseract) para leer el texto de la imagen,
   se reconocen los equipos y el marcador, y se precarga el formulario.

En ambos casos la IA encuentra el partido pendiente correspondiente y te lo
muestra para que presiones **"Aplicar ✓"**. Puedes corregir el marcador antes
de aplicar. Si no se interpreta, la página te avisa y usas el formulario manual.

> Requisito para la lectura de capturas: tener `tesseract` instalado en el
> servidor (`sudo apt-get install -y tesseract-ocr tesseract-ocr-spa`).
> Los requisitos Python (`pytesseract`, `Pillow`) están en `requirements.txt`.

---

## 📁 Estructura

```
├── app.py          → rutas y lógica web (Flask)
├── services.py     → lógica de negocio (tablas, calendario, IA texto)
├── database.py     → capa SQLite + backups
├── config.py       → configuración (claves, rutas)
├── wsgi.py         → entrada para gunicorn
├── run.sh          → lanza gunicorn
├── start.sh        → inicia con auto-reinicio
├── templates/      → vistas (públicas + admin)
├── static/css/     → estilos
└── data/           → base de datos + backups automáticos
└── vision.py       → lector OCR local (tesseract) para capturas
```

---

## 💾 Backups

- La base de datos es un archivo: `data/liga.db`.
- Cada vez que entras al panel o haces un backup manual (botón "💾 Hacer
  backup"), se guarda una copia en `data/backups/`.
- Se conservan las últimas 30 copias. Puedes restaurar reemplazando el archivo
  `data/liga.db` por una copia (con el servidor detenido).

---

## ⚙️ Soporte para "equipos variables"

La liga permite **cualquier número de equipos** (par o impar). El generador de
jornadas crea todos contra todos, ida y vuelta. Si un equipo se inscribe a
mitad de temporada, simplemente créalo en "Equipos" y vuelve a generar el
calendario: solo se agregarán los partidos que falten.

---

## 🧪 Probar todo rápido (para desarrolladores)

```bash
pip install -r requirements.txt
python3 -c "import database; database.init_db()"
bash run.sh
# abre http://localhost:12000
```