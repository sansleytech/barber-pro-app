"""Esquemas Pydantic de acontecimientos."""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.acontecimiento import TipoAcontecimientoEnum


class AcontecimientoCrear(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    tipo: TipoAcontecimientoEnum = TipoAcontecimientoEnum.otro
    fecha: date
    id_cliente: Optional[int] = None


class AcontecimientoRespuesta(BaseModel):
    id_acontecimiento: int
    titulo: str
    descripcion: Optional[str] = None
    tipo: TipoAcontecimientoEnum
    fecha: date
    id_cliente: Optional[int] = None
    activo: bool
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)


# Para el endpoint de cumpleaños
class CumpleanosRespuesta(BaseModel):
    id_cliente: int
    nombre: str
    fecha_nacimiento: date
    dia: int
    mes: int
