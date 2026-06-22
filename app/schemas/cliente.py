"""Esquemas Pydantic del Cliente."""

from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict, computed_field

from app.models.cliente import GeneroEnum


class ClienteBase(BaseModel):
    primer_nombre: str
    segundo_nombre: Optional[str] = None
    apellidos: str
    fecha_nacimiento: date
    genero: Optional[GeneroEnum] = None
    email: Optional[str] = None
    telefono: str
    tipo_documento: Optional[str] = None
    documento: Optional[str] = None
    direccion: Optional[str] = None
    foto: Optional[str] = None
    notas: Optional[str] = None


class ClienteCrear(ClienteBase):
    pass


class ClienteActualizar(BaseModel):
    primer_nombre: Optional[str] = None
    segundo_nombre: Optional[str] = None
    apellidos: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    genero: Optional[GeneroEnum] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    tipo_documento: Optional[str] = None
    documento: Optional[str] = None
    direccion: Optional[str] = None
    foto: Optional[str] = None
    notas: Optional[str] = None
    fecha_ultima_visita: Optional[date] = None
    es_vip: Optional[bool] = None


class ClienteRespuesta(ClienteBase):
    id_cliente: int
    fecha_ultima_visita: Optional[date] = None
    fecha_registro: datetime
    es_vip: bool
    activo: bool

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def edad(self) -> int:
        """Calcula la edad a partir de la fecha de nacimiento."""
        hoy = date.today()
        edad = hoy.year - self.fecha_nacimiento.year
        if (hoy.month, hoy.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day):
            edad -= 1
        return edad
