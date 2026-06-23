"""Endpoints de autenticación (login) — multi-tenant."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.barberia import Barberia
from app.core.security import verificar_password, crear_token

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login")
def login(
    datos: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Login multi-tenant. Requiere el subdominio de la barbería.
    En el formulario OAuth2, el subdominio va en el campo 'client_id'.
    (username = usuario, password = contraseña, client_id = subdominio)
    """
    subdominio = (datos.client_id or "").lower().strip()

    if not subdominio:
        raise HTTPException(
            status_code=400,
            detail="Falta el subdominio de la barbería (ponelo en el campo client_id)",
        )

    # 1. Buscar la barbería por su subdominio
    barberia = db.query(Barberia).filter(Barberia.subdominio == subdominio).first()
    if barberia is None:
        raise HTTPException(status_code=404, detail="Barbería no encontrada")

    if not barberia.activo or barberia.estado.value == "cancelada":
        raise HTTPException(status_code=403, detail="La barbería no está activa")

    # 2. Buscar el usuario DENTRO de esa barbería
    usuario = db.query(Usuario).filter(
        Usuario.nombre_usuario == datos.username,
        Usuario.id_barberia == barberia.id_barberia,
    ).first()

    # Mismo mensaje para usuario inexistente o clave mala
    if usuario is None or not verificar_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if not usuario.activo:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    # 3. Actualizar datos de acceso
    usuario.ultimo_acceso = datetime.now(timezone.utc)
    usuario.cantidad_logins = (usuario.cantidad_logins or 0) + 1
    db.commit()

    # 4. El token lleva id, rol Y la barbería (esto es lo nuevo del multi-tenant)
    token = crear_token({
        "sub": str(usuario.id_usuario),
        "rol": usuario.rol.value,
        "id_barberia": barberia.id_barberia,
        "subdominio": barberia.subdominio,
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "id_usuario": usuario.id_usuario,
            "nombre_usuario": usuario.nombre_usuario,
            "rol": usuario.rol.value,
            "super_admin": usuario.super_admin,
            "id_barberia": barberia.id_barberia,
            "barberia": barberia.nombre,
        },
    }
