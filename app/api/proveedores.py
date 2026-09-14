"""Endpoints de Proveedores — multi-tenant."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.proveedor import Proveedor
from app.models.usuario import Usuario, RolEnum
from app.schemas.proveedor import (
    ProveedorCrear,
    ProveedorRespuesta,
    ProveedorActualizar,
)
from app.core.dependencies import get_barberia_actual, requiere_rol

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])


@router.get("", response_model=list[ProveedorRespuesta])
def listar(
    db: Session = Depends(get_db), id_barberia: int = Depends(get_barberia_actual)
):
    return (
        db.query(Proveedor)
        .filter(Proveedor.activo == True, Proveedor.id_barberia == id_barberia)
        .all()
    )


@router.post("", response_model=ProveedorRespuesta, status_code=201)
def crear(
    datos: ProveedorCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    nuevo = Proveedor(**datos.model_dump(), id_barberia=usuario.id_barberia)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    usuario_barbero = db.query(Usuario).filter(
        Usuario.id_barbero == barbero.id_barbero,
        Usuario.id_barberia == id_barberia,
    ).first()
    if usuario_barbero and usuario_barbero.email:
        from app.core.email import enviar_email
        enviar_email(
            destinatario=usuario_barbero.email,
            asunto="Tenés un turno nuevo asignado",
            cuerpo_html=f"""
                <p>Hola {barbero.nombre},</p>
                <p>Te asignaron un turno para el <strong>{nuevo.fecha}</strong> a las <strong>{nuevo.hora_inicio.strftime('%H:%M')}</strong>.</p>
                <p>Revisá los detalles en tu panel: <a href="https://barberproapp.online/login">Ingresar</a></p>
            """,
        )

    return nuevo


@router.put("/{id_proveedor}", response_model=ProveedorRespuesta)
def actualizar(
    id_proveedor: int,
    datos: ProveedorActualizar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    item = (
        db.query(Proveedor)
        .filter(
            Proveedor.id_proveedor == id_proveedor,
            Proveedor.id_barberia == usuario.id_barberia,
        )
        .first()
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    for c, v in datos.model_dump(exclude_unset=True).items():
        setattr(item, c, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{id_proveedor}", status_code=200)
def desactivar(
    id_proveedor: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    item = (
        db.query(Proveedor)
        .filter(
            Proveedor.id_proveedor == id_proveedor,
            Proveedor.id_barberia == usuario.id_barberia,
        )
        .first()
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    item.activo = False
    db.commit()
    return {"mensaje": f"Proveedor {id_proveedor} desactivado"}
