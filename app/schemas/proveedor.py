"""Esquemas Pydantic de proveedores."""

from typing import Optional
from pydantic import BaseModel, ConfigDict


class ProveedorBase(BaseModel):
    nombre: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None


class ProveedorCrear(ProveedorBase):
    pass


class ProveedorActualizar(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None


class ProveedorRespuesta(ProveedorBase):
    id_proveedor: int
    activo: bool

    model_config = ConfigDict(from_attributes=True)
