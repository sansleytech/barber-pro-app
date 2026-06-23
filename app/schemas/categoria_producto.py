"""Esquemas Pydantic de categorías de productos."""

from typing import Optional
from pydantic import BaseModel, ConfigDict


class CategoriaBase(BaseModel):
    nombre: str
    color: Optional[str] = "#D4AF37"
    icono: Optional[str] = "package"
    orden: Optional[int] = 0


class CategoriaCrear(CategoriaBase):
    pass


class CategoriaActualizar(BaseModel):
    nombre: Optional[str] = None
    color: Optional[str] = None
    icono: Optional[str] = None
    orden: Optional[int] = None


class CategoriaRespuesta(CategoriaBase):
    id_categoria: int
    activo: bool

    model_config = ConfigDict(from_attributes=True)
