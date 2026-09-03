"""Esquemas Pydantic de la galería."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class FotoGaleriaCrear(BaseModel):
    url: str
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    id_categoria_galeria: Optional[int] = None
    destacado: Optional[bool] = False
    orden: Optional[int] = 0


class FotoGaleriaActualizar(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    id_categoria_galeria: Optional[int] = None
    destacado: Optional[bool] = None
    orden: Optional[int] = None
    activo: Optional[bool] = None


class FotoGaleriaRespuesta(BaseModel):
    id_foto: int
    url: str
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    id_categoria_galeria: Optional[int] = None
    destacado: bool
    orden: int
    activo: bool
    fecha_creacion: datetime

    model_config = ConfigDict(from_attributes=True)
