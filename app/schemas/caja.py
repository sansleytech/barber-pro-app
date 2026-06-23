"""Esquemas Pydantic de caja."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


# ---- Gastos ----
class GastoCrear(BaseModel):
    concepto: str
    monto: Decimal
    fecha: date
    categoria: Optional[str] = None
    observaciones: Optional[str] = None


class GastoRespuesta(GastoCrear):
    id_gasto: int
    id_usuario: Optional[int] = None
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)


# ---- Descuentos ----
class DescuentoCrear(BaseModel):
    concepto: str
    monto: Decimal
    fecha: date
    observaciones: Optional[str] = None


class DescuentoRespuesta(DescuentoCrear):
    id_descuento: int
    id_usuario: Optional[int] = None
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)


# ---- Cierre ----
class CierreCrear(BaseModel):
    fecha: date
    observaciones: Optional[str] = None


class CierreRespuesta(BaseModel):
    id_cierre: int
    fecha: date
    ingresos_turnos: Decimal
    ingresos_ventas: Decimal
    total_propinas: Decimal
    total_gastos: Decimal
    total_descuentos: Decimal
    balance_final: Decimal
    id_usuario: Optional[int] = None
    observaciones: Optional[str] = None
    fecha_cierre: datetime
    model_config = ConfigDict(from_attributes=True)
