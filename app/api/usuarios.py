"""Endpoints del recurso Usuario."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCrear, UsuarioRespuesta
from app.core.security import hashear_password

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("", response_model=list[UsuarioRespuesta])
def listar_usuarios(db: Session = Depends(get_db)):
    """Devuelve todos los usuarios activos."""
    return db.query(Usuario).filter(Usuario.activo == True).all()


@router.post("", response_model=UsuarioRespuesta, status_code=201)
def crear_usuario(datos: UsuarioCrear, db: Session = Depends(get_db)):
    """Crea un usuario, guardando la contraseña hasheada."""
    # Verificar que el nombre de usuario no exista ya
    existe = db.query(Usuario).filter(Usuario.nombre_usuario == datos.nombre_usuario).first()
    if existe:
        raise HTTPException(status_code=409, detail="El nombre de usuario ya está en uso")

    nuevo = Usuario(
        nombre_usuario=datos.nombre_usuario,
        password_hash=hashear_password(datos.password),
        rol=datos.rol,
        id_barbero=datos.id_barbero,
        pregunta_seguridad=datos.pregunta_seguridad,
        respuesta_hash=hashear_password(datos.respuesta_seguridad) if datos.respuesta_seguridad else None,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo
