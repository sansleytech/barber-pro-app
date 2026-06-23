"""Esquemas Pydantic de ventas de productos."""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


# Un item del carrito que el cliente quiere comprar
class ItemVentaCrear(BaseModel):
    id_producto: int
    cantidad: int


class VentaCrear(BaseModel):
    id_cliente: Optional[int] = None
    metodo_pago: str = "efectivo"
    observaciones: Optional[str] = None
    items: list[ItemVentaCrear]


# Cómo se devuelve cada item en la respuesta
class ItemVentaRespuesta(BaseModel):
    id_producto: int
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)


class VentaRespuesta(BaseModel):
    id_venta: int
    id_cliente: Optional[int] = None
    id_usuario_vendedor: Optional[int] = None
    subtotal: Decimal
    iva: Decimal
    total: Decimal
    metodo_pago: str
    numero_factura: Optional[str] = None
    observaciones: Optional[str] = None
    fecha_venta: datetime
    items: list[ItemVentaRespuesta]

    model_config = ConfigDict(from_attributes=True)
