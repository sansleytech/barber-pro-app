"""Envío de emails vía Resend. Si falla, no debe tumbar la operación principal."""
import os
import resend

resend.api_key = os.getenv("RESEND_API_KEY", "")
REMITENTE = os.getenv("RESEND_FROM", "Barber Pro <onboarding@resend.dev>")


def enviar_email(destinatario: str, asunto: str, cuerpo_html: str):
    if not resend.api_key or not destinatario:
        return
    try:
        resend.Emails.send({
            "from": REMITENTE,
            "to": destinatario,
            "subject": asunto,
            "html": cuerpo_html,
        })
    except Exception:
        pass