"""Modelo de Pagos: historial de cobros de suscripciones vía pasarela de pago."""

import enum
from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class EstadoPagoEnum(str, enum.Enum):
    pendiente = "pendiente"
    aprobado = "aprobado"
    rechazado = "rechazado"
    error = "error"


class Pago(Base):
    __tablename__ = "pagos"

    id_pago = Column(Integer, primary_key=True, autoincrement=True)
    id_barberia = Column(Integer, ForeignKey("barberias.id_barberia", ondelete="CASCADE"), nullable=False)
    id_suscripcion = Column(Integer, ForeignKey("suscripciones.id_suscripcion", ondelete="SET NULL"), nullable=True)
    referencia = Column(String(100), nullable=False, unique=True)
    id_transaccion_wompi = Column(String(100), nullable=True)
    monto = Column(DECIMAL(10, 2), nullable=False)
    estado = Column(Enum(EstadoPagoEnum), default=EstadoPagoEnum.pendiente)
    metodo_pago = Column(String(50), nullable=True)
    fecha_creacion = Column(DateTime, server_default=func.now())
    fecha_actualizacion = Column(DateTime, server_default=func.now(), onupdate=func.now())

    barberia = relationship("Barberia")
    suscripcion = relationship("Suscripcion")