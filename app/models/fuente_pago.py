"""Fuentes de pago (tarjetas tokenizadas) para cobro automático recurrente."""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class FuentePago(Base):
    __tablename__ = "fuentes_pago"

    id_fuente_pago = Column(Integer, primary_key=True, autoincrement=True)
    id_barberia = Column(Integer, ForeignKey("barberias.id_barberia", ondelete="CASCADE"), nullable=False)
    id_fuente_wompi = Column(String(100), nullable=False)  # referencia que da Wompi, nunca el número real
    ultimos_4_digitos = Column(String(4), nullable=True)
    franquicia = Column(String(30), nullable=True)  # VISA, MASTERCARD, etc.
    activa = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, server_default=func.now())

    barberia = relationship("Barberia")