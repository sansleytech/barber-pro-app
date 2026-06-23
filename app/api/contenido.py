"""Endpoints de contenido web: carrusel y fotos."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.contenido import CarouselSlide, FotoCliente
from app.models.usuario import Usuario, RolEnum
from app.schemas.contenido import (
    SlideCrear, SlideActualizar, SlideRespuesta,
    FotoCrear, FotoRespuesta,
)
from app.core.dependencies import requiere_rol

router = APIRouter(prefix="/contenido", tags=["Contenido web"])


# ---------- CARRUSEL ----------
@router.get("/carousel", response_model=list[SlideRespuesta])
def listar_slides(db: Session = Depends(get_db)):
    """Lista los slides activos del carrusel. Público."""
    return db.query(CarouselSlide).filter(
        CarouselSlide.activo == True
    ).order_by(CarouselSlide.orden).all()


@router.post("/carousel", response_model=SlideRespuesta, status_code=201)
def crear_slide(
    datos: SlideCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Crea un slide. Solo administradores."""
    slide = CarouselSlide(**datos.model_dump())
    db.add(slide)
    db.commit()
    db.refresh(slide)
    return slide


@router.put("/carousel/{id_slide}", response_model=SlideRespuesta)
def actualizar_slide(
    id_slide: int,
    datos: SlideActualizar,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Actualiza un slide. Solo administradores."""
    slide = db.query(CarouselSlide).filter(CarouselSlide.id_slide == id_slide).first()
    if slide is None:
        raise HTTPException(status_code=404, detail="Slide no encontrado")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(slide, campo, valor)
    db.commit()
    db.refresh(slide)
    return slide


@router.delete("/carousel/{id_slide}", status_code=200)
def eliminar_slide(
    id_slide: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Elimina un slide. Solo administradores."""
    slide = db.query(CarouselSlide).filter(CarouselSlide.id_slide == id_slide).first()
    if slide is None:
        raise HTTPException(status_code=404, detail="Slide no encontrado")
    db.delete(slide)
    db.commit()
    return {"mensaje": f"Slide {id_slide} eliminado"}


# ---------- FOTOS ----------
@router.get("/fotos", response_model=list[FotoRespuesta])
def listar_fotos(db: Session = Depends(get_db)):
    """Lista las fotos activas. Público."""
    return db.query(FotoCliente).filter(
        FotoCliente.activo == True
    ).order_by(FotoCliente.fecha_creacion.desc()).all()


@router.post("/fotos", response_model=FotoRespuesta, status_code=201)
def crear_foto(
    datos: FotoCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador, RolEnum.recepcionista)),
):
    """Sube una foto (su ruta). Admin y recepcionista."""
    foto = FotoCliente(**datos.model_dump())
    db.add(foto)
    db.commit()
    db.refresh(foto)
    return foto


@router.delete("/fotos/{id_foto}", status_code=200)
def eliminar_foto(
    id_foto: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador, RolEnum.recepcionista)),
):
    """Desactiva una foto. Admin y recepcionista."""
    foto = db.query(FotoCliente).filter(FotoCliente.id_foto == id_foto).first()
    if foto is None:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    foto.activo = False
    db.commit()
    return {"mensaje": f"Foto {id_foto} desactivada"}
