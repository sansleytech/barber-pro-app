"""Esquemas Pydantic del Turno."""

from datetime import date, time, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.turno import EstadoTurnoEnum
class TurnoCrear(BaseModel):
    id_cliente: int
    id_barbero: int
    fecha: date
    hora_inicio: time
    ids_servicios: list[int]
    observaciones: Optional[str] = None
class ServicioEnTurno(BaseModel):
    id_servicio: int
    precio_aplicado: Decimal
    duracion_aplicada: int

    model_config = ConfigDict(from_attributes=True)
class TurnoRespuesta(BaseModel):
    id_turno: int
    id_cliente: int
    id_barbero: int
    fecha: date
    hora_inicio: time
    hora_fin: time
    precio_total: Decimal
    estado: EstadoTurnoEnum
    metodo_pago: Optional[str] = None
    observaciones: Optional[str] = None
    propina: Optional[Decimal] = None
    id_barbero_propina: Optional[int] = None
    fecha_creacion: datetime
    servicios: list[ServicioEnTurno]

    model_config = ConfigDict(from_attributes=True)
class TurnoCambiarEstado(BaseModel):
    estado: EstadoTurnoEnum
class TurnoRegistrarPago(BaseModel):
    metodo_pago: str
    propina: Optional[Decimal] = 0
    id_barbero_propina: Optional[int] = None

class TurnoActualizar(BaseModel):
    id_cliente: Optional[int] = None
    id_barbero: Optional[int] = None
    fecha: Optional[date] = None
    hora_inicio: Optional[time] = None
    ids_servicios: Optional[list[int]] = None
    observaciones: Optional[str] = None