"""Endpoints de Categorías de galería — multi-tenant."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.categoria_galeria import CategoriaGaleria
from app.models.usuario import Usuario, RolEnum
from app.schemas.categoria_galeria import (
    CategoriaGaleriaCrear,
    CategoriaGaleriaRespuesta,
    CategoriaGaleriaActualizar,
)
from app.core.dependencies import get_barberia_actual, requiere_rol

router = APIRouter(prefix="/categorias-galeria", tags=["Categorías Galería"])


@router.get("", response_model=list[CategoriaGaleriaRespuesta])
def listar(
    db: Session = Depends(get_db), id_barberia: int = Depends(get_barberia_actual)
):
    return (
        db.query(CategoriaGaleria)
        .filter(CategoriaGaleria.id_barberia == id_barberia)
        .order_by(CategoriaGaleria.orden, CategoriaGaleria.id_categoria_galeria)
        .all()
    )


@router.post("", response_model=CategoriaGaleriaRespuesta, status_code=201)
def crear(
    datos: CategoriaGaleriaCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    nueva = CategoriaGaleria(**datos.model_dump(), id_barberia=usuario.id_barberia)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.patch("/{id_categoria}", response_model=CategoriaGaleriaRespuesta)
def actualizar(
    id_categoria: int,
    datos: CategoriaGaleriaActualizar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    cat = db.query(CategoriaGaleria).filter(
        CategoriaGaleria.id_categoria_galeria == id_categoria,
        CategoriaGaleria.id_barberia == usuario.id_barberia,
    ).first()
    if cat is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(cat, campo, valor)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{id_categoria}", status_code=204)
def borrar(
    id_categoria: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    cat = db.query(CategoriaGaleria).filter(
        CategoriaGaleria.id_categoria_galeria == id_categoria,
        CategoriaGaleria.id_barberia == usuario.id_barberia,
    ).first()
    if cat is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    db.delete(cat)
    db.commit()
    return None
