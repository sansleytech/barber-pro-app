"""Esquemas Pydantic de los horarios de barbero."""

from datetime import time
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class HorarioBase(BaseModel):
    id_barbero: int
    dia_semana: int  # 1=Lunes ... 7=Domingo
    hora_inicio: time
    hora_fin: time
    pausa_inicio: Optional[time] = None
    pausa_fin: Optional[time] = None

    @field_validator("dia_semana")
    @classmethod
    def validar_dia(cls, v):
        if v < 1 or v > 7:
            raise ValueError("dia_semana debe estar entre 1 (Lunes) y 7 (Domingo)")
        return v


class HorarioCrear(HorarioBase):
    pass


class HorarioActualizar(BaseModel):
    dia_semana: Optional[int] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    pausa_inicio: Optional[time] = None
    pausa_fin: Optional[time] = None


class HorarioRespuesta(HorarioBase):
    id_horario: int

    model_config = ConfigDict(from_attributes=True)
