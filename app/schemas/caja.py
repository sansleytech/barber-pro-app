"""Esquemas Pydantic para el módulo de caja diaria."""

from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class DetalleServicio(BaseModel):
    id_turno: int
    hora_inicio: str
    cliente: str
    barbero: str
    servicio: str
    metodo_pago: str | None = None
    precio: float


class PorMetodo(BaseModel):
    metodo: str
    cantidad: int
    total: float


class PorBarbero(BaseModel):
    barbero: str
    cantidad: int
    total: float


class ResumenCaja(BaseModel):
    total_bruto: float
    total_propinas: float
    total_productos: float
    total_turnos: int


class DescuentoInfo(BaseModel):
    monto: float


class CierreInfo(BaseModel):
    nombre_usuario: str
    total_ingresos: float
    observaciones: str | None = None
    fecha_cierre: datetime


class CajaDiaRespuesta(BaseModel):
    resumen: ResumenCaja
    descuento: DescuentoInfo
    porMetodo: list[PorMetodo]
    porBarbero: list[PorBarbero]
    detalle: list[DetalleServicio]
    cerrada: bool
    cierre: CierreInfo | None = None


class DescuentoActualizar(BaseModel):
    fecha: date
    monto: float


class MetodoPagoActualizar(BaseModel):
    id_turno: int
    metodo_pago: str


class CerrarCajaDatos(BaseModel):
    fecha: date
    id_usuario: int
    observaciones: str | None = None


class HistorialCierre(BaseModel):
    fecha: date
    total_turnos: int
    nombre_usuario: str
    total_ingresos: float
    total_propinas: float
    model_config = ConfigDict(from_attributes=True)


class GastoCrear(BaseModel):
    fecha: date
    categoria: str
    monto: float
    descripcion: str | None = None
    id_usuario: int


class GastoRespuesta(BaseModel):
    id_gasto: int
    fecha: date
    categoria: str
    monto: float
    descripcion: str | None = None
    model_config = ConfigDict(from_attributes=True)