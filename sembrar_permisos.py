"""Siembra la tabla permisos_rol con los valores actuales de permiso.js."""
import crear_tablas
from app.db.session import SessionLocal
from app.models.permiso_rol import PermisoRol

PERMISOS_INICIALES = [
    {"ruta": "/dashboard", "administrador": True, "recepcionista": True, "barbero": False},
    {"ruta": "/mi-dia", "administrador": False, "recepcionista": False, "barbero": True},
    {"ruta": "/turnos", "administrador": True, "recepcionista": True, "barbero": True},
    {"ruta": "/calendario", "administrador": True, "recepcionista": True, "barbero": True},
    {"ruta": "/recordatorios", "administrador": True, "recepcionista": True, "barbero": True},
    {"ruta": "/clientes", "administrador": True, "recepcionista": True, "barbero": False},
    {"ruta": "/barberos", "administrador": True, "recepcionista": False, "barbero": False},
    {"ruta": "/servicios", "administrador": True, "recepcionista": True, "barbero": False},
    {"ruta": "/horarios", "administrador": True, "recepcionista": False, "barbero": True},
    {"ruta": "/usuarios", "administrador": True, "recepcionista": False, "barbero": False},
    {"ruta": "/valoraciones", "administrador": True, "recepcionista": True, "barbero": True},
    {"ruta": "/acontecimientos", "administrador": True, "recepcionista": True, "barbero": False},
    {"ruta": "/notificaciones", "administrador": True, "recepcionista": True, "barbero": True},
    {"ruta": "/productos", "administrador": True, "recepcionista": False, "barbero": False},
    {"ruta": "/categorias", "administrador": True, "recepcionista": False, "barbero": False},
    {"ruta": "/proveedores", "administrador": True, "recepcionista": False, "barbero": False},
    {"ruta": "/compras", "administrador": True, "recepcionista": False, "barbero": False},
    {"ruta": "/ventas", "administrador": True, "recepcionista": True, "barbero": False},
    {"ruta": "/caja", "administrador": True, "recepcionista": False, "barbero": False},
    {"ruta": "/configuracion", "administrador": True, "recepcionista": False, "barbero": False},
    {"ruta": "/qr", "administrador": True, "recepcionista": False, "barbero": False},
    {"ruta": "/solicitudes", "administrador": True, "recepcionista": True, "barbero": False},
    {"ruta": "/reportes", "administrador": True, "recepcionista": False, "barbero": True},
    {"ruta": "/galeria", "administrador": True, "recepcionista": False, "barbero": False},
]

db = SessionLocal()
for item in PERMISOS_INICIALES:
    existe = db.query(PermisoRol).filter(PermisoRol.ruta == item["ruta"]).first()
    if existe is None:
        db.add(PermisoRol(**item))
        print(f"Creado: {item['ruta']}")
    else:
        print(f"Ya existe: {item['ruta']}, se omite")
db.commit()
db.close()
print("Listo.")