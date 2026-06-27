"""Esquemas Pydantic de solicitudes de turno."""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.solicitud_turno import EstadoSolicitudEnum, FranjaEnum


class SolicitudCrear(BaseModel):
    nombre_cliente: str
    telefono: str
    documento: Optional[str] = None
    id_barbero: Optional[int] = None
    fecha_preferida: Optional[date] = None
    franja_preferida: FranjaEnum = FranjaEnum.cualquiera
    comentario: Optional[str] = None


class SolicitudRespuesta(BaseModel):
    id_solicitud: int
    nombre_cliente: str
    telefono: str
    documento: Optional[str] = None
    id_barbero: Optional[int] = None
    fecha_preferida: Optional[date] = None
    franja_preferida: FranjaEnum
    comentario: Optional[str] = None
    estado: EstadoSolicitudEnum
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)


class SolicitudActualizarEstado(BaseModel):
    estado: EstadoSolicitudEnum
