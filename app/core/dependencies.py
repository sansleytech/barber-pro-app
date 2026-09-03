"""Dependencias de autenticación y multi-tenancy."""

from datetime import date

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario, RolEnum
from app.models.barberia import Barberia, EstadoBarberiaEnum
from app.core.security import decodificar_token
from app.models.plan import Suscripcion
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
    if usuario.super_admin:
        return usuario.id_barberia  # puede ser None para super_admin global

    if usuario.id_barberia is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no está asociado a ninguna barbería",
        )
    return usuario.id_barberia


def verificar_barberia_activa(
    usuario: Usuario = Depends(get_usuario_actual),
    id_barberia: int = Depends(get_barberia_actual),
    db: Session = Depends(get_db),
) -> Usuario:
    """Bloquea el acceso si el trial venció o la barbería está suspendida/cancelada.

    El super_admin de la plataforma nunca queda bloqueado por esta verificación,
    ya que gestiona todas las barberías y no pertenece a una en particular.
    """
    if usuario.super_admin:
        return usuario

    barberia = db.query(Barberia).filter(Barberia.id_barberia == id_barberia).first()
    if barberia is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barbería no encontrada",
        )

    if barberia.estado == EstadoBarberiaEnum.trial:
        if barberia.trial_hasta and barberia.trial_hasta < date.today():
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Tu período de prueba terminó. Actualizá tu plan para seguir usando el sistema.",
            )
    elif barberia.estado in (EstadoBarberiaEnum.suspendida, EstadoBarberiaEnum.cancelada):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta no está activa. Contactá al soporte.",
        )

    return usuario


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

def requiere_plan(*campos: str):
    """Crea una dependencia que exige que el plan de la barbería tenga
    habilitada alguna de las funciones indicadas (ej. 'permite_inventario').

    Se usa junto a verificar_barberia_activa en los endpoints de funciones
    premium: inventario/ventas, notificaciones automáticas y códigos QR.
    """

    def verificador(
        usuario: Usuario = Depends(get_usuario_actual),
        id_barberia: int = Depends(get_barberia_actual),
        db: Session = Depends(get_db),
    ) -> Usuario:
        if usuario.super_admin:
            return usuario

        suscripcion = (
            db.query(Suscripcion)
            .filter(Suscripcion.id_barberia == id_barberia)
            .order_by(Suscripcion.fecha_creacion.desc())
            .first()
        )
        if suscripcion is None or suscripcion.plan is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés un plan activo asociado a tu barbería.",
            )

        plan = suscripcion.plan
        if not any(getattr(plan, campo, False) for campo in campos):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tu plan actual no incluye esta función. Mejorá tu plan para acceder.",
            )
        return usuario

    return verificador
    