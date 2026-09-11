"""Consulta rápida: último pago registrado."""
import crear_tablas
from app.db.session import SessionLocal
from app.models.pago import Pago

db = SessionLocal()
pago = db.query(Pago).order_by(Pago.id_pago.desc()).first()

if pago:
    print(f"ID: {pago.id_pago}")
    print(f"Referencia: {pago.referencia}")
    print(f"Estado: {pago.estado.value}")
    print(f"Monto: {pago.monto}")
else:
    print("No hay pagos registrados")

db.close()