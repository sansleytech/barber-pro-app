"""Esquemas Pydantic del Barbero."""

from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class BarberoBase(BaseModel):
    nombre: str
    apellido: str
    fecha_nacimiento: date
    telefono: str
    email: str
    especialidad: Optional[str] = None
    fecha_ingreso: date


class BarberoCrear(BarberoBase):
    pass


class BarberoRespuesta(BarberoBase):
    id_barbero: int
    activo: bool

    model_config = ConfigDict(from_attributes=True)
    
class BarberoActualizar(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    especialidad: Optional[str] = None
    fecha_ingreso: Optional[date] = None