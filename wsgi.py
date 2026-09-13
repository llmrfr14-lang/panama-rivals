from app import app, index, posiciones, calendario, estadisticas, equipos
import database

# En gunicorn se ejecuta una vez al arrancar: iniciamos la BD.
# Esto evita carreras: la inicializacion es idempotente.
database.init_db()

application = app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=12000)