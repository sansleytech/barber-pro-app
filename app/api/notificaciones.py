"""Endpoints de notificaciones."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.notificacion import Notificacion
from app.models.usuario import Usuario, RolEnum
from app.schemas.notificacion import NotificacionCrear, NotificacionRespuesta
from app.core.dependencies import get_usuario_actual, requiere_rol

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


@router.get("/mias", response_model=list[NotificacionRespuesta])
def mis_notificaciones(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    """Notificaciones del usuario logueado (las suyas + las generales)."""
    return db.query(Notificacion).filter(
        or_(
            Notificacion.id_usuario == usuario_actual.id_usuario,
            Notificacion.id_usuario.is_(None),
        )
    ).order_by(Notificacion.fecha_creacion.desc()).all()


@router.post("", response_model=NotificacionRespuesta, status_code=201)
def crear_notificacion(
    datos: NotificacionCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Crea una notificación. Solo administradores."""
    notif = Notificacion(**datos.model_dump())
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.patch("/{id_notificacion}/leida", response_model=NotificacionRespuesta)
def marcar_leida(
    id_notificacion: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    """Marca una notificación como leída."""
    notif = db.query(Notificacion).filter(
        Notificacion.id_notificacion == id_notificacion
    ).first()
    if notif is None:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    notif.leida = True
    db.commit()
    db.refresh(notif)
    return notif
