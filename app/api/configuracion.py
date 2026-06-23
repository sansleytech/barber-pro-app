"""Endpoints de configuración del sistema."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.configuracion import Configuracion
from app.models.usuario import Usuario, RolEnum
from app.schemas.configuracion import (
    ConfiguracionItem, ConfiguracionRespuesta, ConfiguracionActualizar
)
from app.core.dependencies import requiere_rol

router = APIRouter(prefix="/configuracion", tags=["Configuración"])


@router.get("", response_model=list[ConfiguracionRespuesta])
def listar_configuracion(db: Session = Depends(get_db)):
    """Devuelve toda la configuración. Público (el frontend muestra nombre, etc.)."""
    return db.query(Configuracion).all()


@router.get("/{clave}", response_model=ConfiguracionRespuesta)
def obtener_configuracion(clave: str, db: Session = Depends(get_db)):
    """Devuelve un ajuste por su clave. Si no existe, devuelve valor vacío."""
    item = db.query(Configuracion).filter(Configuracion.clave == clave).first()
    if item is None:
        return {"clave": clave, "valor": None, "fecha_actualizacion": None}
    return item


@router.put("/{clave}", response_model=ConfiguracionRespuesta)
def guardar_configuracion(
    clave: str,
    datos: ConfiguracionActualizar,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Crea o actualiza un ajuste. Solo administradores."""
    item = db.query(Configuracion).filter(Configuracion.clave == clave).first()
    if item is None:
        # Si no existe, lo crea
        item = Configuracion(clave=clave, valor=datos.valor)
        db.add(item)
    else:
        # Si existe, lo actualiza
        item.valor = datos.valor
    db.commit()
    db.refresh(item)
    return item
