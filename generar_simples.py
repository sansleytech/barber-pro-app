"""Genera los 8 recursos simples adaptados a multi-tenant."""
import os

CARPETA = "app/api"
os.makedirs("app/api/_respaldo", exist_ok=True)

# Plantilla estándar para un recurso CRUD simple multi-tenant
def plantilla(modelo, modulo_modelo, id_campo, prefix, tag, schema_crear, schema_resp, schema_act):
    return f'''"""Endpoints de {tag} — multi-tenant."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.{modulo_modelo} import {modelo}
from app.models.usuario import Usuario, RolEnum
from app.schemas.{modulo_modelo} import {schema_crear}, {schema_resp}, {schema_act}
from app.core.dependencies import get_barberia_actual, requiere_rol

router = APIRouter(prefix="/{prefix}", tags=["{tag}"])


@router.get("", response_model=list[{schema_resp}])
def listar(
    db: Session = Depends(get_db),
    id_barberia: int = Depends(get_barberia_actual),
):
    return db.query({modelo}).filter({modelo}.id_barberia == id_barberia).all()


@router.get("/{{item_id}}", response_model={schema_resp})
def obtener(
    item_id: int,
    db: Session = Depends(get_db),
    id_barberia: int = Depends(get_barberia_actual),
):
    item = db.query({modelo}).filter(
        {modelo}.{id_campo} == item_id,
        {modelo}.id_barberia == id_barberia,
    ).first()
    if item is None:
        raise HTTPException(status_code=404, detail="No encontrado")
    return item


@router.post("", response_model={schema_resp}, status_code=201)
def crear(
    datos: {schema_crear},
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    nuevo = {modelo}(**datos.model_dump(), id_barberia=usuario.id_barberia)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{{item_id}}", response_model={schema_resp})
def actualizar(
    item_id: int,
    datos: {schema_act},
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    item = db.query({modelo}).filter(
        {modelo}.{id_campo} == item_id,
        {modelo}.id_barberia == usuario.id_barberia,
    ).first()
    if item is None:
        raise HTTPException(status_code=404, detail="No encontrado")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(item, campo, valor)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{{item_id}}", status_code=200)
def eliminar(
    item_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    item = db.query({modelo}).filter(
        {modelo}.{id_campo} == item_id,
        {modelo}.id_barberia == usuario.id_barberia,
    ).first()
    if item is None:
        raise HTTPException(status_code=404, detail="No encontrado")
    if hasattr(item, "activo"):
        item.activo = False
    else:
        db.delete(item)
    db.commit()
    return {{"mensaje": "Eliminado correctamente"}}
