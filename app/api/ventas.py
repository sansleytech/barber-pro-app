"""Endpoints de ventas de productos (POS) — multi-tenant."""

from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.venta import VentaProducto, VentaCarrito
from app.models.producto import Producto
from app.models.cliente import Cliente
from app.models.configuracion import Configuracion
from app.models.usuario import Usuario, RolEnum
from app.schemas.venta import VentaCrear, VentaRespuesta
from app.core.dependencies import requiere_rol

router = APIRouter(prefix="/ventas", tags=["Ventas"])


@router.get("", response_model=list[VentaRespuesta])
def listar_ventas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(
        requiere_rol(RolEnum.administrador, RolEnum.recepcionista)
    ),
):
    """Lista las ventas de la barbería. Admin y recepcionista."""
    return (
        db.query(VentaProducto)
        .filter(VentaProducto.id_barberia == usuario.id_barberia)
        .order_by(VentaProducto.fecha_venta.desc())
        .all()
    )


@router.get("/{id_venta}", response_model=VentaRespuesta)
def obtener_venta(
    id_venta: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(
        requiere_rol(RolEnum.administrador, RolEnum.recepcionista)
    ),
):
    venta = (
        db.query(VentaProducto)
        .filter(
            VentaProducto.id_venta == id_venta,
            VentaProducto.id_barberia == usuario.id_barberia,
        )
        .first()
    )
    if venta is None:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta


@router.post("", response_model=VentaRespuesta, status_code=201)
def crear_venta(
    datos: VentaCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(
        requiere_rol(RolEnum.administrador, RolEnum.recepcionista)
    ),
):
    """Registra una venta, valida y descuenta stock, calcula IVA. Multi-tenant."""
    bid = usuario.id_barberia

    if not datos.items:
        raise HTTPException(
            status_code=400, detail="La venta debe tener al menos un producto"
        )

    # Validar cliente EN ESTA BARBERÍA (si se indicó)
    if datos.id_cliente is not None:
        cliente = (
            db.query(Cliente)
            .filter(Cliente.id_cliente == datos.id_cliente, Cliente.id_barberia == bid)
            .first()
        )
        if cliente is None:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # 1. Validar productos y stock (todos de esta barbería)
    productos_venta = []
    for item in datos.items:
        if item.cantidad <= 0:
            raise HTTPException(
                status_code=400, detail="Las cantidades deben ser mayores a cero"
            )
        producto = (
            db.query(Producto)
            .filter(
                Producto.id_producto == item.id_producto, Producto.id_barberia == bid
            )
            .first()
        )
        if producto is None:
            raise HTTPException(
                status_code=404, detail=f"Producto {item.id_producto} no encontrado"
            )
        if (producto.stock_actual or 0) < item.cantidad:
            raise HTTPException(
                status_code=409,
                detail=f"Stock insuficiente de '{producto.nombre}' (hay {producto.stock_actual}, se piden {item.cantidad})",
            )
        productos_venta.append((producto, item.cantidad))

    # 2. Subtotal
    subtotal = Decimal(0)
    for producto, cantidad in productos_venta:
        subtotal += producto.precio_venta * cantidad

    # 3. IVA según config DE ESTA BARBERÍA
    cfg_aplica = (
        db.query(Configuracion)
        .filter(Configuracion.clave == "aplica_iva", Configuracion.id_barberia == bid)
        .first()
    )
    cfg_porc = (
        db.query(Configuracion)
        .filter(
            Configuracion.clave == "porcentaje_iva", Configuracion.id_barberia == bid
        )
        .first()
    )
    iva = Decimal(0)
    if cfg_aplica and cfg_aplica.valor == "1":
        porcentaje = (
            Decimal(cfg_porc.valor) if cfg_porc and cfg_porc.valor else Decimal(0)
        )
        iva = subtotal * porcentaje / Decimal(100)

    total = subtotal + iva

    # 4. Crear venta
    venta = VentaProducto(
        id_cliente=datos.id_cliente,
        id_usuario_vendedor=usuario.id_usuario,
        subtotal=subtotal,
        iva=iva,
        total=total,
        metodo_pago=datos.metodo_pago,
        observaciones=datos.observaciones,
        id_barberia=bid,
    )
    db.add(venta)
    db.flush()

    # 5. Items y descontar stock
    for producto, cantidad in productos_venta:
        sub = producto.precio_venta * cantidad
        db.add(
            VentaCarrito(
                id_venta=venta.id_venta,
                id_producto=producto.id_producto,
                cantidad=cantidad,
                precio_unitario=producto.precio_venta,
                subtotal=sub,
            )
        )
        producto.stock_actual = producto.stock_actual - cantidad

    db.commit()
    db.refresh(venta)
    return venta
