"""Dependencias de autenticación y multi-tenancy."""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario, RolEnum
from app.core.security import decodificar_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_usuario_actual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    """Valida el token y devuelve el usuario autenticado."""
    excepcion = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    datos = decodificar_token(token)
    if datos is None:
        raise excepcion

    id_usuario = datos.get("sub")
    if id_usuario is None:
        raise excepcion

    usuario = db.query(Usuario).filter(Usuario.id_usuario == int(id_usuario)).first()
    if usuario is None or not usuario.activo:
        raise excepcion

    return usuario


def get_barberia_actual(
    usuario: Usuario = Depends(get_usuario_actual),
) -> int:
    """Devuelve el id_barberia del usuario logueado (para filtrar datos).

    Esta es la pieza clave del multi-tenant: cada endpoint la usa para
    asegurarse de operar SOLO sobre los datos de la barbería del usuario.
    """
    # El super_admin del SaaS no pertenece a una barbería específica
    if usuario.super_admin:
        # Si es super admin, no tiene una barbería propia (gestiona todas)
        # Para endpoints normales esto requeriría especificar la barbería aparte.
        return usuario.id_barberia  # puede ser None para super_admin global

    if usuario.id_barberia is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no está asociado a ninguna barbería",
        )
    return usuario.id_barberia


def requiere_rol(*roles_permitidos: RolEnum):
    """Crea una dependencia que exige que el usuario tenga uno de los roles dados."""
    def verificador(usuario: Usuario = Depends(get_usuario_actual)) -> Usuario:
        if usuario.super_admin:
            return usuario
        if usuario.rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés permiso para esta acción",
            )
        return usuario
    return verificador
