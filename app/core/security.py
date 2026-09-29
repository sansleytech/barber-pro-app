"""Funciones de seguridad: hashing de contraseñas y tokens JWT."""

from datetime import datetime, timedelta, timezone
import bcrypt
from jose import jwt, JWTError

from app.core.config import settings

ALGORITMO = "HS256"


def hashear_password(password: str) -> str:
    """Convierte una contraseña en texto plano a un hash seguro."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verificar_password(password_plano: str, password_hash: str) -> bool:
    """Verifica si una contraseña en texto plano coincide con su hash."""
    return bcrypt.checkpw(
        password_plano.encode("utf-8"),
        password_hash.encode("utf-8"),
    )


def crear_token(datos: dict) -> str:
    """Crea un token JWT con los datos dados y una expiración."""
    a_codificar = datos.copy()
    expira = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    a_codificar.update({"exp": expira})
    return jwt.encode(a_codificar, settings.SECRET_KEY, algorithm=ALGORITMO)


def crear_token_dispositivo(datos: dict, dias: int = 1) -> str:
    """Token de larga duración para 'recordar' un dispositivo ya verificado
    con el código de email. Mientras sea válido, el login no vuelve a pedir
    el código en ese mismo navegador."""
    a_codificar = datos.copy()
    expira = datetime.now(timezone.utc) + timedelta(days=dias)
    a_codificar.update({"exp": expira})
    return jwt.encode(a_codificar, settings.SECRET_KEY, algorithm=ALGORITMO)


def decodificar_token(token: str) -> dict | None:
    """Decodifica un token JWT. Devuelve el contenido o None si es inválido."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITMO])
    except JWTError:
        return None