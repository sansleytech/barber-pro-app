"""Endpoints de compras de productos — multi-tenant."""
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
def listar_compras(db: Session = Depends(get_db),
                   usuario: Usuario = Depends(requiere_rol(RolEnum.administrador))):
    """Lista las compras de la barbería. Solo administradores."""
    return db.query(CompraProducto).filter(
        CompraProducto.id_barberia == usuario.id_barberia
    ).order_by(CompraProducto.fecha_compra.desc()).all()


@router.post("", response_model=CompraRespuesta, status_code=201)
def registrar_compra(datos: CompraCrear, db: Session = Depends(get_db),
                     usuario: Usuario = Depends(requiere_rol(RolEnum.administrador))):
    """Registra una compra y suma stock. Solo admin."""
    bid = usuario.id_barberia

    # Validar producto EN ESTA BARBERÍA
    producto = db.query(Producto).filter(
        Producto.id_producto == datos.id_producto, Producto.id_barberia == bid
    ).first()
    if producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Validar proveedor EN ESTA BARBERÍA (si se indicó)
    if datos.id_proveedor is not None:
        prov = db.query(Proveedor).filter(
            Proveedor.id_proveedor == datos.id_proveedor, Proveedor.id_barberia == bid
        ).first()
        if prov is None:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    if datos.cantidad <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a cero")

    costo_total = datos.costo_unitario * datos.cantidad
    compra = CompraProducto(
        id_producto=datos.id_producto,
        id_proveedor=datos.id_proveedor,
        cantidad=datos.cantidad,
        costo_unitario=datos.costo_unitario,
        costo_total=costo_total,
        fecha_compra=datos.fecha_compra,
        factura=datos.factura,
        observaciones=datos.observaciones,
        id_barberia=bid,
    )
    db.add(compra)
    producto.stock_actual = (producto.stock_actual or 0) + datos.cantidad
    producto.costo_actual = datos.costo_unitario
    db.commit(); db.refresh(compra)
    return compra
