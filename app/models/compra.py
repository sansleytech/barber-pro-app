"""Modelo de compras de productos (reposición de stock)."""

from sqlalchemy import Column, Integer, String, Text, DECIMAL, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class CompraProducto(Base):
    __tablename__ = "compras_productos"

    id_compra = Column(Integer, primary_key=True, autoincrement=True)
    id_producto = Column(Integer, ForeignKey("productos.id_producto", ondelete="CASCADE"), nullable=False)
    id_proveedor = Column(Integer, ForeignKey("proveedores.id_proveedor"), nullable=True)
    cantidad = Column(Integer, nullable=False)
    costo_unitario = Column(DECIMAL(10, 2), nullable=False)
    costo_total = Column(DECIMAL(10, 2), nullable=False)
    fecha_compra = Column(Date, nullable=False)
    factura = Column(String(80), nullable=True)
    observaciones = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime, server_default=func.now())

    producto = relationship("Producto")
    proveedor = relationship("Proveedor")
