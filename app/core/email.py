"""Envío de emails vía Resend. Si falla, no debe tumbar la operación principal."""
import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY", "")
REMITENTE = os.getenv("RESEND_FROM", "Barber Pro <onboarding@resend.dev>")


def enviar_email(destinatario: str, asunto: str, cuerpo_html: str):
    if not resend.api_key or not destinatario:
        print(f"AVISO: no se envió email a {destinatario} — falta RESEND_API_KEY o destinatario vacío")
        return
    html_completo = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>{cuerpo_html}</body>
</html>"""
    try:
        resend.Emails.send({
            "from": REMITENTE,
            "to": destinatario,
            "subject": asunto,
            "html": html_completo,
        })
    except Exception as e:
        print(f"ERROR AL ENVIAR EMAIL a {destinatario}: {e}")