"""Script para crear las tablas en la base de datos."""
from app.db.session import Base, engine

from app.models.barbero import Barbero
from app.models.servicio import Servicio
from app.models.cliente import Cliente
from app.models.turno import Turno, TurnoServicio

print("Creando tablas...")
Base.metadata.create_all(bind=engine)
print("✅ Tablas creadas correctamente.")
