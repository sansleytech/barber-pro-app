"""Endpoints de Códigos QR — multi-tenant."""
import io
import qrcode
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.codigo_qr import CodigoQR
from app.models.usuario import Usuario, RolEnum
from app.schemas.codigo_qr import QRCrear, QRRespuesta
from app.core.dependencies import get_barberia_actual, requiere_rol

router = APIRouter(prefix="/qr", tags=["Códigos QR"])


def generar_imagen_qr(texto: str) -> io.BytesIO:
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(texto); qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO(); img.save(buffer, format="PNG"); buffer.seek(0)
    return buffer


@router.get("", response_model=list[QRRespuesta])
def listar(db: Session = Depends(get_db),
           usuario: Usuario = Depends(requiere_rol(RolEnum.administrador))):
    return db.query(CodigoQR).filter(
        CodigoQR.id_barberia == usuario.id_barberia
    ).order_by(CodigoQR.fecha_creacion.desc()).all()


@router.post("", response_model=QRRespuesta, status_code=201)
def crear(datos: QRCrear, db: Session = Depends(get_db),
          usuario: Usuario = Depends(requiere_rol(RolEnum.administrador))):
    qr = CodigoQR(**datos.model_dump(), id_barberia=usuario.id_barberia)
    db.add(qr); db.commit(); db.refresh(qr)
    return qr


@router.get("/{id_qr}/imagen")
def obtener_imagen_qr(id_qr: int, db: Session = Depends(get_db),
                      id_barberia: int = Depends(get_barberia_actual)):
    qr = db.query(CodigoQR).filter(
        CodigoQR.id_qr == id_qr, CodigoQR.id_barberia == id_barberia
    ).first()
    if qr is None:
        raise HTTPException(status_code=404, detail="QR no encontrado")
    return StreamingResponse(generar_imagen_qr(qr.url_destino), media_type="image/png")
