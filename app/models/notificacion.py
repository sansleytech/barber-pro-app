"""Modelo de notificaciones del sistema."""

import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.mixins import TenantMixin


class TipoNotificacionEnum(str, enum.Enum):
    info = "info"
    alerta = "alerta"
    recordatorio = "recordatorio"


class Notificacion(Base, TenantMixin):
    __tablename__ = "notificaciones"

    id_notificacion = Column(Integer, primary_key=True, autoincrement=True)
    titulo = Column(String(150), nullable=False)
    mensaje = Column(Text, nullable=False)
    tipo = Column(Enum(TipoNotificacionEnum), default=TipoNotificacionEnum.info)
    # Si id_usuario es NULL, la notificación es general (para todos)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), nullable=True)
    leida = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime, server_default=func.now())

    usuario = relationship("Usuario")
