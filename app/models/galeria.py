"""Modelo para las fotos de la galería del portal público."""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, func
from app.db.session import Base
from app.models.mixins import TenantMixin


class FotoGaleria(Base, TenantMixin):
    __tablename__ = "galeria"

    id_foto = Column(Integer, primary_key=True, autoincrement=True)
    url = Column(String(255), nullable=False)
    titulo = Column(String(100), nullable=True)
    descripcion = Column(Text, nullable=True)
    orden = Column(Integer, default=0)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, server_default=func.now())
