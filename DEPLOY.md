# 🚀 Desplegar la Liga Rocket League (con dominio propio y permanente)

Esta guía te muestra cómo montar la web en un servicio de hosting
**gratuito, estable y que no expira**, con tu propio dominio.

> La web usa **SQLite** (un archivo). Para que los datos **no se borren**
> cuando el servicio reinicia, tienes que montar el volumen de datos.
> Sigue estos pasos con cuidado: es lo más importante de todo.

---

## 🧭 ¿Qué voy a usar?

| Servicio | Dominio que te da | Volumen gratis | Bueno si... |
|----------|-------------------|----------------|-------------|
| **Render** | `tu-app.onrender.com` | ✅ (se paga, pero barato o free tier con persistencia limitada) | Quieres lo más simple |
| **Railway** | `tu-app.up.railway.app` | ✅ volumen gratuito | Quieres persistencia fácil |
| **Fly.io** | `tu-app.fly.dev` | ✅ volumen gratuito | Quieres el más completo |

**Recomendación:** [Railway](https://railway.app) o [Fly.io](https://fly.io) por
los volúmenes; [Render](https://render.com) es el más fácil de todos.

---

## 📦 Paso 0 — Preparar el proyecto (ya hecho)

El proyecto ya incluye:
- ✅ `Dockerfile` (con Python + Tesseract para leer capturas)
- ✅ Endpoint de salud `/healthz` (monitoreo)
- ✅ Base SQLite que vive en `data/liga.db`

---

## ⚡ Opción 1 — Render (más fácil)

1. Crea una cuenta en https://render.com
2. **New → Web Service**
3. Conecta tu repositorio de GitHub (sube este proyecto a tu GitHub si
   aún no está: `git init`, `git add -A`, `git commit`, `git push`)
4. Render detectará el `Dockerfile` automáticamente.
5. En **Environment** agrega:
   - `SECRET_KEY` → una clave larga y al azar
   - `ADMIN_PASS` → la clave que quieras para entrar al panel
   - (`PORT` lo pone Render automáticamente)
6. **Persistencia de datos** (CRÍTICO para no perder resultados):
   - En Render, agrega un **Disk** (persistent disk) montado en `/app/data`
7. Deploy. Al terminar tendrás `https://tu-app.onrender.com`

---

## ⚡ Opción 2 — Railway (persistencia amigable)

```bash
# desde tu computadora (o desde esta misma terminal):
# 1. sube primero el proyecto a GitHub (paso 0)
# 2. entra a railway.app, New Project → Deploy from GitHub
```

- Railway detecta el `Dockerfile` solo.
- Agrega variables de entorno: `SECRET_KEY`, `ADMIN_PASS`.
- Agrega un **Volume** montado en `/app/data` (sección Volumes del proyecto).
- Railway te da el dominio `tu-proyecto.up.railway.app` (editable en Settings → Generate Domain → Custom Domain para poner uno comprado).

---

## ⚡ Opción 3 — Fly.io (con CLI, gratis más generoso)

1. Instala flyctl: `curl -L https://fly.io/install.sh | sh`
2. `fly auth login`
3. En `/workspace/project`:
   ```bash
   fly launch
   # elige nombre: panamarivals
   ```
   Esto crea un `fly.toml`. Ajústalo para persistencia:
   ```toml
   [[mounts]]
     source = "liga_data"
     destination = "/app/data"
   [env]
     SECRET_KEY = "clave-aleatoria-larga"
     ADMIN_PASS = "tu-clave-admin"
   ```
4. `fly deploy`
5. `fly scale ...` si quieres más memoria.
6. Tu dominio: `https://panamarivals.fly.dev`

---

## 🌐 Paso 3 — Conectar tu dominio propio (panamarivals.com)

Una vez la app está viva en el servicio, **compra un dominio** en
Namecheap / Cloudflare / Gody (cuesta ~$10/año) y conéctalo:

- **Render**: Settings → Domains → agrega `panamarivals.com`
- **Railway**: Settings → Custom Domains → agrega el dominio
- **Fly.io**: `fly certs add panamarivals.com`

El proveedor te indica qué **CNAME / A record** poner en tu registrador
(típicamente algo como `CNAME  panamarivals.com  ->  tu-app.onrender.com`).

Con HTTPS automático (certificado gratis incluido) tendrás:
```
https://panamarivals.com  ← Página pública
https://panamarivals.com/admin/login  ← Panel admin
```

---

## 🚑 Arranque y monitoreo

- **Check de vida**: la app expone `/healthz` que responde `{"ok": true, ...}`.
  El servicio lo usa para reiniciarte si algo falla.
- **Backups**: entra al panel y usa **"💾 Hacer backup"** (guarda copias en
  `data/backups/`). El volumen persiste, pero un backup manual antes de
  borrar datos nunca está de más.

---

## 🧪 Probar DOCKER localmente (opcional)

```bash
cd /workspace/project
docker build -t liga-rl .
docker run -p 12000:12000 -v liga_data:/app/data -e SECRET_KEY=dev -e ADMIN_PASS=admin1234 liga-rl
# abre http://localhost:12000
```

---

## ❓ Preguntas frecuentes

**¿Por qué montar un volumen en `/app/data`?**
Porque sin volumen, cada vez que el servicio reinicia, la base se resetea.
El volumen guarda el archivo `liga.db` entre reinicios.

**¿Qué puertos usar?**
La app escucha en `0.0.0.0:$PORT` con `PORT` por defecto 12000. Los
servicios (Render/Railway/Fly) te inyectan su propio `PORT` automáticamente.

**¿Es caro mantenerla?**
Los tres servicios tienen plan gratis. Con un dominio propio (~$10/año)
tendrás todo funcionando.

---

## 📝 Checklist final

- [ ] Subí el proyecto a GitHub
- [ ] Creé el servicio (Render o Railway o Fly)
- [ ] Agregué `SECRET_KEY` y `ADMIN_PASS`
- [ ] **Monté el volumen en `/app/data`** (¡clave!)
- [ ] La web abre en el dominio provisto
- [ ] Compré `panamarivals.com` y lo conecté
- [ ] Entré a `/admin/login`, cambié la contraseña
- [ ] Cargué los 6 equipos y el calendario
- [ ] La web muestra las posiciones y responde a `/healthz`