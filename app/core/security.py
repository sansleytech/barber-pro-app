"""Funciones de seguridad: hashing de contraseñas."""

import bcrypt


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
