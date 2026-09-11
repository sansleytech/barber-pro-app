from pydantic import BaseModel, ConfigDict


class PermisoRolRespuesta(BaseModel):
    id_permiso: int
    ruta: str
    administrador: bool
    recepcionista: bool
    barbero: bool
    model_config = ConfigDict(from_attributes=True)


class PermisoRolActualizar(BaseModel):
    administrador: bool
    recepcionista: bool
    barbero: bool