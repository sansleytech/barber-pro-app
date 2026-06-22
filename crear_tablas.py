"""Script para crear las tablas en la base de datos."""
from app.db.session import Base, engine

# Importamos los modelos para que SQLAlchemy los conozca
from app.models.barbero import Barbero
from app.models.servicio import Servicio

print("Creando tablas...")
Base.metadata.create_all(bind=engine)
print("✅ Tablas creadas correctamente.")