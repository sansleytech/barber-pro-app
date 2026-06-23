"""Esquemas Pydantic de compras de productos."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CompraCrear(BaseModel):
    id_producto: int
    id_proveedor: Optional[int] = None
    cantidad: int
    costo_unitario: Decimal
    fecha_compra: date
    factura: Optional[str] = None
    observaciones: Optional[str] = None


class CompraRespuesta(BaseModel):
    id_compra: int
    id_producto: int
    id_proveedor: Optional[int] = None
    cantidad: int
    costo_unitario: Decimal
    costo_total: Decimal
    fecha_compra: date
    factura: Optional[str] = None
    observaciones: Optional[str] = None
    fecha_creacion: datetime

    model_config = ConfigDict(from_attributes=True)
