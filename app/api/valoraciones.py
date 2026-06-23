"""Endpoints de valoraciones de turnos."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.valoracion import Valoracion
from app.models.turno import Turno
from app.schemas.valoracion import ValoracionCrear, ValoracionRespuesta

router = APIRouter(prefix="/valoraciones", tags=["Valoraciones"])


@router.get("", response_model=list[ValoracionRespuesta])
def listar_valoraciones(db: Session = Depends(get_db)):
    """Lista todas las valoraciones. Público."""
    return db.query(Valoracion).order_by(Valoracion.fecha_creacion.desc()).all()


@router.get("/barbero/{id_barbero}")
def valoraciones_barbero(id_barbero: int, db: Session = Depends(get_db)):
    """Devuelve las valoraciones de un barbero y su promedio. Público."""
    valoraciones = db.query(Valoracion).filter(
        Valoracion.id_barbero == id_barbero
    ).order_by(Valoracion.fecha_creacion.desc()).all()

    promedio = db.query(func.avg(Valoracion.estrellas)).filter(
        Valoracion.id_barbero == id_barbero
    ).scalar()

    return {
        "id_barbero": id_barbero,
        "promedio": round(float(promedio), 2) if promedio else None,
        "cantidad": len(valoraciones),
        "valoraciones": [ValoracionRespuesta.model_validate(v) for v in valoraciones],
    }


@router.post("", response_model=ValoracionRespuesta, status_code=201)
def crear_valoracion(datos: ValoracionCrear, db: Session = Depends(get_db)):
    """Crea una valoración para un turno. Público (el cliente valora su turno)."""
    turno = db.query(Turno).filter(Turno.id_turno == datos.id_turno).first()
    if turno is None:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    existe = db.query(Valoracion).filter(Valoracion.id_turno == datos.id_turno).first()
    if existe:
        raise HTTPException(status_code=409, detail="Este turno ya tiene una valoración")

    valoracion = Valoracion(
        id_turno=datos.id_turno,
        id_barbero=turno.id_barbero,
        id_cliente=turno.id_cliente,
        estrellas=datos.estrellas,
        comentario=datos.comentario,
    )
    db.add(valoracion)
    db.commit()
    db.refresh(valoracion)
    return valoracion
