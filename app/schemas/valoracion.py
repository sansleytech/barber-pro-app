"""Esquemas Pydantic de valoraciones."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class ValoracionCrear(BaseModel):
    id_turno: int
    estrellas: int
    comentario: Optional[str] = None

    @field_validator("estrellas")
    @classmethod
    def validar_estrellas(cls, v):
        if v < 1 or v > 5:
            raise ValueError("Las estrellas deben estar entre 1 y 5")
        return v


class ValoracionRespuesta(BaseModel):
    id_valoracion: int
    id_turno: int
    id_barbero: Optional[int] = None
    id_cliente: Optional[int] = None
    estrellas: int
    comentario: Optional[str] = None
    fecha_creacion: datetime

    model_config = ConfigDict(from_attributes=True)
