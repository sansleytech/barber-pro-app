"""Script puntual: fuerza que la última suscripción venza HOY, para probar el cobro automático."""
import crear_tablas
from datetime import date
from app.db.session import SessionLocal
from app.models.plan import Suscripcion

db = SessionLocal()
sus = db.query(Suscripcion).order_by(Suscripcion.id_suscripcion.desc()).first()

if sus is None:
    print("No hay ninguna suscripción en la base")
else:
    sus.fecha_fin = date.today()
    db.commit()
    print(f"Suscripción {sus.id_suscripcion} (barbería {sus.id_barberia}) ahora vence hoy: {sus.fecha_fin}")

db.close()