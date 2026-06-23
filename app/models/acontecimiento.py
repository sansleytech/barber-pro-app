"""Modelo de acontecimientos / fechas especiales."""

import enum
from sqlalchemy import Column, Integer, String, Text, Date, Boolean, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class TipoAcontecimientoEnum(str, enum.Enum):
    cumpleanos = "cumpleanos"
    aniversario = "aniversario"
    promocion = "promocion"
    otro = "otro"


class Acontecimiento(Base):
    __tablename__ = "acontecimientos"

    id_acontecimiento = Column(Integer, primary_key=True, autoincrement=True)
    titulo = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=True)
    tipo = Column(Enum(TipoAcontecimientoEnum), default=TipoAcontecimientoEnum.otro)
    fecha = Column(Date, nullable=False)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente", ondelete="CASCADE"), nullable=True)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, server_default=func.now())

    cliente = relationship("Cliente")
