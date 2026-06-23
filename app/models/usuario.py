"""Modelo para representar un usuario del sistema (login y roles)."""

import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum, ForeignKey,
    UniqueConstraint, func
)
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.mixins import TenantMixin


class RolEnum(str, enum.Enum):
    """Roles posibles de un usuario."""
    administrador = "administrador"
    barbero = "barbero"
    recepcionista = "recepcionista"
    cliente = "cliente"


class Usuario(Base, TenantMixin):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    nombre_usuario = Column(String(50), nullable=False)
    email = Column(String(120), nullable=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(Enum(RolEnum), nullable=False, default=RolEnum.barbero)
    id_barbero = Column(Integer, ForeignKey("barberos.id_barbero", ondelete="SET NULL"), nullable=True)
    foto_perfil = Column(String(255), nullable=True)
    activo = Column(Boolean, default=True)
    super_admin = Column(Boolean, default=False)
    ultimo_acceso = Column(DateTime, nullable=True)
    cantidad_logins = Column(Integer, default=0)
    pregunta_seguridad = Column(String(255), nullable=True)
    respuesta_hash = Column(String(255), nullable=True)
    fecha_creacion = Column(DateTime, server_default=func.now())

    # El nombre de usuario es único DENTRO de cada barbería, no globalmente.
    # Así dos barberías pueden tener su propio "admin".
    __table_args__ = (
        UniqueConstraint("nombre_usuario", "id_barberia", name="uq_usuario_barberia"),
    )

    barbero = relationship("Barbero")
