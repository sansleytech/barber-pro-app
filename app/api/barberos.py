"""Endpoints (rutas) del recurso Barbero."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.barbero import Barbero
from app.schemas.barbero import BarberoCrear, BarberoRespuesta

router = APIRouter(prefix="/barberos", tags=["Barberos"])


@router.get("", response_model=list[BarberoRespuesta])
def listar_barberos(db: Session = Depends(get_db)):
    """Devuelve todos los barberos activos."""
    return db.query(Barbero).filter(Barbero.activo == True).all()


@router.post("", response_model=BarberoRespuesta, status_code=201)
def crear_barbero(barbero: BarberoCrear, db: Session = Depends(get_db)):
    """Crea un nuevo barbero."""
    nuevo = Barbero(**barbero.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo
