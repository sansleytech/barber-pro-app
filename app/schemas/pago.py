"""Esquemas de Pagos."""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.pago import EstadoPagoEnum


class PagoIniciar(BaseModel):
    id_plan: int


class PagoRespuesta(BaseModel):
    id_pago: int
    id_barberia: int
    id_suscripcion: Optional[int] = None
    referencia: str
    id_transaccion_wompi: Optional[str] = None
    monto: Decimal
    estado: EstadoPagoEnum
    metodo_pago: Optional[str] = None
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)