"""Endpoints de autenticación (login) — multi-tenant."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.barberia import Barberia
from app.models.plan import Suscripcion
from app.models.permiso_rol import PermisoRol
from app.core.security import verificar_password, crear_token, hashear_password, hashear_password
from app.core.dependencies import get_usuario_actual

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
            "subdominio": barberia.subdominio,
            "barberia_nit": barberia.nit,
            "barberia_direccion": barberia.direccion,
            "barberia_telefono": barberia.telefono,
            "barberia_logo": barberia.logo,
            "barberia_estado": barberia.estado.value,
            "trial_hasta": barberia.trial_hasta.isoformat() if barberia.trial_hasta else None,
            "suscripcion_estado": suscripcion.estado.value if suscripcion else None,
            "suscripcion_fin": suscripcion.fecha_fin.isoformat() if suscripcion and suscripcion.fecha_fin else None,
            "id_plan_actual": suscripcion.id_plan if suscripcion else None,
            "nombre_plan": suscripcion.plan.nombre if suscripcion and suscripcion.plan else None,
        },
    }


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

import secrets
from datetime import timedelta
from pydantic import BaseModel
from app.core.email import enviar_email

FRONTEND_URL = "https://barberproapp.online"


class SolicitarReset(BaseModel):
    subdominio: str
    email: str


class ConfirmarReset(BaseModel):
    token: str
    password_nueva: str


@router.post("/olvide-password")
def solicitar_reset_password(datos: SolicitarReset, db: Session = Depends(get_db)):
    """Genera un token temporal y manda un email con el link para resetear
    la contraseña. Siempre responde igual, exista o no el usuario, para no
    revelar si un email está registrado."""
    print(f"DEBUG: subdominio recibido='{datos.subdominio}', email recibido='{datos.email}'")

    barberia = db.query(Barberia).filter(Barberia.subdominio == datos.subdominio.lower().strip()).first()
    mensaje_generico = {"mensaje": "Si el email existe, te enviamos un link para restablecer tu contraseña."}

    if barberia is None:
        print("DEBUG: no se encontró ninguna barbería con ese subdominio")
        return mensaje_generico

    print(f"DEBUG: barbería encontrada, id={barberia.id_barberia}")

    usuario = db.query(Usuario).filter(
        Usuario.email == datos.email.strip(),
        Usuario.id_barberia == barberia.id_barberia,
        Usuario.activo == True,
    ).first()

    if usuario is None:
        print("DEBUG: no se encontró ningún usuario con ese email en esa barbería")
        return mensaje_generico

    print(f"DEBUG: usuario encontrado, id={usuario.id_usuario}, mandando email...")

    token = secrets.token_urlsafe(32)
    usuario.reset_token = token
    usuario.reset_token_expira = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()

    link = f"{FRONTEND_URL}/restablecer-password?token={token}"
    enviar_email(
        destinatario=usuario.email,
        asunto="Restablecé tu contraseña — Barber Pro",
        cuerpo_html=f"""
            <p>Hola {usuario.nombre_usuario},</p>
            <p>Recibimos una solicitud para restablecer tu contraseña en Barber Pro.</p>
            <p><a href="{link}">Hacé clic acá para elegir una contraseña nueva</a></p>
            <p>Este link vence en 1 hora. Si no pediste esto, podés ignorar el correo.</p>
        """,
    )

    return mensaje_generico


@router.post("/restablecer-password")
def confirmar_reset_password(datos: ConfirmarReset, db: Session = Depends(get_db)):
    """Valida el token y cambia la contraseña."""
    if len(datos.password_nueva) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")

    usuario = db.query(Usuario).filter(Usuario.reset_token == datos.token).first()
    if usuario is None or usuario.reset_token_expira is None:
        raise HTTPException(status_code=400, detail="El link no es válido o ya fue usado")

    expira = usuario.reset_token_expira
    if expira.tzinfo is None:
        expira = expira.replace(tzinfo=timezone.utc)
    if expira < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="El link venció, pedí uno nuevo")

    usuario.password_hash = hashear_password(datos.password_nueva)
    usuario.reset_token = None
    usuario.reset_token_expira = None
    db.commit()

    return {"mensaje": "Contraseña actualizada correctamente"}