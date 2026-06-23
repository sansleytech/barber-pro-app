"""Modelo de configuración del sistema (clave-valor)."""

from sqlalchemy import Column, String, Text, DateTime, func
from app.db.session import Base


class Configuracion(Base):
    __tablename__ = "configuracion"

    clave = Column(String(100), primary_key=True)
    valor = Column(Text, nullable=True)
    fecha_actualizacion = Column(DateTime, server_default=func.now(), onupdate=func.now())
