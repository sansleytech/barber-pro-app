"""Esquemas Pydantic del Turno."""

from datetime import date, time, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.models.turno import EstadoTurnoEnum


# --- Lo que el cliente envía para crear un turno ---
class TurnoCrear(BaseModel):
    id_cliente: int
    id_barbero: int
    fecha: date
    hora_inicio: time
    ids_servicios: list[int]  # lista de ids de los servicios elegidos


# --- Para mostrar un servicio dentro de la respuesta del turno ---
class ServicioEnTurno(BaseModel):
    id_servicio: int
    nombre: str
    precio: Decimal
    duracion_minutos: int

    model_config = ConfigDict(from_attributes=True)


# --- Lo que la API devuelve al consultar un turno ---
class TurnoRespuesta(BaseModel):
    id_turno: int
    id_cliente: int
    id_barbero: int
    fecha: date
    hora_inicio: time
    hora_fin: time
    precio_total: Decimal
    estado: EstadoTurnoEnum
    fecha_creacion: datetime
    servicios: list[ServicioEnTurno]

    model_config = ConfigDict(from_attributes=True)


# --- Para cambiar el estado de un turno ---
class TurnoCambiarEstado(BaseModel):
    estado: EstadoTurnoEnum
