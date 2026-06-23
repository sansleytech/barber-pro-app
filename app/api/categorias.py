"""Endpoints de categorías de productos."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.categoria_producto import CategoriaProducto
from app.models.usuario import Usuario, RolEnum
from app.schemas.categoria_producto import CategoriaCrear, CategoriaRespuesta, CategoriaActualizar
from app.core.dependencies import requiere_rol

router = APIRouter(prefix="/categorias", tags=["Categorías de productos"])


@router.get("", response_model=list[CategoriaRespuesta])
def listar_categorias(db: Session = Depends(get_db)):
    """Lista las categorías activas. Público."""
    return db.query(CategoriaProducto).filter(
        CategoriaProducto.activo == True
    ).order_by(CategoriaProducto.orden).all()


@router.post("", response_model=CategoriaRespuesta, status_code=201)
def crear_categoria(
    datos: CategoriaCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Crea una categoría. Solo administradores."""
    existe = db.query(CategoriaProducto).filter(
        CategoriaProducto.nombre == datos.nombre
    ).first()
    if existe:
        raise HTTPException(status_code=409, detail="Ya existe una categoría con ese nombre")
    nueva = CategoriaProducto(**datos.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.put("/{id_categoria}", response_model=CategoriaRespuesta)
def actualizar_categoria(
    id_categoria: int,
    datos: CategoriaActualizar,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Actualiza una categoría. Solo administradores."""
    cat = db.query(CategoriaProducto).filter(
        CategoriaProducto.id_categoria == id_categoria
    ).first()
    if cat is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(cat, campo, valor)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{id_categoria}", status_code=200)
def desactivar_categoria(
    id_categoria: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Desactiva una categoría. Solo administradores."""
    cat = db.query(CategoriaProducto).filter(
        CategoriaProducto.id_categoria == id_categoria
    ).first()
    if cat is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    cat.activo = False
    db.commit()
    return {"mensaje": f"Categoría {id_categoria} desactivada"}
