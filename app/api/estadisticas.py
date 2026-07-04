"""Endpoints de estadísticas y analítica — multi-tenant."""

from datetime import date, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.db.session import get_db
from app.models.turno import Turno, TurnoServicio, EstadoTurnoEnum
from app.models.venta import VentaProducto
from app.models.cliente import Cliente
from app.models.barbero import Barbero
from app.models.servicio import Servicio
from app.models.valoracion import Valoracion
from app.models.usuario import Usuario, RolEnum
from app.core.dependencies import requiere_rol

router = APIRouter(prefix="/estadisticas", tags=["Estadísticas"])

_ROL = (RolEnum.administrador, RolEnum.recepcionista)


def _rango_default(desde: date | None, hasta: date | None):
    """Si no mandan fechas, usa los últimos 30 días."""
    if hasta is None:
        hasta = date.today()
    if desde is None:
        desde = hasta - timedelta(days=29)
    return desde, hasta


def _calcular_resumen(db: Session, bid: int, desde: date, hasta: date):
    """Calcula los KPIs de un rango de fechas para una barbería."""
    ingresos_turnos = db.query(func.coalesce(func.sum(Turno.precio_total), 0)).filter(
        Turno.id_barberia == bid,
        Turno.estado == EstadoTurnoEnum.completado,
        Turno.fecha >= desde,
        Turno.fecha <= hasta,
    ).scalar() or Decimal(0)

    ingresos_ventas = db.query(func.coalesce(func.sum(VentaProducto.total), 0)).filter(
        VentaProducto.id_barberia == bid,
        func.date(VentaProducto.fecha_venta) >= desde,
        func.date(VentaProducto.fecha_venta) <= hasta,
    ).scalar() or Decimal(0)

    ingresos_totales = Decimal(ingresos_turnos) + Decimal(ingresos_ventas)

    total_turnos = db.query(func.count(Turno.id_turno)).filter(
        Turno.id_barberia == bid,
        Turno.fecha >= desde,
        Turno.fecha <= hasta,
    ).scalar() or 0

    turnos_completados = db.query(func.count(Turno.id_turno)).filter(
        Turno.id_barberia == bid,
        Turno.estado == EstadoTurnoEnum.completado,
        Turno.fecha >= desde,
        Turno.fecha <= hasta,
    ).scalar() or 0

    turnos_cancelados = db.query(func.count(Turno.id_turno)).filter(
        Turno.id_barberia == bid,
        Turno.estado == EstadoTurnoEnum.cancelado,
        Turno.fecha >= desde,
        Turno.fecha <= hasta,
    ).scalar() or 0

    ticket_promedio = (
        Decimal(ingresos_turnos) / turnos_completados if turnos_completados > 0 else Decimal(0)
    )

    tasa_cancelacion = (
        round(turnos_cancelados / total_turnos * 100, 1) if total_turnos > 0 else 0
    )

    return {
        "ingresos_totales": float(ingresos_totales),
        "ingresos_turnos": float(ingresos_turnos),
        "ingresos_ventas": float(ingresos_ventas),
        "total_turnos": total_turnos,
        "turnos_completados": turnos_completados,
        "turnos_cancelados": turnos_cancelados,
        "ticket_promedio": float(ticket_promedio),
        "tasa_cancelacion": tasa_cancelacion,
    }


@router.get("/resumen")
def resumen(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    comparar: bool = Query(True, description="Comparar con el período anterior"),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(*_ROL)),
):
    """KPIs del período + comparación con el período anterior."""
    bid = usuario.id_barberia
    desde, hasta = _rango_default(desde, hasta)

    actual = _calcular_resumen(db, bid, desde, hasta)
    resultado = {"desde": desde, "hasta": hasta, "actual": actual}

    if comparar:
        dias = (hasta - desde).days + 1
        hasta_prev = desde - timedelta(days=1)
        desde_prev = hasta_prev - timedelta(days=dias - 1)
        anterior = _calcular_resumen(db, bid, desde_prev, hasta_prev)

        def variacion(act, ant):
            if ant == 0:
                return 100.0 if act > 0 else 0.0
            return round((act - ant) / ant * 100, 1)

        resultado["anterior"] = anterior
        resultado["variacion"] = {
            "ingresos_totales": variacion(actual["ingresos_totales"], anterior["ingresos_totales"]),
            "total_turnos": variacion(actual["total_turnos"], anterior["total_turnos"]),
            "ticket_promedio": variacion(actual["ticket_promedio"], anterior["ticket_promedio"]),
            "tasa_cancelacion": variacion(actual["tasa_cancelacion"], anterior["tasa_cancelacion"]),
        }

    return resultado


@router.get("/ingresos-mensuales")
def ingresos_mensuales(
    meses: int = Query(6, ge=1, le=24, description="Cuántos meses hacia atrás"),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(*_ROL)),
):
    """Ingresos por mes (turnos completados + ventas) de los últimos N meses."""
    bid = usuario.id_barberia
    hoy = date.today()

    año = hoy.year
    mes = hoy.month - (meses - 1)
    while mes <= 0:
        mes += 12
        año -= 1
    desde = date(año, mes, 1)

    turnos_mes = db.query(
        extract("year", Turno.fecha).label("anio"),
        extract("month", Turno.fecha).label("mes"),
        func.coalesce(func.sum(Turno.precio_total), 0).label("total"),
    ).filter(
        Turno.id_barberia == bid,
        Turno.estado == EstadoTurnoEnum.completado,
        Turno.fecha >= desde,
    ).group_by("anio", "mes").all()

    ventas_mes = db.query(
        extract("year", VentaProducto.fecha_venta).label("anio"),
        extract("month", VentaProducto.fecha_venta).label("mes"),
        func.coalesce(func.sum(VentaProducto.total), 0).label("total"),
    ).filter(
        VentaProducto.id_barberia == bid,
        func.date(VentaProducto.fecha_venta) >= desde,
    ).group_by("anio", "mes").all()

    acumulado = {}
    for r in turnos_mes:
        acumulado[(int(r.anio), int(r.mes))] = float(r.total)
    for r in ventas_mes:
        clave = (int(r.anio), int(r.mes))
        acumulado[clave] = acumulado.get(clave, 0) + float(r.total)

    nombres_mes = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                   "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    resultado = []
    a, m = desde.year, desde.month
    for _ in range(meses):
        total = acumulado.get((a, m), 0)
        resultado.append({
            "anio": a,
            "mes": m,
            "etiqueta": f"{nombres_mes[m - 1]} {a}",
            "total": total,
        })
        m += 1
        if m > 12:
            m = 1
            a += 1

    return resultado


@router.get("/barberos")
def ranking_barberos(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(*_ROL)),
):
    """Ranking de barberos por ingresos, con turnos, propinas, clientes y rating."""
    bid = usuario.id_barberia
    desde, hasta = _rango_default(desde, hasta)

    filas = db.query(
        Turno.id_barbero.label("id_barbero"),
        func.coalesce(func.sum(Turno.precio_total), 0).label("ingresos"),
        func.count(Turno.id_turno).label("turnos"),
        func.coalesce(func.sum(Turno.propina), 0).label("propinas"),
        func.count(func.distinct(Turno.id_cliente)).label("clientes"),
    ).filter(
        Turno.id_barberia == bid,
        Turno.estado == EstadoTurnoEnum.completado,
        Turno.fecha >= desde,
        Turno.fecha <= hasta,
    ).group_by(Turno.id_barbero).all()

    ratings = db.query(
        Valoracion.id_barbero.label("id_barbero"),
        func.avg(Valoracion.estrellas).label("rating"),
        func.count(Valoracion.id_valoracion).label("cant_valoraciones"),
    ).filter(
        Valoracion.id_barberia == bid,
    ).group_by(Valoracion.id_barbero).all()

    rating_por_barbero = {
        r.id_barbero: {"rating": round(float(r.rating), 2), "cant": r.cant_valoraciones}
        for r in ratings
    }

    barberos = db.query(Barbero).filter(Barbero.id_barberia == bid).all()
    nombre_por_id = {b.id_barbero: f"{b.nombre} {b.apellido}" for b in barberos}

    resultado = []
    for f in filas:
        info_rating = rating_por_barbero.get(f.id_barbero, {"rating": None, "cant": 0})
        turnos = f.turnos or 0
        ingresos = float(f.ingresos)
        resultado.append({
            "id_barbero": f.id_barbero,
            "nombre": nombre_por_id.get(f.id_barbero, "Barbero"),
            "ingresos": ingresos,
            "turnos": turnos,
            "propinas": float(f.propinas),
            "clientes_unicos": f.clientes or 0,
            "ticket_promedio": round(ingresos / turnos, 2) if turnos > 0 else 0,
            "rating": info_rating["rating"],
            "cant_valoraciones": info_rating["cant"],
        })

    resultado.sort(key=lambda x: x["ingresos"], reverse=True)
    return resultado


@router.get("/servicios-top")
def servicios_top(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    limite: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(*_ROL)),
):
    """Servicios más vendidos en el período (cantidad e ingresos)."""
    bid = usuario.id_barberia
    desde, hasta = _rango_default(desde, hasta)

    filas = db.query(
        TurnoServicio.id_servicio.label("id_servicio"),
        func.count(TurnoServicio.id).label("cantidad"),
        func.coalesce(func.sum(TurnoServicio.precio_aplicado), 0).label("ingresos"),
    ).join(
        Turno, Turno.id_turno == TurnoServicio.id_turno
    ).filter(
        Turno.id_barberia == bid,
        Turno.estado == EstadoTurnoEnum.completado,
        Turno.fecha >= desde,
        Turno.fecha <= hasta,
    ).group_by(TurnoServicio.id_servicio).all()

    servicios = db.query(Servicio).filter(Servicio.id_barberia == bid).all()
    nombre_por_id = {s.id_servicio: s.nombre for s in servicios}

    resultado = [
        {
            "id_servicio": f.id_servicio,
            "nombre": nombre_por_id.get(f.id_servicio, "Servicio"),
            "cantidad": f.cantidad,
            "ingresos": float(f.ingresos),
        }
        for f in filas
    ]
    resultado.sort(key=lambda x: x["cantidad"], reverse=True)
    return resultado[:limite]


@router.get("/turnos-estado")
def turnos_por_estado(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(*_ROL)),
):
    """Cantidad de turnos en cada estado durante el período."""
    bid = usuario.id_barberia
    desde, hasta = _rango_default(desde, hasta)

    filas = db.query(
        Turno.estado.label("estado"),
        func.count(Turno.id_turno).label("cantidad"),
    ).filter(
        Turno.id_barberia == bid,
        Turno.fecha >= desde,
        Turno.fecha <= hasta,
    ).group_by(Turno.estado).all()

    conteo = {f.estado.value: f.cantidad for f in filas}
    resultado = [
        {"estado": estado.value, "cantidad": conteo.get(estado.value, 0)}
        for estado in EstadoTurnoEnum
    ]
    return resultado


@router.get("/genero")
def distribucion_genero(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(*_ROL)),
):
    """Distribución de clientes por género."""
    bid = usuario.id_barberia

    filas = db.query(
        Cliente.genero.label("genero"),
        func.count(Cliente.id_cliente).label("cantidad"),
    ).filter(
        Cliente.id_barberia == bid,
        Cliente.activo == True,
    ).group_by(Cliente.genero).all()

    total = sum(f.cantidad for f in filas)

    def nombre_genero(g):
        if g is None:
            return "sin_especificar"
        return g.value if hasattr(g, "value") else str(g)

    resultado = {
        "total": total,
        "detalle": [
            {
                "genero": nombre_genero(f.genero),
                "cantidad": f.cantidad,
                "porcentaje": round(f.cantidad / total * 100, 1) if total > 0 else 0,
            }
            for f in filas
        ],
    }
    return resultado

@router.get("/horas-pico")
def horas_pico(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(*_ROL)),
):
    """Cantidad de turnos agrupados por hora del día en el período."""
    bid = usuario.id_barberia
    desde, hasta = _rango_default(desde, hasta)

    filas = db.query(
        extract("hour", Turno.hora_inicio).label("hora"),
        func.count(Turno.id_turno).label("cantidad"),
    ).filter(
        Turno.id_barberia == bid,
        Turno.fecha >= desde,
        Turno.fecha <= hasta,
    ).group_by("hora").all()

    # Armar un diccionario hora -> cantidad
    por_hora = {int(f.hora): int(f.cantidad) for f in filas}

    # Rellenar de 6am a 10pm (rango típico de una barbería)
    resultado = []
    for h in range(6, 23):
        resultado.append({
            "hora": h,
            "etiqueta": f"{h}:00",
            "cantidad": por_hora.get(h, 0),
        })
    return resultado


@router.get("/clientes-frecuentes")
def clientes_frecuentes(
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    limite: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(*_ROL)),
):
    """Top de clientes por cantidad de visitas (turnos) en el período."""
    bid = usuario.id_barberia
    desde, hasta = _rango_default(desde, hasta)

    filas = db.query(
        Turno.id_cliente.label("id_cliente"),
        func.count(Turno.id_turno).label("visitas"),
        func.coalesce(func.sum(Turno.precio_total), 0).label("total_gastado"),
    ).filter(
        Turno.id_barberia == bid,
        Turno.fecha >= desde,
        Turno.fecha <= hasta,
    ).group_by(Turno.id_cliente).all()

    clientes = db.query(Cliente).filter(Cliente.id_barberia == bid).all()
    info = {c.id_cliente: f"{c.primer_nombre} {c.apellidos}" for c in clientes}

    resultado = [
        {
            "id_cliente": f.id_cliente,
            "nombre": info.get(f.id_cliente, "Cliente"),
            "visitas": int(f.visitas),
            "total_gastado": float(f.total_gastado),
        }
        for f in filas
    ]
    resultado.sort(key=lambda x: x["visitas"], reverse=True)
    return resultado[:limite]


def _metricas_barbero(db, bid, id_barbero, desde, hasta):
    """Calcula las métricas de un barbero en un rango."""
    f = db.query(
        func.coalesce(func.sum(Turno.precio_total), 0).label("ingresos"),
        func.count(Turno.id_turno).label("turnos"),
        func.coalesce(func.sum(Turno.propina), 0).label("propinas"),
        func.count(func.distinct(Turno.id_cliente)).label("clientes"),
    ).filter(
        Turno.id_barberia == bid,
        Turno.id_barbero == id_barbero,
        Turno.estado == EstadoTurnoEnum.completado,
        Turno.fecha >= desde,
        Turno.fecha <= hasta,
    ).first()
    turnos = f.turnos or 0
    ingresos = float(f.ingresos)
    return {
        "ingresos": ingresos,
        "turnos": turnos,
        "propinas": float(f.propinas),
        "clientes_unicos": f.clientes or 0,
        "ticket_promedio": round(ingresos / turnos, 2) if turnos > 0 else 0,
    }


@router.get("/rendimiento-barbero/{id_barbero}")
def rendimiento_barbero(
    id_barbero: int,
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(*_ROL)),
):
    """Métricas detalladas de un barbero con comparativo del período anterior."""
    bid = usuario.id_barberia
    desde, hasta = _rango_default(desde, hasta)

    barbero = db.query(Barbero).filter(
        Barbero.id_barbero == id_barbero, Barbero.id_barberia == bid
    ).first()
    if barbero is None:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")

    actual = _metricas_barbero(db, bid, id_barbero, desde, hasta)

    dias = (hasta - desde).days + 1
    hasta_prev = desde - timedelta(days=1)
    desde_prev = hasta_prev - timedelta(days=dias - 1)
    anterior = _metricas_barbero(db, bid, id_barbero, desde_prev, hasta_prev)

    def variacion(act, ant):
        if ant == 0:
            return 100.0 if act > 0 else 0.0
        return round((act - ant) / ant * 100, 1)

    rating = db.query(
        func.avg(Valoracion.estrellas).label("rating"),
        func.count(Valoracion.id_valoracion).label("cant"),
    ).filter(
        Valoracion.id_barberia == bid,
        Valoracion.id_barbero == id_barbero,
    ).first()

    return {
        "id_barbero": id_barbero,
        "nombre": f"{barbero.nombre} {barbero.apellido}",
        "actual": actual,
        "anterior": anterior,
        "variacion": {
            "ingresos": variacion(actual["ingresos"], anterior["ingresos"]),
            "turnos": variacion(actual["turnos"], anterior["turnos"]),
            "propinas": variacion(actual["propinas"], anterior["propinas"]),
            "clientes_unicos": variacion(actual["clientes_unicos"], anterior["clientes_unicos"]),
            "ticket_promedio": variacion(actual["ticket_promedio"], anterior["ticket_promedio"]),
        },
        "rating": round(float(rating.rating), 2) if rating.rating else None,
        "cant_valoraciones": rating.cant or 0,
    }

