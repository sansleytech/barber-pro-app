"""Endpoints de Notificaciones — multi-tenant."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.models.notificacion import Notificacion
from app.models.usuario import Usuario, RolEnum
from app.schemas.notificacion import NotificacionCrear, NotificacionRespuesta
from app.core.dependencies import get_usuario_actual, requiere_rol, requiere_plan

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


@router.get("/mias", response_model=list[NotificacionRespuesta])
def mis_notificaciones(db: Session = Depends(get_db),
        usuario: Usuario = Depends(get_usuario_actual)):
    return db.query(Notificacion).filter(
        Notificacion.id_barberia == usuario.id_barberia,
        or_(
            Notificacion.id_usuario == usuario.id_usuario,
            Notificacion.id_usuario.is_(None),
        ),
    ).order_by(Notificacion.fecha_creacion.desc()).all()


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