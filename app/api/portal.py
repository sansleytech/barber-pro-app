"""Endpoints PÚBLICOS del portal (sin login). Identifican la barbería por subdominio."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.models.barberia import Barberia
from app.models.cliente import Cliente
from app.models.barbero import Barbero
from app.models.solicitud_turno import SolicitudTurno
from app.schemas.solicitud_turno import SolicitudCrear

router = APIRouter(prefix="/portal", tags=["Portal público"])


def _barberia_por_subdominio(subdominio: str, db: Session) -> Barberia:
    """Busca la barbería activa por su subdominio. Rechaza si no existe o está inactiva."""
    barberia = db.query(Barberia).filter(
        Barberia.subdominio == subdominio,
        Barberia.activo == True,
    ).first()
    if barberia is None:
        raise HTTPException(status_code=404, detail="Barbería no encontrada")
    return barberia


class ClientePublico(BaseModel):
    """Lo mínimo que devolvemos públicamente de un cliente (sin datos sensibles)."""
    primer_nombre: str
    existe: bool


@router.get("/{subdominio}/cliente/{documento}", response_model=ClientePublico)
def identificar_cliente(subdominio: str, documento: str, db: Session = Depends(get_db)):
    """Dice si un cliente con ese documento ya existe en la barbería. No expone datos sensibles."""
    barberia = _barberia_por_subdominio(subdominio, db)
    cliente = db.query(Cliente).filter(
        Cliente.documento == documento,
        Cliente.id_barberia == barberia.id_barberia,
    ).first()
    if cliente is None:
        return {"primer_nombre": "", "existe": False}
    return {"primer_nombre": cliente.primer_nombre, "existe": True}


@router.post("/{subdominio}/solicitar", status_code=201)
def crear_solicitud(subdominio: str, datos: SolicitudCrear, db: Session = Depends(get_db)):
    """Crea una solicitud de turno (estado pendiente). Pública."""
    barberia = _barberia_por_subdominio(subdominio, db)

    # Validación básica anti-spam: nombre y teléfono con contenido razonable
    if not datos.nombre_cliente.strip() or len(datos.nombre_cliente.strip()) < 2:
        raise HTTPException(status_code=400, detail="Nombre inválido")
    if not datos.telefono.strip() or len(datos.telefono.strip()) < 6:
        raise HTTPException(status_code=400, detail="Teléfono inválido")

    # Si mandó un barbero, validar que pertenezca a esta barbería
    if datos.id_barbero is not None:
        barbero = db.query(Barbero).filter(
            Barbero.id_barbero == datos.id_barbero,
            Barbero.id_barberia == barberia.id_barberia,
        ).first()
        if barbero is None:
            raise HTTPException(status_code=400, detail="Barbero no válido")

    solicitud = SolicitudTurno(
        id_barberia=barberia.id_barberia,
        id_barbero=datos.id_barbero,
        nombre_cliente=datos.nombre_cliente.strip(),
        telefono=datos.telefono.strip(),
        documento=datos.documento.strip() if datos.documento else None,
        fecha_preferida=datos.fecha_preferida,
        franja_preferida=datos.franja_preferida,
        comentario=datos.comentario.strip() if datos.comentario else None,
    )
    db.add(solicitud)
    db.commit()
    db.refresh(solicitud)
    return {"mensaje": "Solicitud recibida", "id_solicitud": solicitud.id_solicitud}
