"""Conexión a la base de datos. Crea el motor de SQLAlchemy y la fábrica de sesiones. """

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

# El motor: gestiona la conexión real con MySQL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # verifica que la conexión siga viva antes de usarla
    echo=True,  # muestra en consola las consultas SQL (útil en desarrollo)
)

# Fábrica de sesiones: cada petición usará una sesión propia
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base de la que heredarán todos los modelos (las tablas)
Base = declarative_base()


def get_db():
    """Entrega una sesión de base de datos por petición y se asegura de cerrarla al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
