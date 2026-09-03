"""Modelos de caja diaria: descuentos, gastos y cierres."""

from sqlalchemy import Column, Integer, String, Date, DateTime, DECIMAL, Text, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base


class CajaDescuento(Base):
    __tablename__ = "caja_descuentos"

    id_descuento = Column(Integer, primary_key=True, index=True)
    id_barberia = Column(Integer, ForeignKey("barberias.id_barberia"), nullable=False)
    fecha = Column(Date, nullable=False)
    monto = Column(DECIMAL(10, 2), nullable=False, default=0)
    fecha_actualizacion = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Gasto(Base):
    __tablename__ = "gastos"

    id_gasto = Column(Integer, primary_key=True, index=True)
    id_barberia = Column(Integer, ForeignKey("barberias.id_barberia"), nullable=False)
    fecha = Column(Date, nullable=False)
    categoria = Column(String(50), nullable=False)
    monto = Column(DECIMAL(10, 2), nullable=False)
    descripcion = Column(String(255), nullable=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    fecha_creacion = Column(DateTime, server_default=func.now())


class CierreCaja(Base):
    """OJO: estas columnas coinciden con la tabla REAL que ya existía en tu BD,
    no con un diseño nuevo. No renombres esto sin migrar la tabla."""
    __tablename__ = "cierres_caja"

    id_cierre = Column(Integer, primary_key=True, index=True)
    id_barberia = Column(Integer, ForeignKey("barberias.id_barberia"), nullable=False)
    fecha = Column(Date, nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    ingresos_turnos = Column(DECIMAL(10, 2), nullable=True, default=0)
    ingresos_ventas = Column(DECIMAL(10, 2), nullable=True, default=0)
    total_propinas = Column(DECIMAL(10, 2), nullable=True, default=0)
    total_gastos = Column(DECIMAL(10, 2), nullable=True, default=0)
    total_descuentos = Column(DECIMAL(10, 2), nullable=True, default=0)
    balance_final = Column(DECIMAL(10, 2), nullable=True)
    observaciones = Column(Text, nullable=True)
    fecha_cierre = Column(DateTime, server_default=func.now())