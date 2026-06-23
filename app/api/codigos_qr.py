"""Endpoints de códigos QR."""

import io
import qrcode
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.codigo_qr import CodigoQR
from app.models.usuario import Usuario, RolEnum
from app.schemas.codigo_qr import QRCrear, QRRespuesta
from app.core.dependencies import requiere_rol

router = APIRouter(prefix="/qr", tags=["Códigos QR"])


def generar_imagen_qr(texto: str) -> io.BytesIO:
    """Genera una imagen PNG de un QR a partir de un texto/URL."""
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(texto)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer


@router.get("", response_model=list[QRRespuesta])
def listar_qr(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Lista los códigos QR registrados. Solo admin."""
    return db.query(CodigoQR).order_by(CodigoQR.fecha_creacion.desc()).all()


@router.post("", response_model=QRRespuesta, status_code=201)
def crear_qr(
    datos: QRCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Registra un código QR. Solo admin."""
    qr = CodigoQR(**datos.model_dump())
    db.add(qr)
    db.commit()
    db.refresh(qr)
    return qr


@router.get("/{id_qr}/imagen")
def obtener_imagen_qr(id_qr: int, db: Session = Depends(get_db)):
    """Devuelve la imagen PNG escaneable del QR. Público."""
    qr = db.query(CodigoQR).filter(CodigoQR.id_qr == id_qr).first()
    if qr is None:
        raise HTTPException(status_code=404, detail="QR no encontrado")
    imagen = generar_imagen_qr(qr.url_destino)
    return StreamingResponse(imagen, media_type="image/png")


@router.get("/generar-directo")
def generar_qr_directo(url: str):
    """Genera un QR al vuelo desde una URL, sin guardarlo. Público."""
    imagen = generar_imagen_qr(url)
    return StreamingResponse(imagen, media_type="image/png")
