"""Endpoints de caja: gastos, descuentos y cierres diarios."""

from datetime import date as date_type
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.caja import GastoCaja, DescuentoCaja, CierreCaja
from app.models.turno import Turno, EstadoTurnoEnum
from app.models.venta import VentaProducto
from app.models.usuario import Usuario, RolEnum
from app.schemas.caja import (
    GastoCrear,
    GastoRespuesta,
    DescuentoCrear,
    DescuentoRespuesta,
    CierreCrear,
    CierreRespuesta,
)
from app.core.dependencies import get_usuario_actual, requiere_rol

router = APIRouter(prefix="/caja", tags=["Caja"])


# ---------- GASTOS ----------
@router.get("/gastos", response_model=list[GastoRespuesta])
def listar_gastos(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(
        requiere_rol(RolEnum.administrador, RolEnum.recepcionista)
    ),
):
    """Lista los gastos. Admin y recepcionista."""
    return db.query(GastoCaja).order_by(GastoCaja.fecha.desc()).all()


@router.post("/gastos", response_model=GastoRespuesta, status_code=201)
def crear_gasto(
    datos: GastoCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(
        requiere_rol(RolEnum.administrador, RolEnum.recepcionista)
    ),
):
    """Registra un gasto. Admin y recepcionista."""
    gasto = GastoCaja(**datos.model_dump(), id_usuario=usuario_actual.id_usuario)
    db.add(gasto)
    db.commit()
    db.refresh(gasto)
    return gasto


# ---------- DESCUENTOS ----------
@router.get("/descuentos", response_model=list[DescuentoRespuesta])
def listar_descuentos(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(
        requiere_rol(RolEnum.administrador, RolEnum.recepcionista)
    ),
):
    """Lista los descuentos. Admin y recepcionista."""
    return db.query(DescuentoCaja).order_by(DescuentoCaja.fecha.desc()).all()


@router.post("/descuentos", response_model=DescuentoRespuesta, status_code=201)
def crear_descuento(
    datos: DescuentoCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(
        requiere_rol(RolEnum.administrador, RolEnum.recepcionista)
    ),
):
    """Registra un descuento. Admin y recepcionista."""
    desc = DescuentoCaja(**datos.model_dump(), id_usuario=usuario_actual.id_usuario)
    db.add(desc)
    db.commit()
    db.refresh(desc)
    return desc


# ---------- CIERRE ----------
@router.get("/cierres", response_model=list[CierreRespuesta])
def listar_cierres(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Lista los cierres de caja. Solo administradores."""
    return db.query(CierreCaja).order_by(CierreCaja.fecha.desc()).all()


@router.post("/cierres", response_model=CierreRespuesta, status_code=201)
def crear_cierre(
    datos: CierreCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Hace el cierre de caja de un día, calculando todo automáticamente. Solo admin."""

    # Evitar cierre duplicado del mismo día
    existe = db.query(CierreCaja).filter(CierreCaja.fecha == datos.fecha).first()
    if existe:
        raise HTTPException(
            status_code=409, detail="Ya existe un cierre para esa fecha"
        )

    # 1. Ingresos por turnos completados ese día
    ingresos_turnos = db.query(func.coalesce(func.sum(Turno.precio_total), 0)).filter(
        Turno.fecha == datos.fecha,
        Turno.estado == EstadoTurnoEnum.completado,
    ).scalar() or Decimal(0)

    # 2. Propinas de esos turnos
    total_propinas = db.query(func.coalesce(func.sum(Turno.propina), 0)).filter(
        Turno.fecha == datos.fecha,
        Turno.estado == EstadoTurnoEnum.completado,
    ).scalar() or Decimal(0)

    # 3. Ingresos por ventas de productos ese día
    ingresos_ventas = db.query(func.coalesce(func.sum(VentaProducto.total), 0)).filter(
        func.date(VentaProducto.fecha_venta) == datos.fecha,
    ).scalar() or Decimal(0)

    # 4. Gastos del día
    total_gastos = db.query(func.coalesce(func.sum(GastoCaja.monto), 0)).filter(
        GastoCaja.fecha == datos.fecha,
    ).scalar() or Decimal(0)

    # 5. Descuentos del día
    total_descuentos = db.query(func.coalesce(func.sum(DescuentoCaja.monto), 0)).filter(
        DescuentoCaja.fecha == datos.fecha,
    ).scalar() or Decimal(0)

    # 6. Balance: ingresos - gastos - descuentos
    balance_final = (
        Decimal(ingresos_turnos)
        + Decimal(ingresos_ventas)
        + Decimal(total_propinas)
        - Decimal(total_gastos)
        - Decimal(total_descuentos)
    )

    cierre = CierreCaja(
        fecha=datos.fecha,
        ingresos_turnos=ingresos_turnos,
        ingresos_ventas=ingresos_ventas,
        total_propinas=total_propinas,
        total_gastos=total_gastos,
        total_descuentos=total_descuentos,
        balance_final=balance_final,
        id_usuario=usuario_actual.id_usuario,
        observaciones=datos.observaciones,
    )
    db.add(cierre)
    db.commit()
    db.refresh(cierre)
    return cierre
