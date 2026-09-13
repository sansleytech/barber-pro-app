"""Script puntual: prueba que Resend esté configurado y enviando bien."""
from dotenv import load_dotenv
load_dotenv()
from app.core.email import enviar_email

destino = input("Escribí el email donde querés recibir la prueba: ")
enviar_email(
    destinatario=destino,
    asunto="Prueba de Barber Pro",
    cuerpo_html="<h1>¡Funciona!</h1><p>Si ves esto, Resend está enviando correctamente.</p>",
)
print("Listo, revisá tu bandeja de entrada (y la carpeta de spam).")