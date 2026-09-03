"""Endpoints de Caja Diaria: bruto, neto, cierre, historial."""

"""Endpoints de Caja Diaria: bruto, neto, cierre, historial."""

from datetime import date as date_type
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.turno import Turno, TurnoServicio, EstadoTurnoEnum
from app.models.cliente import Cliente
from app.models.barbero import Barbero
from app.models.servicio import Servicio
from app.models.venta import VentaProducto
from app.models.caja import CajaDescuento, Gasto, CierreCaja
from app.core.dependencies import verificar_barberia_activa, get_barberia_actual
from app.schemas.caja import (CajaDiaRespuesta, DescuentoActualizar, MetodoPagoActualizar, CerrarCajaDatos, HistorialCierre)

router = APIRouter(prefix="/caja", tags=["Caja Diaria"])


def _nombre_cliente(c: Cliente) -> str:
    partes = [c.primer_nombre, c.segundo_nombre, c.apellidos]
    return " ".join(p for p in partes if p)


def _nombre_barbero(b: Barbero) -> str:
    return f"{b.nombre} {b.apellido}"


@router.get("/dia", response_model=CajaDiaRespuesta)
def caja_del_dia(
    fecha: date_type,
    id_barbero: int | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(verificar_barberia_activa),
    id_barberia: int = Depends(get_barberia_actual),
):
    q = db.query(Turno).filter(
        Turno.fecha == fecha,
        Turno.id_barberia == id_barberia,
        Turno.estado == EstadoTurnoEnum.completado,
    )
    if id_barbero:
        q = q.filter(Turno.id_barbero == id_barbero)
    turnos = q.all()

    total_bruto = sum(float(t.precio_total) for t in turnos)
    total_propinas = sum(float(t.propina or 0) for t in turnos)
    total_turnos = len(turnos)

    # Ventas de productos del día (para el total combinado)
    total_ventas_prod = (
        db.query(func.coalesce(func.sum(VentaProducto.total), 0))
        .filter(
            func.date(VentaProducto.fecha_venta) == fecha,
            VentaProducto.id_barberia == id_barberia,
        )
        .scalar()
    )

    # Por método de pago
    metodos = {}
    for t in turnos:
        m = t.metodo_pago or "Sin asignar"
        if m not in metodos:
            metodos[m] = {"cantidad": 0, "total": 0.0}
        metodos[m]["cantidad"] += 1
        metodos[m]["total"] += float(t.precio_total)
    por_metodo = [{"metodo": k, **v} for k, v in metodos.items()]

    # Por barbero
    barberos_map = {}
    for t in turnos:
        b = db.query(Barbero).filter(Barbero.id_barbero == t.id_barbero).first()
        nombre = _nombre_barbero(b) if b else "—"
        if nombre not in barberos_map:
            barberos_map[nombre] = {"cantidad": 0, "total": 0.0}
        barberos_map[nombre]["cantidad"] += 1
        barberos_map[nombre]["total"] += float(t.precio_total)
    por_barbero = [{"barbero": k, **v} for k, v in barberos_map.items()]

    # Detalle
    detalle = []
    for t in turnos:
        cliente = db.query(Cliente).filter(Cliente.id_cliente == t.id_cliente).first()
        barbero = db.query(Barbero).filter(Barbero.id_barbero == t.id_barbero).first()
        servicios_turno = (
            db.query(Servicio.nombre)
            .join(TurnoServicio, TurnoServicio.id_servicio == Servicio.id_servicio)
            .filter(TurnoServicio.id_turno == t.id_turno)
            .all()
        )
        nombres_servicios = ", ".join(s[0] for s in servicios_turno) or "—"

        detalle.append({
            "id_turno": t.id_turno,
            "hora_inicio": t.hora_inicio.strftime("%H:%M"),
            "cliente": _nombre_cliente(cliente) if cliente else "—",
            "barbero": _nombre_barbero(barbero) if barbero else "—",
            "servicio": nombres_servicios,
            "metodo_pago": t.metodo_pago,
            "precio": float(t.precio_total),
        })
    detalle.sort(key=lambda d: d["hora_inicio"])

    # Descuento del día
    desc = (
        db.query(CajaDescuento)
        .filter(CajaDescuento.fecha == fecha, CajaDescuento.id_barberia == id_barberia)
        .first()
    )
    monto_descuento = float(desc.monto) if desc else 0.0

    # ¿Ya está cerrada?
    cierre = (
        db.query(CierreCaja)
        .filter(CierreCaja.fecha == fecha, CierreCaja.id_barberia == id_barberia)
        .first()
    )
    cierre_info = None
    if cierre:
        user_cierre = db.query(Usuario).filter(Usuario.id_usuario == cierre.id_usuario).first()
        cierre_info = {
            "nombre_usuario": user_cierre.nombre_usuario if user_cierre else "—",
            "total_ingresos": float(cierre.balance_final or 0),
            "observaciones": cierre.observaciones,
            "fecha_cierre": cierre.fecha_cierre,
        }

    return {
        "resumen": {
            "total_bruto": total_bruto,
            "total_propinas": total_propinas,
            "total_productos": float(total_ventas_prod or 0),
            "total_turnos": total_turnos,
        },
        "descuento": {"monto": monto_descuento},
        "porMetodo": por_metodo,
        "porBarbero": por_barbero,
        "detalle": detalle,
        "cerrada": cierre is not None,
        "cierre": cierre_info,
    }


@router.patch("/metodo-pago")
def actualizar_metodo_pago(
    datos: MetodoPagoActualizar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(verificar_barberia_activa),
    id_barberia: int = Depends(get_barberia_actual),
):
    turno = (
        db.query(Turno)
        .filter(Turno.id_turno == datos.id_turno, Turno.id_barberia == id_barberia)
        .first()
    )
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    turno.metodo_pago = datos.metodo_pago
    db.commit()
    return {"mensaje": "Método de pago actualizado"}


@router.put("/descuento")
def actualizar_descuento(
    datos: DescuentoActualizar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(verificar_barberia_activa),
    id_barberia: int = Depends(get_barberia_actual),
):
    desc = (
        db.query(CajaDescuento)
        .filter(CajaDescuento.fecha == datos.fecha, CajaDescuento.id_barberia == id_barberia)
        .first()
    )
    if desc:
        desc.monto = datos.monto
    else:
        desc = CajaDescuento(id_barberia=id_barberia, fecha=datos.fecha, monto=datos.monto)
        db.add(desc)
    db.commit()
    return {"mensaje": "Descuento actualizado"}


@router.post("/cerrar", status_code=201)
def cerrar_caja(
    datos: CerrarCajaDatos,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(verificar_barberia_activa),
    id_barberia: int = Depends(get_barberia_actual),
):
    existente = (
        db.query(CierreCaja)
        .filter(CierreCaja.fecha == datos.fecha, CierreCaja.id_barberia == id_barberia)
        .first()
    )
    if existente:
        raise HTTPException(status_code=409, detail="La caja de ese día ya está cerrada")

    turnos = (
        db.query(Turno)
        .filter(
            Turno.fecha == datos.fecha,
            Turno.id_barberia == id_barberia,
            Turno.estado == EstadoTurnoEnum.completado,
        )
        .all()
    )
    ingresos_turnos = sum(float(t.precio_total) for t in turnos)
    total_propinas = sum(float(t.propina or 0) for t in turnos)

    ingresos_ventas = (
        db.query(func.coalesce(func.sum(VentaProducto.total), 0))
        .filter(
            func.date(VentaProducto.fecha_venta) == datos.fecha,
            VentaProducto.id_barberia == id_barberia,
        )
        .scalar()
    )

    desc = (
        db.query(CajaDescuento)
        .filter(CajaDescuento.fecha == datos.fecha, CajaDescuento.id_barberia == id_barberia)
        .first()
    )
    total_descuentos = float(desc.monto) if desc else 0.0

    total_gastos = (
        db.query(func.coalesce(func.sum(Gasto.monto), 0))
        .filter(Gasto.fecha == datos.fecha, Gasto.id_barberia == id_barberia)
        .scalar()
    )

    balance_final = (
        ingresos_turnos + float(ingresos_ventas or 0) + total_propinas
        - total_descuentos - float(total_gastos or 0)
    )

    nuevo_cierre = CierreCaja(
        id_barberia=id_barberia,
        fecha=datos.fecha,
        id_usuario=datos.id_usuario,
        ingresos_turnos=ingresos_turnos,
        ingresos_ventas=ingresos_ventas,
        total_propinas=total_propinas,
        total_gastos=total_gastos,
        total_descuentos=total_descuentos,
        balance_final=balance_final,
        observaciones=datos.observaciones,
    )
    db.add(nuevo_cierre)
    db.commit()
    return {"mensaje": "Caja cerrada correctamente"}


@router.post("/reabrir")
def reabrir_caja(
    fecha: date_type,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(verificar_barberia_activa),
    id_barberia: int = Depends(get_barberia_actual),
):
    cierre = (
        db.query(CierreCaja)
        .filter(CierreCaja.fecha == fecha, CierreCaja.id_barberia == id_barberia)
        .first()
    )
    if not cierre:
        raise HTTPException(status_code=404, detail="No hay cierre para esa fecha")
    db.delete(cierre)
    db.commit()
    return {"mensaje": "Caja reabierta"}


@router.get("/historial", response_model=list[HistorialCierre])
def historial_cierres(
    desde: date_type | None = Query(None),
    hasta: date_type | None = Query(None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(verificar_barberia_activa),
    id_barberia: int = Depends(get_barberia_actual),
):
    consulta = db.query(CierreCaja).filter(CierreCaja.id_barberia == id_barberia)
    if desde:
        consulta = consulta.filter(CierreCaja.fecha >= desde)
    if hasta:
        consulta = consulta.filter(CierreCaja.fecha <= hasta)
    cierres = consulta.order_by(CierreCaja.fecha.desc()).all()
    resultado = []
    for c in cierres:
        user = db.query(Usuario).filter(Usuario.id_usuario == c.id_usuario).first()
        total_turnos = (
            db.query(func.count(Turno.id_turno))
            .filter(
                Turno.fecha == c.fecha,
                Turno.id_barberia == id_barberia,
                Turno.estado == EstadoTurnoEnum.completado,
            )
            .scalar()
        )
        resultado.append({
            "fecha": c.fecha,
            "total_turnos": total_turnos or 0,
            "nombre_usuario": user.nombre_usuario if user else "—",
            "total_ingresos": float(c.balance_final or 0),
            "total_propinas": float(c.total_propinas or 0),
        })
    return resultado