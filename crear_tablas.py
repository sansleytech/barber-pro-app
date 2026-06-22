"""
Script de un solo uso para crear las tablas en la base de datos
a partir de los modelos de SQLAlchemy.
"""
from app.db.session import Base, engine

# Importamos los modelos para que SQLAlchemy los conozca
from app.models.barbero import Barbero

print("Creando tablas...")
Base.metadata.create_all(bind=engine)
print("✅ Tablas creadas correctamente.")
