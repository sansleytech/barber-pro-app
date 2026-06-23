"""Modelo de códigos QR generados."""

import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class TipoQREnum(str, enum.Enum):
    sistema = "sistema"
    barbero = "barbero"
    personalizado = "personalizado"


class CodigoQR(Base):
    __tablename__ = "codigos_qr"

    id_qr = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(120), nullable=False)
    tipo = Column(Enum(TipoQREnum), default=TipoQREnum.personalizado)
    url_destino = Column(String(500), nullable=False)
    id_barbero = Column(Integer, ForeignKey("barberos.id_barbero", ondelete="CASCADE"), nullable=True)
    fecha_creacion = Column(DateTime, server_default=func.now())

    barbero = relationship("Barbero")
