"""Endpoints (rutas) del recurso Barbero."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.barbero import BarberoCrear, BarberoRespuesta, BarberoActualizar
from app.db.session import get_db
from app.models.barbero import Barbero


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

@router.get("/{id_barbero}", response_model=BarberoRespuesta)
def obtener_barbero(id_barbero: int, db: Session = Depends(get_db)):
    """Devuelve un barbero por su id."""
    barbero = db.query(Barbero).filter(Barbero.id_barbero == id_barbero).first()
    if barbero is None:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")
    return barbero

@router.put("/{id_barbero}", response_model=BarberoRespuesta)
def actualizar_barbero(
    id_barbero: int,
    datos: BarberoActualizar,
    db: Session = Depends(get_db),
):
    """Actualiza los datos de un barbero existente."""
    barbero = db.query(Barbero).filter(Barbero.id_barbero == id_barbero).first()
    if barbero is None:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")

    # Solo actualizamos los campos que el cliente envió (no los None)
    datos_a_cambiar = datos.model_dump(exclude_unset=True)
    for campo, valor in datos_a_cambiar.items():
        setattr(barbero, campo, valor)

    db.commit()
    db.refresh(barbero)
    return barbero

@router.delete("/{id_barbero}", status_code=200)
def desactivar_barbero(id_barbero: int, db: Session = Depends(get_db)):
    """Desactiva un barbero (borrado lógico, no se elimina de la base)."""
    barbero = db.query(Barbero).filter(Barbero.id_barbero == id_barbero).first()
    if barbero is None:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")

    barbero.activo = False
    db.commit()
    return {"mensaje": f"Barbero {id_barbero} desactivado correctamente"}