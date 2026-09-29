import crear_tablas
from app.db.session import SessionLocal
from app.models.barberia import Barberia
from app.models.pago import Pago
from app.models.plan import Suscripcion, Plan

db = SessionLocal()
b = db.query(Barberia).filter(Barberia.subdominio == 'barberia').first()
print('Barberia:', b.nombre, '- id:', b.id_barberia, '- estado:', b.estado.value)
print()
print('=== PAGOS ===')
for p in db.query(Pago).filter(Pago.id_barberia == b.id_barberia).order_by(Pago.fecha_creacion.desc()).limit(5):
    print('id=', p.id_pago, 'monto=', p.monto, 'estado=', p.estado.value, 'referencia=', p.referencia, 'id_plan=', p.id_plan, 'fecha=', p.fecha_creacion)
print()
print('=== SUSCRIPCIONES ===')
for s in db.query(Suscripcion).filter(Suscripcion.id_barberia == b.id_barberia).order_by(Suscripcion.fecha_creacion.desc()).limit(5):
    plan = db.query(Plan).filter(Plan.id_plan == s.id_plan).first()
    nombre_plan = plan.nombre if plan else "desconocido"
    print('id=', s.id_suscripcion, 'plan=', nombre_plan, 'estado=', s.estado.value, 'fecha_inicio=', s.fecha_inicio, 'fecha_fin=', s.fecha_fin, 'creada=', s.fecha_creacion)
