"""Endpoints de autenticación (login)."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario
from app.core.security import verificar_password, crear_token

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login")
def login(
    datos: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Verifica credenciales y devuelve un token de acceso."""
    usuario = db.query(Usuario).filter(
        Usuario.nombre_usuario == datos.username
    ).first()

    # Mismo mensaje para usuario inexistente o clave mala (no revelar cuál falló)
    if usuario is None or not verificar_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if not usuario.activo:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    # Actualizar datos de acceso
    usuario.ultimo_acceso = datetime.now(timezone.utc)
    usuario.cantidad_logins = (usuario.cantidad_logins or 0) + 1
    db.commit()

    # El token lleva el id y rol del usuario
    token = crear_token({
        "sub": str(usuario.id_usuario),
        "rol": usuario.rol.value,
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "id_usuario": usuario.id_usuario,
            "nombre_usuario": usuario.nombre_usuario,
            "rol": usuario.rol.value,
            "super_admin": usuario.super_admin,
        },
    }
