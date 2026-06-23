"""Modelo para los horarios de trabajo de cada barbero."""

from sqlalchemy import Column, Integer, Time, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


class HorarioBarbero(Base):
    __tablename__ = "horarios_barbero"

    id_horario = Column(Integer, primary_key=True, autoincrement=True)
    id_barbero = Column(Integer, ForeignKey("barberos.id_barbero", ondelete="CASCADE"), nullable=False)
    dia_semana = Column(Integer, nullable=False)  # 1=Lunes ... 7=Domingo (ISO)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    pausa_inicio = Column(Time, nullable=True)
    pausa_fin = Column(Time, nullable=True)

    barbero = relationship("Barbero")
