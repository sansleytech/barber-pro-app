"""Endpoint para subir imágenes (almacenamiento local)."""
import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.models.usuario import Usuario
from app.core.dependencies import get_usuario_actual

router = APIRouter(prefix="/upload", tags=["Subida de archivos"])

# Carpeta donde se guardan las imágenes
CARPETA_UPLOADS = "app/uploads"
os.makedirs(CARPETA_UPLOADS, exist_ok=True)

# Extensiones de imagen permitidas
EXTENSIONES_OK = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
TAMANO_MAX = 5 * 1024 * 1024  # 5 MB


@router.post("")
async def subir_imagen(
    archivo: UploadFile = File(...),
    usuario: Usuario = Depends(get_usuario_actual),
):
    """Sube una imagen y devuelve su URL. Requiere estar logueado."""
    # Validar extensión
    nombre = archivo.filename or ""
    ext = os.path.splitext(nombre)[1].lower()
    if ext not in EXTENSIONES_OK:
        raise HTTPException(status_code=400, detail="Formato no permitido. Usá jpg, png, webp o gif.")

    # Leer el contenido y validar tamaño
    contenido = await archivo.read()
    if len(contenido) > TAMANO_MAX:
        raise HTTPException(status_code=400, detail="La imagen es muy grande (máximo 5 MB).")

    # Nombre único para no pisar archivos
    nombre_unico = f"{uuid.uuid4().hex}{ext}"
    ruta = os.path.join(CARPETA_UPLOADS, nombre_unico)
    with open(ruta, "wb") as f:
        f.write(contenido)

    # URL pública (servida como estático)
    url = f"http://localhost:8000/uploads/{nombre_unico}"
    return {"url": url, "nombre": nombre_unico}
