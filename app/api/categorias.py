"""Endpoints de Categorías de productos — multi-tenant."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.categoria_producto import CategoriaProducto
from app.models.usuario import Usuario, RolEnum
from app.schemas.categoria_producto import CategoriaCrear, CategoriaRespuesta, CategoriaActualizar
from app.core.dependencies import get_barberia_actual, requiere_rol

router = APIRouter(prefix="/categorias", tags=["Categorías de productos"])


@router.get("", response_model=list[CategoriaRespuesta])
def listar(db: Session = Depends(get_db), id_barberia: int = Depends(get_barberia_actual)):
    return db.query(CategoriaProducto).filter(
        CategoriaProducto.activo == True, CategoriaProducto.id_barberia == id_barberia
    ).order_by(CategoriaProducto.orden).all()


@router.post("", response_model=CategoriaRespuesta, status_code=201)
def crear(datos: CategoriaCrear, db: Session = Depends(get_db),
          usuario: Usuario = Depends(requiere_rol(RolEnum.administrador))):
    existe = db.query(CategoriaProducto).filter(
        CategoriaProducto.nombre == datos.nombre,
        CategoriaProducto.id_barberia == usuario.id_barberia,
    ).first()
    if existe:
        raise HTTPException(status_code=409, detail="Ya existe una categoría con ese nombre")
    nueva = CategoriaProducto(**datos.model_dump(), id_barberia=usuario.id_barberia)
    db.add(nueva); db.commit(); db.refresh(nueva)
    return nueva


@router.put("/{id_categoria}", response_model=CategoriaRespuesta)
def actualizar(id_categoria: int, datos: CategoriaActualizar, db: Session = Depends(get_db),
               usuario: Usuario = Depends(requiere_rol(RolEnum.administrador))):
    item = db.query(CategoriaProducto).filter(
        CategoriaProducto.id_categoria == id_categoria,
        CategoriaProducto.id_barberia == usuario.id_barberia,
    ).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    for c, v in datos.model_dump(exclude_unset=True).items():
        setattr(item, c, v)
    db.commit(); db.refresh(item)
    return item


@router.delete("/{id_categoria}", status_code=200)
def desactivar(id_categoria: int, db: Session = Depends(get_db),
               usuario: Usuario = Depends(requiere_rol(RolEnum.administrador))):
    item = db.query(CategoriaProducto).filter(
        CategoriaProducto.id_categoria == id_categoria,
        CategoriaProducto.id_barberia == usuario.id_barberia,
    ).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    item.activo = False; db.commit()
    return {"mensaje": f"Categoría {id_categoria} desactivada"}
