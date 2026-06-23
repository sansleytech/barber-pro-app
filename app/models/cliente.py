"""Modelo para representar un cliente de la barbería."""

import enum
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, Enum, func
from app.db.session import Base
from app.models.mixins import TenantMixin


class GeneroEnum(str, enum.Enum):
    """Opciones válidas para el género del cliente."""
    masculino = "masculino"
    femenino = "femenino"
    otro = "otro"
    prefiero_no_decir = "prefiero_no_decir"


class Cliente(Base, TenantMixin):
    __tablename__ = "clientes"
    id_cliente = Column(Integer, primary_key=True, autoincrement=True)
    primer_nombre = Column(String(50), nullable=False)
    segundo_nombre = Column(String(50), nullable=True)
    apellidos = Column(String(100), nullable=False)
    tipo_documento = Column(String(20), nullable=True)
    documento = Column(String(30), unique=True, nullable=True)
    direccion = Column(String(200), nullable=True)
    fecha_nacimiento = Column(Date, nullable=False)
    genero = Column(Enum(GeneroEnum), nullable=True)
    email = Column(String(100), unique=True, nullable=True)
    telefono = Column(String(20), nullable=False)
    foto = Column(String(255), nullable=True)
    notas = Column(Text, nullable=True)
    fecha_ultima_visita = Column(Date, nullable=True)
    fecha_registro = Column(DateTime, server_default=func.now())
    es_vip = Column(Boolean, default=False)
    activo = Column(Boolean, default=True)
    