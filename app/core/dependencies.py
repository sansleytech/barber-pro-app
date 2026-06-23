"""Dependencias de autenticación: obtener el usuario actual desde el token."""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario, RolEnum
from app.core.security import decodificar_token

# Le dice a FastAPI dónde se obtiene el token (el endpoint de login)
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


def requiere_rol(*roles_permitidos: RolEnum):
    """Crea una dependencia que exige que el usuario tenga uno de los roles dados."""
    def verificador(usuario: Usuario = Depends(get_usuario_actual)) -> Usuario:
        # El super_admin puede todo
        if usuario.super_admin:
            return usuario
        if usuario.rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés permiso para esta acción",
            )
        return usuario
    return verificador
