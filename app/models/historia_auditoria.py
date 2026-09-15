"""Historial de auditoría: registra acciones sensibles del superadmin."""

from sqlalchemy import Column, Integer, String, Text, DateTime, func
from app.db.session import Base


class HistorialAuditoria(Base):
    __tablename__ = "historial_auditoria"

    id_registro = Column(Integer, primary_key=True, autoincrement=True)
    nombre_usuario = Column(String(50), nullable=False)  # quién hizo la acción
    accion = Column(String(100), nullable=False)  # ej: "eliminar_barberia"
    detalle = Column(Text, nullable=True)  # descripción legible de qué pasó
    id_barberia_afectada = Column(Integer, nullable=True)
    fecha = Column(DateTime, server_default=func.now())