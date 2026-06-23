"""Modelo de valoraciones de turnos."""

from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.mixins import TenantMixin


class Valoracion(Base, TenantMixin):
    __tablename__ = "valoraciones_turnos"

    id_valoracion = Column(Integer, primary_key=True, autoincrement=True)
    id_turno = Column(Integer, ForeignKey("turnos.id_turno", ondelete="CASCADE"), nullable=False)
    id_barbero = Column(Integer, ForeignKey("barberos.id_barbero"), nullable=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=True)
    estrellas = Column(Integer, nullable=False)
    comentario = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime, server_default=func.now())

    __table_args__ = (
        CheckConstraint("estrellas >= 1 AND estrellas <= 5", name="check_estrellas_rango"),
    )

    turno = relationship("Turno")
    barbero = relationship("Barbero")
    cliente = relationship("Cliente")
