"""Panel de superadministrador: gestión global de todas las barberías."""

from datetime import date, datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from dateutil.relativedelta import relativedelta
from app.core.auditoria_helper import registrar_auditoria
from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.barberia import Barberia, EstadoBarberiaEnum
from app.models.plan import Plan, Suscripcion, EstadoSuscripcionEnum
from app.models.pago import Pago
from app.models.permiso_rol import PermisoRol
from app.core.security import verificar_password, crear_token, hashear_password
from app.core.dependencies import requiere_super_admin
from app.schemas.superadmin import (
    LoginSuperAdmin,
    BarberiaResumen,
    CambiarEstadoBarberia,
    MetricasGlobales,
    PagoResumen,
)
from app.schemas.plan import PlanCrear, PlanActualizar, PlanRespuesta
from app.schemas.permiso_rol import PermisoRolRespuesta, PermisoRolActualizar

router = APIRouter(prefix="/superadmin", tags=["Superadmin"])


@router.post("/login")
def login_superadmin(datos: LoginSuperAdmin, db: Session = Depends(get_db)):
    """Login exclusivo para superadmins. No pide subdominio, porque no
    pertenecen a ninguna barbería en particular."""
    usuario = db.query(Usuario).filter(
        Usuario.nombre_usuario == datos.username,
        Usuario.super_admin == True,
    ).first()

    if usuario is None or not verificar_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if not usuario.activo:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    usuario.ultimo_acceso = datetime.now(timezone.utc)
    usuario.cantidad_logins = (usuario.cantidad_logins or 0) + 1
    db.commit()

    token = crear_token({
        "sub": str(usuario.id_usuario),
        "rol": usuario.rol.value,
        "id_barberia": usuario.id_barberia,
        "subdominio": None,
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "id_usuario": usuario.id_usuario,
            "nombre_usuario": usuario.nombre_usuario,
            "rol": usuario.rol.value,
            "super_admin": True,
            "id_barberia": None,
            "barberia": None,
        },
    }


def _plan_actual_de(db: Session, id_barberia: int) -> str | None:
    sus = (
        db.query(Suscripcion)
        .filter(Suscripcion.id_barberia == id_barberia)
        .order_by(Suscripcion.fecha_creacion.desc())
        .first()
    )
    if sus is None or sus.plan is None:
        return None
    return sus.plan.nombre


@router.get("/barberias", response_model=list[BarberiaResumen])
def listar_barberias(
    db: Session = Depends(get_db),
    _: Usuario = Depends(requiere_super_admin),
):
    barberias = db.query(Barberia).order_by(Barberia.fecha_registro.desc()).all()
    resultado = []
    for b in barberias:
        item = BarberiaResumen.model_validate(b).model_dump()
        item["plan_actual"] = _plan_actual_de(db, b.id_barberia)
        resultado.append(item)
    return resultado


@router.patch("/barberias/{id_barberia}/estado", response_model=BarberiaResumen)
def cambiar_estado_barberia(
    id_barberia: int,
    datos: CambiarEstadoBarberia,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_super_admin),
):
    barberia = db.query(Barberia).filter(Barberia.id_barberia == id_barberia).first()
    if barberia is None:
        raise HTTPException(status_code=404, detail="Barbería no encontrada")

    estado_anterior = barberia.estado.value
    barberia.estado = datos.estado
    db.commit()
    db.refresh(barberia)

    registrar_auditoria(
        db, usuario.nombre_usuario, "cambiar_estado_barberia",
        f"Cambió '{barberia.nombre}' de '{estado_anterior}' a '{datos.estado.value}'",
        id_barberia_afectada=id_barberia,
    )

    resultado = BarberiaResumen.model_validate(barberia).model_dump()
    resultado["plan_actual"] = _plan_actual_de(db, id_barberia)
    return resultado


@router.delete("/barberias/{id_barberia}")
def eliminar_barberia(
    id_barberia: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_super_admin),
):
    """Elimina PERMANENTEMENTE una barbería y todos sus datos asociados
    (usuarios, clientes, turnos, etc., vía CASCADE). Es irreversible."""
    barberia = db.query(Barberia).filter(Barberia.id_barberia == id_barberia).first()
    if barberia is None:
        raise HTTPException(status_code=404, detail="Barbería no encontrada")

    nombre = barberia.nombre
    registrar_auditoria(
        db, usuario.nombre_usuario, "eliminar_barberia",
        f"Eliminó permanentemente la barbería '{nombre}' (id {id_barberia})",
        id_barberia_afectada=id_barberia,
    )
    db.delete(barberia)
    db.commit()
    return {"mensaje": f"Barbería '{nombre}' eliminada permanentemente"}


@router.get("/metricas", response_model=MetricasGlobales)
def metricas_globales(
    db: Session = Depends(get_db),
    _: Usuario = Depends(requiere_super_admin),
):
    total = db.query(func.count(Barberia.id_barberia)).scalar() or 0

    def contar(estado):
        return db.query(func.count(Barberia.id_barberia)).filter(
            Barberia.estado == estado
        ).scalar() or 0

    en_trial = contar(EstadoBarberiaEnum.trial)
    activas = contar(EstadoBarberiaEnum.activa)
    suspendidas = contar(EstadoBarberiaEnum.suspendida)
    canceladas = contar(EstadoBarberiaEnum.cancelada)

    subquery_ultima = (
        db.query(
            Suscripcion.id_barberia,
            func.max(Suscripcion.fecha_creacion).label("ultima_fecha"),
        )
        .group_by(Suscripcion.id_barberia)
        .subquery()
    )

    suscripciones_activas = (
        db.query(Suscripcion)
        .join(
            subquery_ultima,
            (Suscripcion.id_barberia == subquery_ultima.c.id_barberia)
            & (Suscripcion.fecha_creacion == subquery_ultima.c.ultima_fecha),
        )
        .filter(Suscripcion.estado == EstadoSuscripcionEnum.activa)
        .all()
    )
    mrr = sum(float(s.plan.precio_mensual) for s in suscripciones_activas if s.plan)

    return {
        "total_barberias": total,
        "en_trial": en_trial,
        "activas": activas,
        "suspendidas": suspendidas,
        "canceladas": canceladas,
        "mrr": mrr,
    }


@router.get("/barberias/{id_barberia}/pagos", response_model=list[PagoResumen])
def historial_pagos_barberia(
    id_barberia: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(requiere_super_admin),
):
    barberia = db.query(Barberia).filter(Barberia.id_barberia == id_barberia).first()
    if barberia is None:
        raise HTTPException(status_code=404, detail="Barbería no encontrada")

    return (
        db.query(Pago)
        .filter(Pago.id_barberia == id_barberia)
        .order_by(Pago.fecha_creacion.desc())
        .all()
    )


@router.get("/planes", response_model=list[PlanRespuesta])
def listar_todos_los_planes(
    db: Session = Depends(get_db),
    _: Usuario = Depends(requiere_super_admin),
):
    """A diferencia de /planes (público), acá se ven también los inactivos."""
    return db.query(Plan).order_by(Plan.orden).all()


@router.post("/planes", response_model=PlanRespuesta, status_code=201)
def crear_plan(
    datos: PlanCrear,
    db: Session = Depends(get_db),
    _: Usuario = Depends(requiere_super_admin),
):
    nuevo = Plan(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.patch("/planes/{id_plan}", response_model=PlanRespuesta)
def actualizar_plan(
    id_plan: int,
    datos: PlanActualizar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_super_admin),
):
    plan = db.query(Plan).filter(Plan.id_plan == id_plan).first()
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    cambios = datos.model_dump(exclude_unset=True)
    for campo, valor in cambios.items():
        setattr(plan, campo, valor)
    db.commit()
    db.refresh(plan)

    registrar_auditoria(
        db, usuario.nombre_usuario, "actualizar_plan",
        f"Editó el plan '{plan.nombre}': {cambios}",
    )
    return plan


@router.get("/series")
def series_historicas(
    meses: int = 6,
    db: Session = Depends(get_db),
    _: Usuario = Depends(requiere_super_admin),
):
    """Series mensuales aproximadas para las gráficas: barberías acumuladas
    y MRR estimado por mes, calculados a partir de los registros existentes
    (no se guarda un histórico aparte, se reconstruye cada vez)."""
    hoy = date.today()
    nombres_mes = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

    todas_barberias = db.query(Barberia).all()
    todas_suscripciones = (
        db.query(Suscripcion).filter(Suscripcion.estado.in_([EstadoSuscripcionEnum.activa])).all()
    )
    planes_por_id = {p.id_plan: p for p in db.query(Plan).all()}

    resultado = []
    inicio = date(hoy.year, hoy.month, 1) - relativedelta(months=meses - 1)

    for i in range(meses):
        mes_actual = inicio + relativedelta(months=i)
        fin_mes = mes_actual + relativedelta(months=1) - relativedelta(days=1)

        barberias_acumuladas = sum(
            1 for b in todas_barberias
            if b.fecha_registro and b.fecha_registro.date() <= fin_mes
        )

        mrr_mes = Decimal(0)
        for s in todas_suscripciones:
            empezo_antes = s.fecha_inicio <= fin_mes
            sigue_activa = s.fecha_fin is None or s.fecha_fin >= mes_actual
            if empezo_antes and sigue_activa:
                plan = planes_por_id.get(s.id_plan)
                if plan:
                    mrr_mes += plan.precio_mensual

        resultado.append({
            "etiqueta": f"{nombres_mes[mes_actual.month - 1]} {mes_actual.year}",
            "barberias_acumuladas": barberias_acumuladas,
            "mrr": float(mrr_mes),
        })

    return resultado


@router.get("/permisos", response_model=list[PermisoRolRespuesta])
def listar_permisos(
    db: Session = Depends(get_db),
    _: Usuario = Depends(requiere_super_admin),
):
    return db.query(PermisoRol).order_by(PermisoRol.ruta).all()


@router.patch("/permisos/{id_permiso}", response_model=PermisoRolRespuesta)
def actualizar_permiso(
    id_permiso: int,
    datos: PermisoRolActualizar,
    db: Session = Depends(get_db),
    _: Usuario = Depends(requiere_super_admin),
):
    permiso = db.query(PermisoRol).filter(PermisoRol.id_permiso == id_permiso).first()
    if permiso is None:
        raise HTTPException(status_code=404, detail="Permiso no encontrado")
    permiso.administrador = datos.administrador
    permiso.recepcionista = datos.recepcionista
    permiso.barbero = datos.barbero
    db.commit()
    db.refresh(permiso)
    return permiso


@router.get("/barberias/{id_barberia}/usuarios")
def listar_usuarios_barberia(
    id_barberia: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(requiere_super_admin),
):
    """Lista todos los usuarios de una barbería puntual (para gestión desde superadmin)."""
    barberia = db.query(Barberia).filter(Barberia.id_barberia == id_barberia).first()
    if barberia is None:
        raise HTTPException(status_code=404, detail="Barbería no encontrada")

    usuarios = db.query(Usuario).filter(Usuario.id_barberia == id_barberia).all()
    return [
        {
            "id_usuario": u.id_usuario,
            "nombre_usuario": u.nombre_usuario,
            "email": u.email,
            "rol": u.rol.value,
            "activo": u.activo,
            "super_admin": u.super_admin,
        }
        for u in usuarios
    ]


@router.delete("/usuarios/{id_usuario}")
def eliminar_usuario_superadmin(
    id_usuario: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_super_admin),
):
    """Elimina PERMANENTEMENTE un usuario. No se puede borrar a un super_admin
    desde acá, por seguridad."""
    objetivo = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if objetivo is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if objetivo.super_admin:
        raise HTTPException(status_code=403, detail="No se puede eliminar a un superadministrador desde acá")

    nombre = objetivo.nombre_usuario
    id_barberia_objetivo = objetivo.id_barberia
    registrar_auditoria(
        db, usuario.nombre_usuario, "eliminar_usuario",
        f"Eliminó permanentemente al usuario '{nombre}'",
        id_barberia_afectada=id_barberia_objetivo,
    )
    db.delete(objetivo)
    db.commit()
    return {"mensaje": f"Usuario '{nombre}' eliminado permanentemente"}


@router.get("/pagos")
def listar_todos_los_pagos(
    limite: int = 100,
    db: Session = Depends(get_db),
    _: Usuario = Depends(requiere_super_admin),
):
    """Lista los pagos más recientes de TODAS las barberías juntas."""
    pagos = (
        db.query(Pago)
        .order_by(Pago.fecha_creacion.desc())
        .limit(limite)
        .all()
    )
    resultado = []
    for p in pagos:
        barberia = db.query(Barberia).filter(Barberia.id_barberia == p.id_barberia).first()
        resultado.append({
            "id_pago": p.id_pago,
            "id_barberia": p.id_barberia,
            "nombre_barberia": barberia.nombre if barberia else "—",
            "monto": float(p.monto),
            "estado": p.estado.value,
            "metodo_pago": p.metodo_pago,
            "referencia": p.referencia,
            "fecha_creacion": p.fecha_creacion,
        })
    return resultado


@router.get("/auditoria")
def listar_auditoria(
    limite: int = 100,
    db: Session = Depends(get_db),
    _: Usuario = Depends(requiere_super_admin),
):
    """Devuelve las últimas acciones registradas en el historial."""
    from app.models.historial_auditoria import HistorialAuditoria
    registros = (
        db.query(HistorialAuditoria)
        .order_by(HistorialAuditoria.fecha.desc())
        .limit(limite)
        .all()
    )
    return [
        {
            "id_registro": r.id_registro,
            "nombre_usuario": r.nombre_usuario,
            "accion": r.accion,
            "detalle": r.detalle,
            "id_barberia_afectada": r.id_barberia_afectada,
            "fecha": r.fecha,
        }
        for r in registros
    ]