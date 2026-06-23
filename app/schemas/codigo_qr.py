"""Esquemas Pydantic de códigos QR."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.codigo_qr import TipoQREnum


class QRCrear(BaseModel):
    nombre: str
    tipo: TipoQREnum = TipoQREnum.personalizado
    url_destino: str
    id_barbero: Optional[int] = None


class QRRespuesta(BaseModel):
    id_qr: int
    nombre: str
    tipo: TipoQREnum
    url_destino: str
    id_barbero: Optional[int] = None
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)
