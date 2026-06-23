"""Endpoints de proveedores."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.proveedor import Proveedor
from app.models.usuario import Usuario, RolEnum
from app.schemas.proveedor import ProveedorCrear, ProveedorRespuesta, ProveedorActualizar
from app.core.dependencies import requiere_rol

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])


@router.get("", response_model=list[ProveedorRespuesta])
def listar_proveedores(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador, RolEnum.recepcionista)),
):
    """Lista proveedores activos. Admin y recepcionista."""
    return db.query(Proveedor).filter(Proveedor.activo == True).all()


@router.post("", response_model=ProveedorRespuesta, status_code=201)
def crear_proveedor(
    datos: ProveedorCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Crea un proveedor. Solo administradores."""
    nuevo = Proveedor(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_proveedor}", response_model=ProveedorRespuesta)
def actualizar_proveedor(
    id_proveedor: int,
    datos: ProveedorActualizar,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Actualiza un proveedor. Solo administradores."""
    prov = db.query(Proveedor).filter(Proveedor.id_proveedor == id_proveedor).first()
    if prov is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(prov, campo, valor)
    db.commit()
    db.refresh(prov)
    return prov


@router.delete("/{id_proveedor}", status_code=200)
def desactivar_proveedor(
    id_proveedor: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Desactiva un proveedor. Solo administradores."""
    prov = db.query(Proveedor).filter(Proveedor.id_proveedor == id_proveedor).first()
    if prov is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    prov.activo = False
    db.commit()
    return {"mensaje": f"Proveedor {id_proveedor} desactivado"}
