"""Endpoints de acontecimientos y cumpleaños."""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract

from app.db.session import get_db
from app.models.acontecimiento import Acontecimiento
from app.models.cliente import Cliente
from app.models.usuario import Usuario, RolEnum
from app.schemas.acontecimiento import (
    AcontecimientoCrear, AcontecimientoRespuesta, CumpleanosRespuesta
)
from app.core.dependencies import requiere_rol

router = APIRouter(prefix="/acontecimientos", tags=["Acontecimientos"])


@router.get("/cumpleanos/mes/{mes}", response_model=list[CumpleanosRespuesta])
def cumpleanos_del_mes(
    mes: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador, RolEnum.recepcionista)),
):
    """Clientes que cumplen años en el mes dado (1-12)."""
    if mes < 1 or mes > 12:
        raise HTTPException(status_code=400, detail="El mes debe estar entre 1 y 12")

    clientes = db.query(Cliente).filter(
        Cliente.fecha_nacimiento.isnot(None),
        extract("month", Cliente.fecha_nacimiento) == mes,
        Cliente.activo == True,
    ).all()

    resultado = []
    for c in clientes:
        nombre = f"{c.primer_nombre} {c.apellidos}".strip()
        resultado.append(CumpleanosRespuesta(
            id_cliente=c.id_cliente,
            nombre=nombre,
            fecha_nacimiento=c.fecha_nacimiento,
            dia=c.fecha_nacimiento.day,
            mes=c.fecha_nacimiento.month,
        ))
    return resultado


@router.get("/cumpleanos/hoy", response_model=list[CumpleanosRespuesta])
def cumpleanos_de_hoy(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador, RolEnum.recepcionista)),
):
    """Clientes que cumplen años hoy."""
    hoy = date.today()
    clientes = db.query(Cliente).filter(
        Cliente.fecha_nacimiento.isnot(None),
        extract("month", Cliente.fecha_nacimiento) == hoy.month,
        extract("day", Cliente.fecha_nacimiento) == hoy.day,
        Cliente.activo == True,
    ).all()

    return [
        CumpleanosRespuesta(
            id_cliente=c.id_cliente,
            nombre=f"{c.primer_nombre} {c.apellidos}".strip(),
            fecha_nacimiento=c.fecha_nacimiento,
            dia=c.fecha_nacimiento.day,
            mes=c.fecha_nacimiento.month,
        )
        for c in clientes
    ]


@router.get("", response_model=list[AcontecimientoRespuesta])
def listar_acontecimientos(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador, RolEnum.recepcionista)),
):
    """Lista los acontecimientos activos."""
    return db.query(Acontecimiento).filter(
        Acontecimiento.activo == True
    ).order_by(Acontecimiento.fecha).all()


@router.post("", response_model=AcontecimientoRespuesta, status_code=201)
def crear_acontecimiento(
    datos: AcontecimientoCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador, RolEnum.recepcionista)),
):
    """Crea un acontecimiento."""
    evento = Acontecimiento(**datos.model_dump())
    db.add(evento)
    db.commit()
    db.refresh(evento)
    return evento
