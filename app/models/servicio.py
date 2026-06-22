"""Modelo para representar un servicio de la barbería."""

from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean
from app.db.session import Base


class Servicio(Base):
    __tablename__ = "servicios"

    id_servicio = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(80), nullable=False)
    descripcion = Column(Text, nullable=True)
    precio = Column(DECIMAL(10, 2), nullable=False)
    duracion_minutos = Column(Integer, nullable=False)
    activo = Column(Boolean, default=True)