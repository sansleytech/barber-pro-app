"""Esquemas Pydantic de productos."""

from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, computed_field


class ProductoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    marca: Optional[str] = None
    id_categoria: Optional[int] = None
    costo_actual: Decimal = Decimal(0)
    precio_venta: Decimal = Decimal(0)
    stock_actual: int = 0
    stock_minimo: int = 5
    stock_maximo: int = 50
    codigo_barras: Optional[str] = None
    foto: Optional[str] = None


class ProductoCrear(ProductoBase):
    pass


class ProductoActualizar(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    marca: Optional[str] = None
    id_categoria: Optional[int] = None
    costo_actual: Optional[Decimal] = None
    precio_venta: Optional[Decimal] = None
    stock_actual: Optional[int] = None
    stock_minimo: Optional[int] = None
    stock_maximo: Optional[int] = None
    codigo_barras: Optional[str] = None
    foto: Optional[str] = None


class ProductoRespuesta(ProductoBase):
    id_producto: int
    activo: bool

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def stock_bajo(self) -> bool:
        """True si el stock está en o por debajo del mínimo (alerta)."""
        return self.stock_actual <= self.stock_minimo
