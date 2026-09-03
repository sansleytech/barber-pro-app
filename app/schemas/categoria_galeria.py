"""Esquemas Pydantic de las categorías de galería."""

from typing import Optional
from pydantic import BaseModel, ConfigDict


class CategoriaGaleriaCrear(BaseModel):
    nombre: str
    orden: Optional[int] = 0


class CategoriaGaleriaActualizar(BaseModel):
    nombre: Optional[str] = None
    orden: Optional[int] = None


class CategoriaGaleriaRespuesta(BaseModel):
    id_categoria_galeria: int
    nombre: str
    orden: int

    model_config = ConfigDict(from_attributes=True)
