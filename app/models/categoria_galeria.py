"""Modelo para las categorías de la galería (Cortes, Barba, Tintes...)."""

from sqlalchemy import Column, Integer, String
from app.db.session import Base
from app.models.mixins import TenantMixin


class CategoriaGaleria(Base, TenantMixin):
    __tablename__ = "categorias_galeria"

    id_categoria_galeria = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(80), nullable=False)
    orden = Column(Integer, default=0)
