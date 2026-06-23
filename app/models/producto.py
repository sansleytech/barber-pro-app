"""Modelo de productos del inventario."""

from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Producto(Base):
    __tablename__ = "productos"

    id_producto = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(120), nullable=False)
    descripcion = Column(Text, nullable=True)
    marca = Column(String(80), nullable=True)
    id_categoria = Column(Integer, ForeignKey("categorias_productos.id_categoria"), nullable=True)
    costo_actual = Column(DECIMAL(10, 2), default=0)
    precio_venta = Column(DECIMAL(10, 2), default=0)
    stock_actual = Column(Integer, default=0)
    stock_minimo = Column(Integer, default=5)
    stock_maximo = Column(Integer, default=50)
    codigo_barras = Column(String(80), nullable=True)
    foto = Column(String(255), nullable=True)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, server_default=func.now())

    categoria = relationship("CategoriaProducto")
