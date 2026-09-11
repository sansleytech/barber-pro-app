"""Endpoints de autenticación (login) — multi-tenant."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.barberia import Barberia
from app.models.plan import Suscripcion
from app.core.security import verificar_password, crear_token

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login")
def login(
    datos: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Login multi-tenant. Requiere el subdominio de la barbería.
    En el formulario OAuth2, el subdominio va en el campo 'client_id'.
    (username = usuario, password = contraseña, client_id = subdominio)
    """
    subdominio = (datos.client_id or "").lower().strip()

    if not subdominio:
        raise HTTPException(
            status_code=400,
            detail="Falta el subdominio de la barbería (ponelo en el campo client_id)",
        )

    # 1. Buscar la barbería por su subdominio
    barberia = db.query(Barberia).filter(Barberia.subdominio == subdominio).first()
    if barberia is None:
        raise HTTPException(status_code=404, detail="Barbería no encontrada")

    if not barberia.activo or barberia.estado.value == "cancelada":
        raise HTTPException(status_code=403, detail="La barbería no está activa")

    # 2. Buscar el usuario DENTRO de esa barbería
    usuario = db.query(Usuario).filter(
        Usuario.nombre_usuario == datos.username,
        Usuario.id_barberia == barberia.id_barberia,
    ).first()

    # Mismo mensaje para usuario inexistente o clave mala
    if usuario is None or not verificar_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if not usuario.activo:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    # 3. Actualizar datos de acceso
    usuario.ultimo_acceso = datetime.now(timezone.utc)
    usuario.cantidad_logins = (usuario.cantidad_logins or 0) + 1
    db.commit()

    # 4. El token lleva id, rol Y la barbería (esto es lo nuevo del multi-tenant)
    token = crear_token({
        "sub": str(usuario.id_usuario),
        "rol": usuario.rol.value,
        "id_barberia": barberia.id_barberia,
        "subdominio": barberia.subdominio,
    })

    # 5. Buscamos la suscripción más reciente, para informar al frontend
    # cuántos días le quedan (trial o plan pago).
    suscripcion = (
        db.query(Suscripcion)
        .filter(Suscripcion.id_barberia == barberia.id_barberia)
        .order_by(Suscripcion.fecha_creacion.desc())
        .first()
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "id_usuario": usuario.id_usuario,
            "nombre_usuario": usuario.nombre_usuario,
            "rol": usuario.rol.value,
            "id_barbero": usuario.id_barbero,
            "super_admin": usuario.super_admin,
            "id_barberia": barberia.id_barberia,
            "barberia": barberia.nombre,
            "barberia_nit": barberia.nit,
            "barberia_direccion": barberia.direccion,
            "barberia_telefono": barberia.telefono,
            "barberia_logo": barberia.logo,
            "barberia_estado": barberia.estado.value,
            "trial_hasta": barberia.trial_hasta.isoformat() if barberia.trial_hasta else None,
            "suscripcion_estado": suscripcion.estado.value if suscripcion else None,
            "suscripcion_fin": suscripcion.fecha_fin.isoformat() if suscripcion and suscripcion.fecha_fin else None,
            "id_plan_actual": suscripcion.id_plan if suscripcion else None,
        },
    }

    from app.models.permiso_rol import PermisoRol
from app.core.dependencies import get_usuario_actual


@router.get("/permisos-vigentes")
def permisos_vigentes(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_actual),
):
    """Devuelve el mapa de permisos actual, para que el frontend sepa
    qué rutas puede ver cada rol (reemplaza el permiso.js fijo)."""
    permisos = db.query(PermisoRol).all()
    return {
        p.ruta: {
            "administrador": p.administrador,
            "recepcionista": p.recepcionista,
            "barbero": p.barbero,
        }
        for p in permisos
    }