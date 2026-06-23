"""Endpoints (rutas) del recurso Barbero — multi-tenant."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.barbero import BarberoCrear, BarberoRespuesta, BarberoActualizar
from app.db.session import get_db
from app.models.barbero import Barbero
from app.models.usuario import Usuario, RolEnum
from app.core.dependencies import get_barberia_actual, requiere_rol


router = APIRouter(prefix="/barberos", tags=["Barberos"])


@router.get("", response_model=list[BarberoRespuesta])
def listar_barberos(
    db: Session = Depends(get_db),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Devuelve los barberos activos de la barbería."""
    return db.query(Barbero).filter(
        Barbero.activo == True,
        Barbero.id_barberia == id_barberia,
    ).all()


@router.post("", response_model=BarberoRespuesta, status_code=201)
def crear_barbero(
    barbero: BarberoCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Crea un nuevo barbero. Solo administradores."""
    nuevo = Barbero(**barbero.model_dump(), id_barberia=usuario.id_barberia)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/{id_barbero}", response_model=BarberoRespuesta)
def obtener_barbero(
    id_barbero: int,
    db: Session = Depends(get_db),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Devuelve un barbero por su id (solo de la barbería del usuario)."""
    barbero = db.query(Barbero).filter(
        Barbero.id_barbero == id_barbero,
        Barbero.id_barberia == id_barberia,
    ).first()
    if barbero is None:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")
    return barbero


@router.put("/{id_barbero}", response_model=BarberoRespuesta)
def actualizar_barbero(
    id_barbero: int,
    datos: BarberoActualizar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Actualiza un barbero. Solo administradores."""
    barbero = db.query(Barbero).filter(
        Barbero.id_barbero == id_barbero,
        Barbero.id_barberia == usuario.id_barberia,
    ).first()
    if barbero is None:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")

    datos_a_cambiar = datos.model_dump(exclude_unset=True)
    for campo, valor in datos_a_cambiar.items():
        setattr(barbero, campo, valor)

    db.commit()
    db.refresh(barbero)
    return barbero


@router.delete("/{id_barbero}", status_code=200)
def desactivar_barbero(
    id_barbero: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Desactiva un barbero. Solo administradores."""
    barbero = db.query(Barbero).filter(
        Barbero.id_barbero == id_barbero,
        Barbero.id_barberia == usuario.id_barberia,
    ).first()
    if barbero is None:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")

    barbero.activo = False
    db.commit()
    return {"mensaje": f"Barbero {id_barbero} desactivado correctamente"}
