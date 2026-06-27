"""Modelo de solicitudes de turno desde el portal público."""

import enum
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.mixins import TenantMixin


class EstadoSolicitudEnum(str, enum.Enum):
    pendiente = "pendiente"
    atendida = "atendida"
    descartada = "descartada"


class FranjaEnum(str, enum.Enum):
    manana = "manana"
    tarde = "tarde"
    noche = "noche"
    cualquiera = "cualquiera"


class SolicitudTurno(Base, TenantMixin):
    __tablename__ = "solicitudes_turno"

    id_solicitud = Column(Integer, primary_key=True, autoincrement=True)
    id_barbero = Column(Integer, ForeignKey("barberos.id_barbero", ondelete="SET NULL"), nullable=True)
    nombre_cliente = Column(String(120), nullable=False)
    telefono = Column(String(30), nullable=False)
    documento = Column(String(30), nullable=True)
    fecha_preferida = Column(Date, nullable=True)
    franja_preferida = Column(Enum(FranjaEnum), default=FranjaEnum.cualquiera)
    comentario = Column(Text, nullable=True)
    estado = Column(Enum(EstadoSolicitudEnum), default=EstadoSolicitudEnum.pendiente)
    fecha_creacion = Column(DateTime, server_default=func.now())

    barbero = relationship("Barbero")