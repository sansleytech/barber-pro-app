"""Modelos de contenido web: slides del carrusel y fotos."""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class CarouselSlide(Base):
    __tablename__ = "carousel_slides"

    id_slide = Column(Integer, primary_key=True, autoincrement=True)
    titulo = Column(String(150), nullable=True)
    subtitulo = Column(String(250), nullable=True)
    imagen = Column(String(255), nullable=False)  # ruta/URL de la imagen
    texto_boton = Column(String(50), nullable=True)
    enlace_boton = Column(String(255), nullable=True)
    orden = Column(Integer, default=0)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, server_default=func.now())


class FotoCliente(Base):
    __tablename__ = "fotos_cliente"

    id_foto = Column(Integer, primary_key=True, autoincrement=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente", ondelete="SET NULL"), nullable=True)
    imagen = Column(String(255), nullable=False)  # ruta/URL de la imagen
    descripcion = Column(String(250), nullable=True)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, server_default=func.now())

    cliente = relationship("Cliente")
