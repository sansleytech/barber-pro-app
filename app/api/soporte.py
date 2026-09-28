"""Soporte: el cliente (usuario de una barbería) le escribe al proveedor."""

import os
from html import escape

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.barberia import Barberia
from app.models.plan import Suscripcion
from app.core.dependencies import get_usuario_actual
from app.core.email import enviar_email

router = APIRouter(prefix="/soporte", tags=["Soporte"])

# Email donde te llegan los mensajes. Podés cambiarlo con la variable
# SOPORTE_EMAIL en Railway, sin tocar el código.
SOPORTE_EMAIL = os.getenv("SOPORTE_EMAIL", "sansley.tech-sol@outlook.com")


class MensajeSoporte(BaseModel):
    asunto: str
    mensaje: str
    email_respuesta: str | None = None


def _a_html(texto: str) -> str:
    """Escapa el texto del usuario y conserva los saltos de línea."""
    return escape(texto).replace("\n", "<br>")


@router.post("")
def enviar_mensaje_soporte(
    datos: MensajeSoporte,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_actual),
):
    """Recibe un mensaje de un usuario logueado y se lo manda al proveedor por email."""
    asunto = datos.asunto.strip()
    mensaje = datos.mensaje.strip()

    if len(asunto) < 3 or len(asunto) > 120:
        raise HTTPException(status_code=400, detail="El asunto debe tener entre 3 y 120 caracteres")
    if len(mensaje) < 10 or len(mensaje) > 2000:
        raise HTTPException(status_code=400, detail="El mensaje debe tener entre 10 y 2000 caracteres")

    barberia = None
    plan = "sin plan"
    if usuario.id_barberia:
        barberia = db.query(Barberia).filter(Barberia.id_barberia == usuario.id_barberia).first()
        suscripcion = (
            db.query(Suscripcion)
            .filter(Suscripcion.id_barberia == usuario.id_barberia)
            .order_by(Suscripcion.fecha_creacion.desc())
            .first()
        )
        if suscripcion and suscripcion.plan:
            plan = suscripcion.plan.nombre

    email_respuesta = (datos.email_respuesta or usuario.email or "").strip()

    cuerpo = f"""
        <h3>Nuevo mensaje de soporte</h3>
        <p><strong>Barbería:</strong> {escape(barberia.nombre) if barberia else "—"}
           ({escape(barberia.subdominio) if barberia else "—"})</p>
        <p><strong>Plan:</strong> {escape(plan)}</p>
        <p><strong>Usuario:</strong> {escape(usuario.nombre_usuario)} ({usuario.rol.value})</p>
        <p><strong>Email para responder:</strong> {escape(email_respuesta) if email_respuesta else "no indicó"}</p>
        <hr>
        <p><strong>{escape(asunto)}</strong></p>
        <p>{_a_html(mensaje)}</p>
    """
    enviar_email(
        destinatario=SOPORTE_EMAIL,
        asunto=f"[Soporte Barber Pro] {asunto}",
        cuerpo_html=cuerpo,
    )

    # Confirmación al usuario, si dejó un email válido.
    if "@" in email_respuesta:
        enviar_email(
            destinatario=email_respuesta,
            asunto="Recibimos tu mensaje — Barber Pro",
            cuerpo_html=f"""
                <p>Hola {escape(usuario.nombre_usuario)},</p>
                <p>Recibimos tu mensaje sobre "<strong>{escape(asunto)}</strong>". Te vamos a responder lo antes posible.</p>
                <p>Equipo de Barber Pro</p>
            """,
        )

    return {"mensaje": "Mensaje enviado. Te vamos a responder lo antes posible."}