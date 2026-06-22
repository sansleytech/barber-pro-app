"""Endpoints (rutas) del recurso Cliente."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCrear, ClienteRespuesta, ClienteActualizar

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.get("", response_model=list[ClienteRespuesta])
def listar_clientes(db: Session = Depends(get_db)):
    """Devuelve todos los clientes activos."""
    return db.query(Cliente).filter(Cliente.activo == True).all()


@router.get("/{id_cliente}", response_model=ClienteRespuesta)
def obtener_cliente(id_cliente: int, db: Session = Depends(get_db)):
    """Devuelve un cliente por su id."""
    cliente = db.query(Cliente).filter(Cliente.id_cliente == id_cliente).first()
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.post("", response_model=ClienteRespuesta, status_code=201)
def crear_cliente(cliente: ClienteCrear, db: Session = Depends(get_db)):
    """Crea un nuevo cliente."""
    nuevo = Cliente(**cliente.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_cliente}", response_model=ClienteRespuesta)
def actualizar_cliente(
    id_cliente: int,
    datos: ClienteActualizar,
    db: Session = Depends(get_db),
):
    """Actualiza los datos de un cliente existente."""
    cliente = db.query(Cliente).filter(Cliente.id_cliente == id_cliente).first()
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    datos_a_cambiar = datos.model_dump(exclude_unset=True)
    for campo, valor in datos_a_cambiar.items():
        setattr(cliente, campo, valor)

    db.commit()
    db.refresh(cliente)
    return cliente


@router.delete("/{id_cliente}", status_code=200)
def desactivar_cliente(id_cliente: int, db: Session = Depends(get_db)):
    """Desactiva un cliente (borrado lógico)."""
    cliente = db.query(Cliente).filter(Cliente.id_cliente == id_cliente).first()
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    cliente.activo = False
    db.commit()
    return {"mensaje": f"Cliente {id_cliente} desactivado correctamente"}
