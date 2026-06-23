"""Endpoints de caja: gastos, descuentos y cierres — multi-tenant."""
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
    GastoCrear, GastoRespuesta, DescuentoCrear, DescuentoRespuesta,
    CierreCrear, CierreRespuesta,
)
from app.core.dependencies import requiere_rol

router = APIRouter(prefix="/caja", tags=["Caja"])

_ROL_OPER = (RolEnum.administrador, RolEnum.recepcionista)


# ---------- GASTOS ----------
@router.get("/gastos", response_model=list[GastoRespuesta])
def listar_gastos(db: Session = Depends(get_db),
                  usuario: Usuario = Depends(requiere_rol(*_ROL_OPER))):
    return db.query(GastoCaja).filter(
        GastoCaja.id_barberia == usuario.id_barberia
    ).order_by(GastoCaja.fecha.desc()).all()


@router.post("/gastos", response_model=GastoRespuesta, status_code=201)
def crear_gasto(datos: GastoCrear, db: Session = Depends(get_db),
                usuario: Usuario = Depends(requiere_rol(*_ROL_OPER))):
    gasto = GastoCaja(**datos.model_dump(), id_usuario=usuario.id_usuario,
                      id_barberia=usuario.id_barberia)
    db.add(gasto); db.commit(); db.refresh(gasto)
    return gasto


# ---------- DESCUENTOS ----------
@router.get("/descuentos", response_model=list[DescuentoRespuesta])
def listar_descuentos(db: Session = Depends(get_db),
                      usuario: Usuario = Depends(requiere_rol(*_ROL_OPER))):
    return db.query(DescuentoCaja).filter(
        DescuentoCaja.id_barberia == usuario.id_barberia
    ).order_by(DescuentoCaja.fecha.desc()).all()


@router.post("/descuentos", response_model=DescuentoRespuesta, status_code=201)
def crear_descuento(datos: DescuentoCrear, db: Session = Depends(get_db),
                    usuario: Usuario = Depends(requiere_rol(*_ROL_OPER))):
    desc = DescuentoCaja(**datos.model_dump(), id_usuario=usuario.id_usuario,
                         id_barberia=usuario.id_barberia)
    db.add(desc); db.commit(); db.refresh(desc)
    return desc


# ---------- CIERRE ----------
@router.get("/cierres", response_model=list[CierreRespuesta])
def listar_cierres(db: Session = Depends(get_db),
                   usuario: Usuario = Depends(requiere_rol(RolEnum.administrador))):
    return db.query(CierreCaja).filter(
        CierreCaja.id_barberia == usuario.id_barberia
    ).order_by(CierreCaja.fecha.desc()).all()


@router.post("/cierres", response_model=CierreRespuesta, status_code=201)
def crear_cierre(datos: CierreCrear, db: Session = Depends(get_db),
                 usuario: Usuario = Depends(requiere_rol(RolEnum.administrador))):
    """Cierre de caja del día, calculado SOLO con datos de esta barbería."""
    bid = usuario.id_barberia

    existe = db.query(CierreCaja).filter(
        CierreCaja.fecha == datos.fecha, CierreCaja.id_barberia == bid
    ).first()
    if existe:
        raise HTTPException(status_code=409, detail="Ya existe un cierre para esa fecha")

    ingresos_turnos = db.query(func.coalesce(func.sum(Turno.precio_total), 0)).filter(
        Turno.fecha == datos.fecha,
        Turno.estado == EstadoTurnoEnum.completado,
        Turno.id_barberia == bid,
    ).scalar() or Decimal(0)

    total_propinas = db.query(func.coalesce(func.sum(Turno.propina), 0)).filter(
        Turno.fecha == datos.fecha,
        Turno.estado == EstadoTurnoEnum.completado,
        Turno.id_barberia == bid,
    ).scalar() or Decimal(0)

    ingresos_ventas = db.query(func.coalesce(func.sum(VentaProducto.total), 0)).filter(
        func.date(VentaProducto.fecha_venta) == datos.fecha,
        VentaProducto.id_barberia == bid,
    ).scalar() or Decimal(0)

    total_gastos = db.query(func.coalesce(func.sum(GastoCaja.monto), 0)).filter(
        GastoCaja.fecha == datos.fecha,
        GastoCaja.id_barberia == bid,
    ).scalar() or Decimal(0)

    total_descuentos = db.query(func.coalesce(func.sum(DescuentoCaja.monto), 0)).filter(
        DescuentoCaja.fecha == datos.fecha,
        DescuentoCaja.id_barberia == bid,
    ).scalar() or Decimal(0)

    balance_final = (
        Decimal(ingresos_turnos) + Decimal(ingresos_ventas) + Decimal(total_propinas)
        - Decimal(total_gastos) - Decimal(total_descuentos)
    )

    cierre = CierreCaja(
        fecha=datos.fecha,
        ingresos_turnos=ingresos_turnos,
        ingresos_ventas=ingresos_ventas,
        total_propinas=total_propinas,
        total_gastos=total_gastos,
        total_descuentos=total_descuentos,
        balance_final=balance_final,
        id_usuario=usuario.id_usuario,
        observaciones=datos.observaciones,
        id_barberia=bid,
    )
    db.add(cierre); db.commit(); db.refresh(cierre)
    return cierre
