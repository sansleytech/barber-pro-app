"""Script para crear los planes Estándar, Pro y Premium en la base de datos.
Se corre una sola vez: python sembrar_planes.py
"""

from app.db.session import SessionLocal
from app.models.plan import Plan
from app.models.barberia import Barberia  # necesario para que SQLAlchemy resuelva la relación Suscripcion -> Barberia

db = SessionLocal()

planes = [
    Plan(
        nombre="Estándar",
        descripcion="Turnos, clientes y caja para arrancar.",
        precio_mensual=49000,
        max_barberos=2,
        max_turnos_mes=None,
        permite_whatsapp=False,
        permite_pagos_online=False,
        permite_reportes=False,
        permite_inventario=False,
        permite_qr=False,
        orden=1,
    ),
    Plan(
        nombre="Pro",
        descripcion="Todo lo del Estándar, más inventario, ventas, notificaciones y reportes.",
        precio_mensual=89000,
        max_barberos=5,
        max_turnos_mes=None,
        permite_whatsapp=True,
        permite_pagos_online=False,
        permite_reportes=True,
        permite_inventario=True,
        permite_qr=False,
        orden=2,
    ),
    Plan(
        nombre="Premium",
        descripcion="Barberos ilimitados y todas las funciones, incluyendo códigos QR.",
        precio_mensual=149000,
        max_barberos=None,
        max_turnos_mes=None,
        permite_whatsapp=True,
        permite_pagos_online=True,
        permite_reportes=True,
        permite_inventario=True,
        permite_qr=True,
        orden=3,
    ),
]

for p in planes:
    existe = db.query(Plan).filter(Plan.nombre == p.nombre).first()
    if existe:
        print(f"Ya existe el plan '{p.nombre}', se omite.")
        continue
    db.add(p)
    print(f"Creando plan '{p.nombre}'...")

db.commit()
db.close()
print("Listo.")