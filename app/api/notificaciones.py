"""Endpoints de Notificaciones — multi-tenant."""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.models.notificacion import Notificacion
from app.models.usuario import Usuario, RolEnum
from app.models.cliente import Cliente
from app.models.barberia import Barberia
from app.models.plan import Suscripcion
from app.schemas.notificacion import NotificacionCrear, NotificacionRespuesta
from app.core.dependencies import get_usuario_actual, requiere_rol, requiere_plan

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


def _notificaciones_virtuales(db: Session, id_barberia: int) -> list[dict]:
    """Notificaciones calculadas 'al vuelo' (no se guardan en la base):
    cumpleaños próximos y vencimiento del plan."""
    virtuales = []
    hoy = date.today()

    clientes = db.query(Cliente).filter(
        Cliente.id_barberia == id_barberia,
        Cliente.activo == True,
    ).all()
    for c in clientes:
        if not c.fecha_nacimiento:
            continue
        prox = c.fecha_nacimiento.replace(year=hoy.year)
        if prox < hoy:
            prox = prox.replace(year=hoy.year + 1)
        dias = (prox - hoy).days
        if 0 <= dias <= 7:
            texto = "hoy" if dias == 0 else f"en {dias} día{'s' if dias != 1 else ''}"
            virtuales.append({
                "id_notificacion": f"cumple-{c.id_cliente}",
                "titulo": "Cumpleaños próximo",
                "mensaje": f"{c.primer_nombre} {c.apellidos} cumple años {texto}.",
                "tipo": "info",
                "enlace": "/clientes",
                "leida": False,
                "fecha_creacion": None,
            })

    barberia = db.query(Barberia).filter(Barberia.id_barberia == id_barberia).first()
    suscripcion = (
        db.query(Suscripcion)
        .filter(Suscripcion.id_barberia == id_barberia)
        .order_by(Suscripcion.fecha_creacion.desc())
        .first()
    )
    fecha_limite = (
        (suscripcion.fecha_fin if suscripcion and suscripcion.fecha_fin else None)
        or (barberia.trial_hasta if barberia else None)
    )
    if fecha_limite:
        dias = (fecha_limite - hoy).days
        if dias <= 7:
            texto = "hoy" if dias <= 0 else f"en {dias} día{'s' if dias != 1 else ''}"
            virtuales.append({
                "id_notificacion": "plan-vencimiento",
                "titulo": "Tu plan está por vencer",
                "mensaje": f"Vence {texto}. Renová para no perder el acceso.",
                "tipo": "alerta",
                "enlace": "/planes",
                "leida": False,
                "fecha_creacion": None,
            })

    return virtuales


@router.get("/mias")
def mis_notificaciones(db: Session = Depends(get_db),
        usuario: Usuario = Depends(get_usuario_actual)):
    guardadas = db.query(Notificacion).filter(
        Notificacion.id_barberia == usuario.id_barberia,
        or_(
            Notificacion.id_usuario == usuario.id_usuario,
            Notificacion.id_usuario.is_(None),
        ),
    ).order_by(Notificacion.fecha_creacion.desc()).limit(30).all()

    guardadas_json = [NotificacionRespuesta.model_validate(n).model_dump(mode="json") for n in guardadas]
    virtuales = _notificaciones_virtuales(db, usuario.id_barberia) if usuario.rol.value == "administrador" else []

    return virtuales + guardadas_json


@router.get("/contador")
def contador_no_leidas(db: Session = Depends(get_db),
        usuario: Usuario = Depends(get_usuario_actual)):
    cantidad = db.query(Notificacion).filter(
        Notificacion.id_barberia == usuario.id_barberia,
        Notificacion.leida == False,
        or_(
            Notificacion.id_usuario == usuario.id_usuario,
            Notificacion.id_usuario.is_(None),
        ),
    ).count()
    virtuales = _notificaciones_virtuales(db, usuario.id_barberia) if usuario.rol.value == "administrador" else []
    return {"cantidad": cantidad + len(virtuales)}


@router.post("", response_model=NotificacionRespuesta, status_code=201)
def crear(datos: NotificacionCrear, db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
    _: Usuario = Depends(requiere_plan("permite_whatsapp"))):
    notif = Notificacion(**datos.model_dump(), id_barberia=usuario.id_barberia)
    db.add(notif); db.commit(); db.refresh(notif)
    return notif


@router.patch("/{id_notificacion}/leida", response_model=NotificacionRespuesta)
def marcar_leida(id_notificacion: int, db: Session = Depends(get_db),
        usuario: Usuario = Depends(get_usuario_actual)):
    notif = db.query(Notificacion).filter(
        Notificacion.id_notificacion == id_notificacion,
        Notificacion.id_barberia == usuario.id_barberia,
    ).first()
    if notif is None:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    notif.leida = True
    db.commit(); db.refresh(notif)
    return notif


@router.patch("/marcar-todas-leidas")
def marcar_todas_leidas(db: Session = Depends(get_db),
        usuario: Usuario = Depends(get_usuario_actual)):
    db.query(Notificacion).filter(
        Notificacion.id_barberia == usuario.id_barberia,
        Notificacion.leida == False,
        or_(
            Notificacion.id_usuario == usuario.id_usuario,
            Notificacion.id_usuario.is_(None),
        ),
    ).update({"leida": True})
    db.commit()
    return {"mensaje": "Todas marcadas como leídas"}