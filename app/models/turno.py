"""Modelo para representar un turno (cita) en la barbería."""

import enum
from sqlalchemy import (
    Column, Integer, String, Date, Time, DateTime, Enum, ForeignKey, DECIMAL, Text, func
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class EstadoTurnoEnum(str, enum.Enum):
    """Estados posibles de un turno."""
    pendiente = "pendiente"
    confirmado = "confirmado"
    en_proceso = "en_proceso"
    completado = "completado"
    cancelado = "cancelado"
    no_asistio = "no_asistio"


class Turno(Base):
    __tablename__ = "turnos"

    id_turno = Column(Integer, primary_key=True, autoincrement=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    id_barbero = Column(Integer, ForeignKey("barberos.id_barbero"), nullable=False)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    precio_total = Column(DECIMAL(10, 2), nullable=False)
    estado = Column(Enum(EstadoTurnoEnum), default=EstadoTurnoEnum.pendiente)
    metodo_pago = Column(String(30), nullable=True)
    observaciones = Column(Text, nullable=True)
    propina = Column(DECIMAL(10, 2), default=0)
    id_barbero_propina = Column(Integer, ForeignKey("barberos.id_barbero"), nullable=True)
    fecha_creacion = Column(DateTime, server_default=func.now())

    cliente = relationship("Cliente")
    barbero = relationship("Barbero", foreign_keys=[id_barbero])
    servicios = relationship("TurnoServicio", back_populates="turno", cascade="all, delete-orphan")


class TurnoServicio(Base):
    """Tabla intermedia: conecta un turno con cada servicio que incluye."""
    __tablename__ = "turno_servicios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_turno = Column(Integer, ForeignKey("turnos.id_turno"), nullable=False)
    id_servicio = Column(Integer, ForeignKey("servicios.id_servicio"), nullable=False)
    precio_aplicado = Column(DECIMAL(10, 2), nullable=False)
    duracion_aplicada = Column(Integer, nullable=False)

    turno = relationship("Turno", back_populates="servicios")
    servicio = relationship("Servicio")
