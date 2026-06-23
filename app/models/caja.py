"""Modelos de caja: cierres diarios, gastos y descuentos."""

from sqlalchemy import Column, Integer, String, Text, DECIMAL, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class GastoCaja(Base):
    __tablename__ = "gastos_caja"

    id_gasto = Column(Integer, primary_key=True, autoincrement=True)
    concepto = Column(String(150), nullable=False)
    monto = Column(DECIMAL(10, 2), nullable=False)
    fecha = Column(Date, nullable=False)
    categoria = Column(String(60), nullable=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    observaciones = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime, server_default=func.now())


class DescuentoCaja(Base):
    __tablename__ = "descuentos_caja"

    id_descuento = Column(Integer, primary_key=True, autoincrement=True)
    concepto = Column(String(150), nullable=False)
    monto = Column(DECIMAL(10, 2), nullable=False)
    fecha = Column(Date, nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    observaciones = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime, server_default=func.now())


class CierreCaja(Base):
    __tablename__ = "cierres_caja"

    id_cierre = Column(Integer, primary_key=True, autoincrement=True)
    fecha = Column(Date, nullable=False, unique=True)
    ingresos_turnos = Column(DECIMAL(10, 2), default=0)
    ingresos_ventas = Column(DECIMAL(10, 2), default=0)
    total_propinas = Column(DECIMAL(10, 2), default=0)
    total_gastos = Column(DECIMAL(10, 2), default=0)
    total_descuentos = Column(DECIMAL(10, 2), default=0)
    balance_final = Column(DECIMAL(10, 2), default=0)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    observaciones = Column(Text, nullable=True)
    fecha_cierre = Column(DateTime, server_default=func.now())
