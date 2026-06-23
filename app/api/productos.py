"""Endpoints de productos."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.producto import Producto
from app.models.usuario import Usuario, RolEnum
from app.schemas.producto import ProductoCrear, ProductoRespuesta, ProductoActualizar
from app.core.dependencies import requiere_rol

router = APIRouter(prefix="/productos", tags=["Productos"])


@router.get("", response_model=list[ProductoRespuesta])
def listar_productos(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador, RolEnum.recepcionista)),
):
    """Lista productos activos. Admin y recepcionista."""
    return db.query(Producto).filter(Producto.activo == True).all()


@router.get("/stock-bajo", response_model=list[ProductoRespuesta])
def productos_stock_bajo(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador, RolEnum.recepcionista)),
):
    """Lista productos con stock en o bajo el mínimo (alertas)."""
    return db.query(Producto).filter(
        Producto.activo == True,
        Producto.stock_actual <= Producto.stock_minimo,
    ).all()


@router.get("/{id_producto}", response_model=ProductoRespuesta)
def obtener_producto(
    id_producto: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador, RolEnum.recepcionista)),
):
    """Devuelve un producto por su id."""
    prod = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if prod is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return prod


@router.post("", response_model=ProductoRespuesta, status_code=201)
def crear_producto(
    datos: ProductoCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Crea un producto. Solo administradores."""
    nuevo = Producto(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_producto}", response_model=ProductoRespuesta)
def actualizar_producto(
    id_producto: int,
    datos: ProductoActualizar,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Actualiza un producto. Solo administradores."""
    prod = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if prod is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(prod, campo, valor)
    db.commit()
    db.refresh(prod)
    return prod


@router.delete("/{id_producto}", status_code=200)
def desactivar_producto(
    id_producto: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Desactiva un producto. Solo administradores."""
    prod = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if prod is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    prod.activo = False
    db.commit()
    return {"mensaje": f"Producto {id_producto} desactivado"}
