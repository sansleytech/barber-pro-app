"""Endpoints internos de solicitudes de turno (bandeja del admin) — multi-tenant."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.models.solicitud_turno import SolicitudTurno, EstadoSolicitudEnum
from app.models.usuario import Usuario, RolEnum
from app.schemas.solicitud_turno import SolicitudRespuesta, SolicitudActualizarEstado
from app.core.dependencies import get_barberia_actual, requiere_rol

router = APIRouter(prefix="/solicitudes", tags=["Solicitudes de turno"])


@router.get("", response_model=list[SolicitudRespuesta])
def listar(
    estado: Optional[EstadoSolicitudEnum] = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(
        requiere_rol(RolEnum.administrador, RolEnum.recepcionista)
    ),
):
    """Lista las solicitudes de la barbería. Filtro opcional por estado."""
    query = db.query(SolicitudTurno).filter(
        SolicitudTurno.id_barberia == usuario.id_barberia
    )
    if estado is not None:
        query = query.filter(SolicitudTurno.estado == estado)
    return query.order_by(SolicitudTurno.fecha_creacion.desc()).all()


@router.get("/{id_solicitud}", response_model=SolicitudRespuesta)
def obtener(
    id_solicitud: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(
        requiere_rol(RolEnum.administrador, RolEnum.recepcionista)
    ),
):
    """Devuelve una solicitud puntual."""
    solicitud = (
        db.query(SolicitudTurno)
        .filter(
            SolicitudTurno.id_solicitud == id_solicitud,
            SolicitudTurno.id_barberia == usuario.id_barberia,
        )
        .first()
    )
    if solicitud is None:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    return solicitud


@router.patch("/{id_solicitud}/estado", response_model=SolicitudRespuesta)
def actualizar_estado(
    id_solicitud: int,
    datos: SolicitudActualizarEstado,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(
        requiere_rol(RolEnum.administrador, RolEnum.recepcionista)
    ),
):
    """Marca una solicitud como atendida o descartada."""
    solicitud = (
        db.query(SolicitudTurno)
        .filter(
            SolicitudTurno.id_solicitud == id_solicitud,
            SolicitudTurno.id_barberia == usuario.id_barberia,
        )
        .first()
    )
    if solicitud is None:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    solicitud.estado = datos.estado
    db.commit()
    db.refresh(solicitud)
    return solicitud
