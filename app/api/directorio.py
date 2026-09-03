"""Endpoint público del directorio general: todas las barberías activas
que tengan ubicación cargada, para el buscador de la plataforma (no
pertenece a ninguna barbería en particular, es la vista general)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.barberia import Barberia, EstadoBarberiaEnum

router = APIRouter(prefix="/directorio", tags=["Directorio público"])


@router.get("/barberias")
def listar_barberias_publicas(db: Session = Depends(get_db)):
    """Lista todas las barberías activas con ubicación cargada, para el mapa general."""
    barberias = (
        db.query(Barberia)
        .filter(
            Barberia.activo == True,
            Barberia.estado.in_([EstadoBarberiaEnum.trial, EstadoBarberiaEnum.activa]),
            Barberia.latitud.isnot(None),
            Barberia.longitud.isnot(None),
        )
        .all()
    )
    return [
        {
            "subdominio": b.subdominio,
            "nombre": b.nombre,
            "direccion": b.direccion,
            "telefono": b.telefono,
            "latitud": b.latitud,
            "longitud": b.longitud,
            "logo": b.logo,
        }
        for b in barberias
    ]