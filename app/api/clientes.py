"""Endpoints (rutas) del recurso Cliente — multi-tenant."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.cliente import Cliente
from app.models.usuario import Usuario, RolEnum
from app.schemas.cliente import ClienteCrear, ClienteRespuesta, ClienteActualizar
from app.core.dependencies import get_barberia_actual, requiere_rol

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.get("", response_model=list[ClienteRespuesta])
def listar_clientes(
    db: Session = Depends(get_db),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Devuelve los clientes activos de la barbería del usuario."""
    return (
        db.query(Cliente)
        .filter(Cliente.activo == True, Cliente.id_barberia == id_barberia)
        .all()
    )


@router.get("/{id_cliente}", response_model=ClienteRespuesta)
def obtener_cliente(
    id_cliente: int,
    db: Session = Depends(get_db),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Devuelve un cliente por su id (solo de la barbería del usuario)."""
    cliente = (
        db.query(Cliente)
        .filter(Cliente.id_cliente == id_cliente, Cliente.id_barberia == id_barberia)
        .first()
    )
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.post("", response_model=ClienteRespuesta, status_code=201)
def crear_cliente(
    cliente: ClienteCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador, RolEnum.recepcionista)),
):
    """Crea un nuevo cliente en la barbería del usuario."""
    nuevo = Cliente(**cliente.model_dump(), id_barberia=usuario.id_barberia)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_cliente}", response_model=ClienteRespuesta)
def actualizar_cliente(
    id_cliente: int,
    datos: ClienteActualizar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador, RolEnum.recepcionista)),
):
    """Actualiza los datos de un cliente existente (solo de la barbería del usuario)."""
    cliente = (
        db.query(Cliente)
        .filter(Cliente.id_cliente == id_cliente, Cliente.id_barberia == usuario.id_barberia)
        .first()
    )
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    datos_a_cambiar = datos.model_dump(exclude_unset=True)
    for campo, valor in datos_a_cambiar.items():
        setattr(cliente, campo, valor)

    db.commit()
    db.refresh(cliente)
    return cliente


@router.delete("/{id_cliente}", status_code=200)
def desactivar_cliente(
    id_cliente: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Desactiva un cliente (borrado lógico), solo de la barbería del usuario."""
    cliente = (
        db.query(Cliente)
        .filter(Cliente.id_cliente == id_cliente, Cliente.id_barberia == usuario.id_barberia)
        .first()
    )
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    cliente.activo = False
    db.commit()
    return {"mensaje": f"Cliente {id_cliente} desactivado correctamente"}