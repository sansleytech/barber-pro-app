"""Esquemas Pydantic de Barbería."""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator
from app.models.barberia import EstadoBarberiaEnum


class BarberiaCrear(BaseModel):
    subdominio: str
    nombre: str
    nit: Optional[str] = None
    email_contacto: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None

    @field_validator("subdominio")
    @classmethod
    def validar_subdominio(cls, v):
        v = v.lower().strip()
        if not v.isalnum():
            raise ValueError("El subdominio solo puede tener letras y números (sin espacios ni símbolos)")
        if len(v) < 3:
            raise ValueError("El subdominio debe tener al menos 3 caracteres")
        return v


class BarberiaActualizar(BaseModel):
    nombre: Optional[str] = None
    nit: Optional[str] = None
    email_contacto: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    logo: Optional[str] = None


class BarberiaRespuesta(BaseModel):
    id_barberia: int
    subdominio: str
    nombre: str
    nit: Optional[str] = None
    email_contacto: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    logo: Optional[str] = None
    estado: EstadoBarberiaEnum
    trial_hasta: Optional[date] = None
    activo: bool
    fecha_registro: datetime

    model_config = ConfigDict(from_attributes=True)
