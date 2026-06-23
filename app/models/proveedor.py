"""Modelo de proveedores."""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, func
from app.db.session import Base
from app.models.mixins import TenantMixin


class Proveedor(Base, TenantMixin):
    __tablename__ = "proveedores"

    id_proveedor = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    telefono = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    direccion = Column(String(200), nullable=True)
    notas = Column(Text, nullable=True)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, server_default=func.now())
