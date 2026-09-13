"""Organización: agrupa varias barberías bajo un mismo dueño (Plan Premium, sedes)."""

from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Organizacion(Base):
    __tablename__ = "organizaciones"

    id_organizacion = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    fecha_creacion = Column(DateTime, server_default=func.now())

    barberias = relationship("Barberia", back_populates="organizacion")