from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.notificacion import TipoNotificacionEnum


class NotificacionCrear(BaseModel):
    titulo: str
    mensaje: str
    tipo: TipoNotificacionEnum = TipoNotificacionEnum.info
    id_usuario: Optional[int] = None
    enlace: Optional[str] = None


class NotificacionRespuesta(BaseModel):
    id_notificacion: int
    titulo: str
    mensaje: str
    tipo: TipoNotificacionEnum
    id_usuario: Optional[int] = None
    enlace: Optional[str] = None
    leida: bool
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)