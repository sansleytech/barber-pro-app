from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.barberia import EstadoBarberiaEnum


class LoginSuperAdmin(BaseModel):
    username: str
    password: str


class BarberiaResumen(BaseModel):
    id_barberia: int
    subdominio: str
    nombre: str
    email_contacto: Optional[str] = None
    telefono: Optional[str] = None
    estado: EstadoBarberiaEnum
    trial_hasta: Optional[date] = None
    activo: bool
    fecha_registro: datetime
    plan_actual: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class CambiarEstadoBarberia(BaseModel):
    estado: EstadoBarberiaEnum


class MetricasGlobales(BaseModel):
    total_barberias: int
    en_trial: int
    activas: int
    suspendidas: int
    canceladas: int
    mrr: float


class PagoResumen(BaseModel):
    id_pago: int
    referencia: str
    monto: float
    estado: str
    metodo_pago: Optional[str] = None
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)

    