"""Modelos de ventas de productos y sus items (carrito)."""

from sqlalchemy import Column, Integer, String, Text, DECIMAL, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.mixins import TenantMixin


class VentaProducto(Base, TenantMixin):
    __tablename__ = "ventas_productos"

    id_venta = Column(Integer, primary_key=True, autoincrement=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=True)
    id_usuario_vendedor = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    subtotal = Column(DECIMAL(10, 2), default=0)
    iva = Column(DECIMAL(10, 2), default=0)
    total = Column(DECIMAL(10, 2), nullable=False)
    metodo_pago = Column(String(30), default="efectivo")
    numero_factura = Column(String(50), nullable=True)
    observaciones = Column(Text, nullable=True)
    fecha_venta = Column(DateTime, server_default=func.now())

    cliente = relationship("Cliente")
    vendedor = relationship("Usuario")
    items = relationship("VentaCarrito", back_populates="venta", cascade="all, delete-orphan")


class VentaCarrito(Base):
    __tablename__ = "ventas_carrito"

    id_carrito_item = Column(Integer, primary_key=True, autoincrement=True)
    id_venta = Column(Integer, ForeignKey("ventas_productos.id_venta", ondelete="CASCADE"), nullable=False)
    id_producto = Column(Integer, ForeignKey("productos.id_producto"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)
    subtotal = Column(DECIMAL(10, 2), nullable=False)

    venta = relationship("VentaProducto", back_populates="items")
    producto = relationship("Producto")
