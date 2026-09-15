"""Historial de auditoría: registra acciones sensibles del superadmin."""

from sqlalchemy import Column, Integer, String, Text, DateTime, func
from app.db.session import Base


class HistorialAuditoria(Base):
    __tablename__ = "historial_auditoria"

    id_registro = Column(Integer, primary_key=True, autoincrement=True)
    nombre_usuario = Column(String(50), nullable=False)
    accion = Column(String(100), nullable=False)
    detalle = Column(Text, nullable=True)
    id_barberia_afectada = Column(Integer, nullable=True)
    fecha = Column(DateTime, server_default=func.now())