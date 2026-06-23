"""Esquemas Pydantic de la configuración."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ConfiguracionItem(BaseModel):
    clave: str
    valor: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ConfiguracionRespuesta(ConfiguracionItem):
    fecha_actualizacion: Optional[datetime] = None


class ConfiguracionActualizar(BaseModel):
    valor: Optional[str] = None
