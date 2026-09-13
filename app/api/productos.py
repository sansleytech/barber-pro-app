"""Endpoints de productos — multi-tenant."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.producto import Producto
from app.models.usuario import Usuario, RolEnum
from app.schemas.producto import ProductoCrear, ProductoRespuesta, ProductoActualizar
from app.core.dependencies import requiere_rol, requiere_plan

router = APIRouter(prefix="/productos", tags=["Productos"])


@router.get("", response_model=list[ProductoRespuesta])
def listar_productos(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(
        requiere_rol(RolEnum.administrador, RolEnum.recepcionista)
    ),
    _: Usuario = Depends(requiere_plan("permite_inventario")),
):
    """Lista productos activos de la barbería. Admin y recepcionista."""
    return (
        db.query(Producto)
        .filter(
            Producto.activo == True,
            Producto.id_barberia == usuario_actual.id_barberia,
        )
        .all()
    )


@router.get("/stock-bajo", response_model=list[ProductoRespuesta])
def productos_stock_bajo(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(
        requiere_rol(RolEnum.administrador, RolEnum.recepcionista)
    ),
    _: Usuario = Depends(requiere_plan("permite_inventario")),
):
    """Lista productos con stock en o bajo el mínimo (alertas)."""
    return (
        db.query(Producto)
        .filter(
            Producto.activo == True,
            Producto.id_barberia == usuario_actual.id_barberia,
            Producto.stock_actual <= Producto.stock_minimo,
        )
        .all()
    )


@router.get("/{id_producto}", response_model=ProductoRespuesta)
def obtener_producto(
    id_producto: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(
        requiere_rol(RolEnum.administrador, RolEnum.recepcionista)
    ),
    _: Usuario = Depends(requiere_plan("permite_inventario")),
):
    """Devuelve un producto por su id (solo de la barbería del usuario)."""
    prod = (
        db.query(Producto)
        .filter(
            Producto.id_producto == id_producto,
            Producto.id_barberia == usuario_actual.id_barberia,
        )
        .first()
    )
    if prod is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return prod


@router.post("", response_model=ProductoRespuesta, status_code=201)
def crear_producto(
    datos: ProductoCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
    _: Usuario = Depends(requiere_plan("permite_inventario")),
):
    """Crea un producto. Solo administradores."""
    nuevo = Producto(**datos.model_dump(), id_barberia=usuario_actual.id_barberia)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    usuario_barbero = db.query(Usuario).filter(
        Usuario.id_barbero == barbero.id_barbero,
        Usuario.id_barberia == id_barberia,
    ).first()
    if usuario_barbero and usuario_barbero.email:
        from app.core.email import enviar_email
        enviar_email(
            destinatario=usuario_barbero.email,
            asunto="Tenés un turno nuevo asignado",
            cuerpo_html=f"""
                <p>Hola {barbero.nombre},</p>
                <p>Te asignaron un turno para el <strong>{nuevo.fecha}</strong> a las <strong>{nuevo.hora_inicio.strftime('%H:%M')}</strong>.</p>
                <p>Revisá los detalles en tu panel: <a href="https://barberproapp.online/login">Ingresar</a></p>
            """,
        )

    return nuevo


@router.put("/{id_producto}", response_model=ProductoRespuesta)
def actualizar_producto(
    id_producto: int,
    datos: ProductoActualizar,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
    _: Usuario = Depends(requiere_plan("permite_inventario")),
):
    """Actualiza un producto. Solo administradores."""
    prod = (
        db.query(Producto)
        .filter(
            Producto.id_producto == id_producto,
            Producto.id_barberia == usuario_actual.id_barberia,
        )
        .first()
    )
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
    _: Usuario = Depends(requiere_plan("permite_inventario")),
):
    """Desactiva un producto. Solo administradores."""
    prod = (
        db.query(Producto)
        .filter(
            Producto.id_producto == id_producto,
            Producto.id_barberia == usuario_actual.id_barberia,
        )
        .first()
    )
    if prod is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    prod.activo = False
    db.commit()
    return {"mensaje": f"Producto {id_producto} desactivado"}