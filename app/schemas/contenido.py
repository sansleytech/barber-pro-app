"""Esquemas Pydantic de contenido web."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


# ---- Carousel ----
class SlideCrear(BaseModel):
    titulo: Optional[str] = None
    subtitulo: Optional[str] = None
    imagen: str
    texto_boton: Optional[str] = None
    enlace_boton: Optional[str] = None
    orden: Optional[int] = 0


class SlideActualizar(BaseModel):
    titulo: Optional[str] = None
    subtitulo: Optional[str] = None
    imagen: Optional[str] = None
    texto_boton: Optional[str] = None
    enlace_boton: Optional[str] = None
    orden: Optional[int] = None
    activo: Optional[bool] = None


class SlideRespuesta(BaseModel):
    id_slide: int
    titulo: Optional[str] = None
    subtitulo: Optional[str] = None
    imagen: str
    texto_boton: Optional[str] = None
    enlace_boton: Optional[str] = None
    orden: int
    activo: bool
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)


# ---- Fotos ----
class FotoCrear(BaseModel):
    id_cliente: Optional[int] = None
    imagen: str
    descripcion: Optional[str] = None


class FotoRespuesta(BaseModel):
    id_foto: int
    id_cliente: Optional[int] = None
    imagen: str
    descripcion: Optional[str] = None
    activo: bool
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)
