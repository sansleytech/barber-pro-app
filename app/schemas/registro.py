"""Esquema para el registro autoservicio de una barbería."""

from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime, timedelta


class RegistroBarberia(BaseModel):
    """Datos para registrar una barbería nueva con su admin inicial."""
    # Datos de la barbería
    nombre_barberia: str
    subdominio: str
    email_contacto: str | None = None
    telefono: str | None = None
    # Datos del usuario administrador inicial
    nombre_admin: str  # nombre real, se usa para personalizar (ej: el correo de bienvenida)
    nombre_usuario: str  # con esto se loguea, sin espacios
    email_admin: str
    password_admin: str

    @field_validator("subdominio")
    @classmethod
    def validar_subdominio(cls, v):
        v = v.lower().strip()
        if not v.isalnum():
            raise ValueError("El subdominio solo puede tener letras y números, sin espacios ni símbolos")
        if len(v) < 3:
            raise ValueError("El subdominio debe tener al menos 3 caracteres")
        return v

    @field_validator("nombre_usuario")
    @classmethod
    def validar_nombre_usuario(cls, v):
        v = v.strip()
        if " " in v:
            raise ValueError("El nombre de usuario no puede tener espacios")
        if not v.isalnum():
            raise ValueError("El nombre de usuario solo puede tener letras y números")
        if len(v) < 3:
            raise ValueError("El nombre de usuario debe tener al menos 3 caracteres")
        return v

    @field_validator("password_admin")
    @classmethod
    def validar_password(cls, v):
        if len(v) < 6:
            raise ValueError("La contraseña debe tener al menos 6 caracteres")
        if not any(c.isupper() for c in v):
            raise ValueError("La contraseña debe tener al menos una mayúscula")
        if not any(c.islower() for c in v):
            raise ValueError("La contraseña debe tener al menos una minúscula")
        if not any(c.isdigit() for c in v):
            raise ValueError("La contraseña debe tener al menos un número")
        return v


class RegistroRespuesta(BaseModel):
    mensaje: str
    id_barberia: int
    subdominio: str
    nombre_usuario_admin: str

    model_config = ConfigDict(from_attributes=True)