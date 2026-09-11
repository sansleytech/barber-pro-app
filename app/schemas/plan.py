"""Esquemas Pydantic de Planes y Suscripciones."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.plan import EstadoSuscripcionEnum


# ---- Planes ----
class PlanCrear(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio_mensual: Decimal
    max_barberos: Optional[int] = None
    max_turnos_mes: Optional[int] = None
    permite_whatsapp: bool = False
    permite_pagos_online: bool = False
    permite_reportes: bool = True
    permite_inventario: bool = False
    permite_qr: bool = False
    orden: int = 0


class PlanRespuesta(BaseModel):
    id_plan: int
    nombre: str
    descripcion: Optional[str] = None
    precio_mensual: Decimal
    max_barberos: Optional[int] = None
    max_turnos_mes: Optional[int] = None
    permite_whatsapp: bool
    permite_pagos_online: bool
    permite_reportes: bool
    permite_inventario: bool
    permite_qr: bool
    orden: int
    activo: bool
    model_config = ConfigDict(from_attributes=True)


class PlanActualizar(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio_mensual: Optional[Decimal] = None
    max_barberos: Optional[int] = None
    max_turnos_mes: Optional[int] = None
    permite_whatsapp: Optional[bool] = None
    permite_pagos_online: Optional[bool] = None
    permite_reportes: Optional[bool] = None
    permite_inventario: Optional[bool] = None
    permite_qr: Optional[bool] = None
    orden: Optional[int] = None
    activo: Optional[bool] = None


# ---- Suscripciones ----
class SuscripcionRespuesta(BaseModel):
    id_suscripcion: int
    id_barberia: int
    id_plan: int
    estado: EstadoSuscripcionEnum
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)