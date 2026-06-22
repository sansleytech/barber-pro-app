"""Modelo para representar un barbero en la base de datos."""

from email.mime import base

from sqlalchemy import Column, Integer, String, Date, Boolean
from app.db.session import Base

class Barbero(Base):
    __tablename__ = "barberos"
    
    id_barbero = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50), nullable=False)
    apellido = Column(String(50), nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    telefono = Column(String(20), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    especialidad = Column(String(100), nullable=True)
    fecha_ingreso = Column(Date, nullable=False)
    activo = Column(Boolean, default=True)