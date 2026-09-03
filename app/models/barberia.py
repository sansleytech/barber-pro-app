"""Modelo de Barbería (tenant del SaaS)."""

import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Enum, func
from app.db.session import Base



class EstadoBarberiaEnum(str, enum.Enum):
    trial = "trial"           # en periodo de prueba
    activa = "activa"         # suscripción al día
    suspendida = "suspendida" # falta de pago
    cancelada = "cancelada"   # dada de baja


class Barberia(Base):
    __tablename__ = "barberias"

    id_barberia = Column(Integer, primary_key=True, autoincrement=True)
    subdominio = Column(String(60), unique=True, nullable=False)
    nombre = Column(String(150), nullable=False)
    nit = Column(String(40), nullable=True)
    email_contacto = Column(String(120), nullable=True)
    telefono = Column(String(30), nullable=True)
    direccion = Column(String(200), nullable=True)
    latitud = Column(String(30), nullable=True)
    longitud = Column(String(30), nullable=True)
    logo = Column(String(255), nullable=True)
    estado = Column(Enum(EstadoBarberiaEnum), default=EstadoBarberiaEnum.trial)
    trial_hasta = Column(Date, nullable=True)
    activo = Column(Boolean, default=True)
    fecha_registro = Column(DateTime, server_default=func.now())
