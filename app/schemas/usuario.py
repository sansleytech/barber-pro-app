"""Esquemas Pydantic del Usuario."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.models.usuario import RolEnum


class UsuarioCrear(BaseModel):
    nombre_usuario: str
    password: str  # texto plano al crear; se hashea antes de guardar
    rol: RolEnum = RolEnum.barbero
    id_barbero: Optional[int] = None
    pregunta_seguridad: Optional[str] = None
    respuesta_seguridad: Optional[str] = None


class UsuarioRespuesta(BaseModel):
    id_usuario: int
    nombre_usuario: str
    rol: RolEnum
    id_barbero: Optional[int] = None
    foto_perfil: Optional[str] = None
    activo: bool
    super_admin: bool
    ultimo_acceso: Optional[datetime] = None
    fecha_creacion: datetime

    model_config = ConfigDict(from_attributes=True)
