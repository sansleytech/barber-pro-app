"""Modelos de Planes y Suscripciones del SaaS."""

import enum
from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean, Date, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Plan(Base):
    __tablename__ = "planes"

    id_plan = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(60), nullable=False)          # ej: Básico, Pro, Premium
    descripcion = Column(Text, nullable=True)
    precio_mensual = Column(DECIMAL(10, 2), nullable=False)
    max_barberos = Column(Integer, nullable=True)        # límite de barberos (NULL = ilimitado)
    max_turnos_mes = Column(Integer, nullable=True)      # límite de turnos/mes (NULL = ilimitado)
    
    # Funcionalidades habilitadas (banderas)
    permite_whatsapp = Column(Boolean, default=False)
    permite_pagos_online = Column(Boolean, default=False)
    permite_reportes = Column(Boolean, default=True)
    orden = Column(Integer, default=0)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, server_default=func.now())

    # Funcionalidades habilitadas (banderas)
    permite_whatsapp = Column(Boolean, default=False)
    permite_pagos_online = Column(Boolean, default=False)
    permite_reportes = Column(Boolean, default=True)
    permite_inventario = Column(Boolean, default=False)   # ← nuevo: inventario y ventas
    permite_qr = Column(Boolean, default=False)           # ← nuevo: códigos QR

class EstadoSuscripcionEnum(str, enum.Enum):
    trial = "trial"
    activa = "activa"
    vencida = "vencida"
    cancelada = "cancelada"


class Suscripcion(Base):
    __tablename__ = "suscripciones"

    id_suscripcion = Column(Integer, primary_key=True, autoincrement=True)
    id_barberia = Column(Integer, ForeignKey("barberias.id_barberia", ondelete="CASCADE"), nullable=False)
    id_plan = Column(Integer, ForeignKey("planes.id_plan"), nullable=False)
    estado = Column(Enum(EstadoSuscripcionEnum), default=EstadoSuscripcionEnum.trial)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=True)            # próximo cobro / vencimiento
    fecha_creacion = Column(DateTime, server_default=func.now())

    barberia = relationship("Barberia")
    plan = relationship("Plan")
