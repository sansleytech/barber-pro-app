"""Endpoints CRUD de Gastos / egresos del día."""

from datetime import date as date_type
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.caja import Gasto
from app.core.dependencies import verificar_barberia_activa, get_barberia_actual
from app.schemas.caja import GastoCrear, GastoRespuesta

router = APIRouter(prefix="/gastos", tags=["Gastos"])


@router.get("", response_model=list[GastoRespuesta])
def listar_gastos(
    fecha: date_type,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(verificar_barberia_activa),
    id_barberia: int = Depends(get_barberia_actual),
):
    return (
        db.query(Gasto)
        .filter(Gasto.fecha == fecha, Gasto.id_barberia == id_barberia)
        .order_by(Gasto.fecha_creacion.desc())
        .all()
    )


@router.post("", response_model=GastoRespuesta, status_code=201)
def crear_gasto(
    datos: GastoCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(verificar_barberia_activa),
    id_barberia: int = Depends(get_barberia_actual),
):
    nuevo = Gasto(
        id_barberia=id_barberia,
        fecha=datos.fecha,
        categoria=datos.categoria,
        monto=datos.monto,
        descripcion=datos.descripcion,
        id_usuario=datos.id_usuario,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.delete("/{id_gasto}", status_code=204)
def eliminar_gasto(
    id_gasto: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(verificar_barberia_activa),
    id_barberia: int = Depends(get_barberia_actual),
):
    gasto = (
        db.query(Gasto)
        .filter(Gasto.id_gasto == id_gasto, Gasto.id_barberia == id_barberia)
        .first()
    )
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    db.delete(gasto)
    db.commit()
    return None