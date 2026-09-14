"""Modelo de configuración del sistema (clave-valor), por barbería."""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from app.db.session import Base
from app.models.mixins import TenantMixin


class Configuracion(Base, TenantMixin):
    __tablename__ = "configuracion"

    # La llave primaria real es la combinación (id_barberia, clave) — así cada
    # barbería tiene su propia fila para "negocio_nombre", "hero_url", etc.
    id_barberia = Column(ForeignKey("barberias.id_barberia", ondelete="CASCADE"), primary_key=True)
    clave = Column(String(100), primary_key=True)
    valor = Column(Text, nullable=True)
    fecha_actualizacion = Column(DateTime, server_default=func.now(), onupdate=func.now())