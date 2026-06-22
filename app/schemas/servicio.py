"""Esquemas Pydantic del Servicio."""

from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ServicioBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    duracion_minutos: int


class ServicioCrear(ServicioBase):
    pass


class ServicioActualizar(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[Decimal] = None
    duracion_minutos: Optional[int] = None


class ServicioRespuesta(ServicioBase):
    id_servicio: int
    activo: bool

    model_config = ConfigDict(from_attributes=True)