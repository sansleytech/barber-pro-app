"""Endpoints de Valoraciones — multi-tenant."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.valoracion import Valoracion
from app.models.turno import Turno
from app.schemas.valoracion import ValoracionCrear, ValoracionRespuesta
from app.core.dependencies import get_barberia_actual

router = APIRouter(prefix="/valoraciones", tags=["Valoraciones"])


@router.get("", response_model=list[ValoracionRespuesta])
def listar(
    db: Session = Depends(get_db), id_barberia: int = Depends(get_barberia_actual)
):
    return (
        db.query(Valoracion)
        .filter(Valoracion.id_barberia == id_barberia)
        .order_by(Valoracion.fecha_creacion.desc())
        .all()
    )


@router.get("/barbero/{id_barbero}")
def valoraciones_barbero(
    id_barbero: int,
    db: Session = Depends(get_db),
    id_barberia: int = Depends(get_barberia_actual),
):
    valoraciones = (
        db.query(Valoracion)
        .filter(
            Valoracion.id_barbero == id_barbero,
            Valoracion.id_barberia == id_barberia,
        )
        .order_by(Valoracion.fecha_creacion.desc())
        .all()
    )
    promedio = (
        db.query(func.avg(Valoracion.estrellas))
        .filter(
            Valoracion.id_barbero == id_barbero,
            Valoracion.id_barberia == id_barberia,
        )
        .scalar()
    )
    return {
        "id_barbero": id_barbero,
        "promedio": round(float(promedio), 2) if promedio else None,
        "cantidad": len(valoraciones),
        "valoraciones": [ValoracionRespuesta.model_validate(v) for v in valoraciones],
    }


@router.post("", response_model=ValoracionRespuesta, status_code=201)
def crear(
    datos: ValoracionCrear,
    db: Session = Depends(get_db),
    id_barberia: int = Depends(get_barberia_actual),
):
    turno = (
        db.query(Turno)
        .filter(Turno.id_turno == datos.id_turno, Turno.id_barberia == id_barberia)
        .first()
    )
    if turno is None:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    existe = (
        db.query(Valoracion)
        .filter(
            Valoracion.id_turno == datos.id_turno, Valoracion.id_barberia == id_barberia
        )
        .first()
    )
    if existe:
        raise HTTPException(
            status_code=409, detail="Este turno ya tiene una valoración"
        )
    valoracion = Valoracion(
        id_turno=datos.id_turno,
        id_barbero=turno.id_barbero,
        id_cliente=turno.id_cliente,
        estrellas=datos.estrellas,
        comentario=datos.comentario,
        id_barberia=id_barberia,
    )
    db.add(valoracion)
    db.commit()
    db.refresh(valoracion)
    return valoracion
