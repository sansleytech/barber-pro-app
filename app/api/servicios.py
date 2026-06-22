"""Endpoints (rutas) del recurso Servicio."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.servicio import Servicio
from app.schemas.servicio import ServicioCrear, ServicioRespuesta, ServicioActualizar

router = APIRouter(prefix="/servicios", tags=["Servicios"])


@router.get("", response_model=list[ServicioRespuesta])
def listar_servicios(db: Session = Depends(get_db)):
    """Devuelve todos los servicios activos."""
    return db.query(Servicio).filter(Servicio.activo == True).all()


@router.get("/{id_servicio}", response_model=ServicioRespuesta)
def obtener_servicio(id_servicio: int, db: Session = Depends(get_db)):
    """Devuelve un servicio por su id."""
    servicio = db.query(Servicio).filter(Servicio.id_servicio == id_servicio).first()
    if servicio is None:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return servicio


@router.post("", response_model=ServicioRespuesta, status_code=201)
def crear_servicio(servicio: ServicioCrear, db: Session = Depends(get_db)):
    """Crea un nuevo servicio."""
    nuevo = Servicio(**servicio.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_servicio}", response_model=ServicioRespuesta)
def actualizar_servicio(
    id_servicio: int,
    datos: ServicioActualizar,
    db: Session = Depends(get_db),
):
    """Actualiza los datos de un servicio existente."""
    servicio = db.query(Servicio).filter(Servicio.id_servicio == id_servicio).first()
    if servicio is None:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    datos_a_cambiar = datos.model_dump(exclude_unset=True)
    for campo, valor in datos_a_cambiar.items():
        setattr(servicio, campo, valor)

    db.commit()
    db.refresh(servicio)
    return servicio


@router.delete("/{id_servicio}", status_code=200)
def desactivar_servicio(id_servicio: int, db: Session = Depends(get_db)):
    """Desactiva un servicio (borrado lógico)."""
    servicio = db.query(Servicio).filter(Servicio.id_servicio == id_servicio).first()
    if servicio is None:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    servicio.activo = False
    db.commit()
    return {"mensaje": f"Servicio {id_servicio} desactivado correctamente"}
