"""Función central para crear notificaciones desde cualquier módulo del sistema."""
from sqlalchemy.orm import Session
from app.models.notificacion import Notificacion
from app.core.email import enviar_email


def crear_notificacion(
    db: Session,
    id_barberia: int,
    titulo: str,
    mensaje: str,
    tipo: str = "info",
    enlace: str | None = None,
    id_usuario: int | None = None,
    email_destino: str | None = None,
):
    """Crea una fila de notificación y, si se pasa un email, también la manda por correo."""
    notif = Notificacion(
        id_barberia=id_barberia,
        titulo=titulo,
        mensaje=mensaje,
        tipo=tipo,
        enlace=enlace,
        id_usuario=id_usuario,
    )
    db.add(notif)
    db.flush()

    if email_destino:
        cuerpo = f"<h2>{titulo}</h2><p>{mensaje}</p>"
        enviar_email(email_destino, titulo, cuerpo)

    return notif