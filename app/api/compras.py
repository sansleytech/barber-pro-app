"""Endpoints de compras de productos (reposición de stock)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.compra import CompraProducto
from app.models.producto import Producto
from app.models.proveedor import Proveedor
from app.models.usuario import Usuario, RolEnum
from app.schemas.compra import CompraCrear, CompraRespuesta
from app.core.dependencies import requiere_rol

router = APIRouter(prefix="/compras", tags=["Compras"])


@router.get("", response_model=list[CompraRespuesta])
def listar_compras(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Lista todas las compras. Solo administradores."""
    return db.query(CompraProducto).order_by(CompraProducto.fecha_compra.desc()).all()


@router.post("", response_model=CompraRespuesta, status_code=201)
def registrar_compra(
    datos: CompraCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Registra una compra y suma la cantidad al stock del producto. Solo admin."""
    # Validar producto
    producto = db.query(Producto).filter(Producto.id_producto == datos.id_producto).first()
    if producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Validar proveedor si se indicó
    if datos.id_proveedor is not None:
        prov = db.query(Proveedor).filter(Proveedor.id_proveedor == datos.id_proveedor).first()
        if prov is None:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    if datos.cantidad <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a cero")

    costo_total = datos.costo_unitario * datos.cantidad

    # Crear la compra
    compra = CompraProducto(
        id_producto=datos.id_producto,
        id_proveedor=datos.id_proveedor,
        cantidad=datos.cantidad,
        costo_unitario=datos.costo_unitario,
        costo_total=costo_total,
        fecha_compra=datos.fecha_compra,
        factura=datos.factura,
        observaciones=datos.observaciones,
    )
    db.add(compra)

    # Actualizar el stock y el costo del producto
    producto.stock_actual = (producto.stock_actual or 0) + datos.cantidad
    producto.costo_actual = datos.costo_unitario

    db.commit()
    db.refresh(compra)
    return compra
