"""Endpoints de Galería — multi-tenant."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.galeria import FotoGaleria
from app.models.usuario import Usuario, RolEnum
from app.schemas.galeria import (
    FotoGaleriaCrear,
    FotoGaleriaRespuesta,
    FotoGaleriaActualizar,
)
from app.core.dependencies import get_barberia_actual, requiere_rol

router = APIRouter(prefix="/galeria", tags=["Galería"])


@router.get("", response_model=list[FotoGaleriaRespuesta])
def listar(
    db: Session = Depends(get_db), id_barberia: int = Depends(get_barberia_actual)
):
    return (
        db.query(FotoGaleria)
        .filter(FotoGaleria.id_barberia == id_barberia)
        .order_by(FotoGaleria.orden, FotoGaleria.id_foto)
        .all()
    )


@router.post("", response_model=FotoGaleriaRespuesta, status_code=201)
def crear(
    datos: FotoGaleriaCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    nueva = FotoGaleria(**datos.model_dump(), id_barberia=usuario.id_barberia)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.patch("/{id_foto}", response_model=FotoGaleriaRespuesta)
def actualizar(
    id_foto: int,
    datos: FotoGaleriaActualizar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    foto = db.query(FotoGaleria).filter(
        FotoGaleria.id_foto == id_foto,
        FotoGaleria.id_barberia == usuario.id_barberia,
    ).first()
    if foto is None:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(foto, campo, valor)
    db.commit()
    db.refresh(foto)
    return foto


@router.delete("/{id_foto}", status_code=204)
def borrar(
    id_foto: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    foto = db.query(FotoGaleria).filter(
        FotoGaleria.id_foto == id_foto,
        FotoGaleria.id_barberia == usuario.id_barberia,
    ).first()
    if foto is None:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    db.delete(foto)
    db.commit()
    return None
