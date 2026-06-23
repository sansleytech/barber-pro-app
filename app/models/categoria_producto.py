"""Modelo de categorías de productos."""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.db.session import Base
from app.models.mixins import TenantMixin


class CategoriaProducto(Base, TenantMixin):
    __tablename__ = "categorias_productos"

    id_categoria = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(80), unique=True, nullable=False)
    color = Column(String(20), default="#D4AF37")
    icono = Column(String(50), default="package")
    orden = Column(Integer, default=0)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, server_default=func.now())
