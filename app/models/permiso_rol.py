"""Permisos configurables por rol, editables desde el panel de superadmin."""

from sqlalchemy import Column, Integer, String, Boolean
from app.db.session import Base


class PermisoRol(Base):
    __tablename__ = "permisos_rol"

    id_permiso = Column(Integer, primary_key=True, autoincrement=True)
    ruta = Column(String(60), unique=True, nullable=False)
    administrador = Column(Boolean, default=True)
    recepcionista = Column(Boolean, default=False)
    barbero = Column(Boolean, default=False)