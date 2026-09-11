"""Llamadas directas a la API privada de Wompi (fuentes de pago, cobros recurrentes)."""
import os
import hashlib
import requests
from dotenv import load_dotenv

load_dotenv()

WOMPI_PUBLIC_KEY = os.getenv("WOMPI_PUBLIC_KEY", "")
WOMPI_PRIVATE_KEY = os.getenv("WOMPI_PRIVATE_KEY", "")
WOMPI_INTEGRITY_SECRET = os.getenv("WOMPI_INTEGRITY_SECRET", "")
WOMPI_BASE_URL = "https://api-sandbox.wompi.co/v1" if "test" in WOMPI_PRIVATE_KEY else "https://production.wompi.co/v1"


def _obtener_acceptance_token() -> str:
    respuesta = requests.get(f"{WOMPI_BASE_URL}/merchants/{WOMPI_PUBLIC_KEY}", timeout=15)
    respuesta.raise_for_status()
    return respuesta.json()["data"]["presigned_acceptance"]["acceptance_token"]


def crear_fuente_pago(token_tarjeta: str, email_cliente: str) -> dict:
    acceptance_token = _obtener_acceptance_token()

    respuesta = requests.post(
        f"{WOMPI_BASE_URL}/payment_sources",
        headers={"Authorization": f"Bearer {WOMPI_PRIVATE_KEY}"},
        json={
            "type": "CARD",
            "token": token_tarjeta,
            "customer_email": email_cliente,
            "acceptance_token": acceptance_token,
        },
        timeout=15,
    )
    if not respuesta.ok:
        print("ERROR WOMPI payment_sources:", respuesta.status_code, respuesta.text)
    respuesta.raise_for_status()
    return respuesta.json()["data"]


def cobrar_fuente_pago(id_fuente_pago: int, monto_en_centavos: int, referencia: str, email_cliente: str) -> dict:
    """Cobra directamente a una fuente de pago guardada, sin que el cliente
    esté presente. Usado por el cron de cobro automático mensual."""
    moneda = "COP"
    cadena_firma = f"{referencia}{monto_en_centavos}{moneda}{WOMPI_INTEGRITY_SECRET}"
    firma_integridad = hashlib.sha256(cadena_firma.encode("utf-8")).hexdigest()

    respuesta = requests.post(
        f"{WOMPI_BASE_URL}/transactions",
        headers={"Authorization": f"Bearer {WOMPI_PRIVATE_KEY}"},
        json={
            "amount_in_cents": monto_en_centavos,
            "currency": moneda,
            "customer_email": email_cliente,
            "payment_source_id": id_fuente_pago,
            "reference": referencia,
            "recurrent": True,
            "signature": firma_integridad,
            "payment_method": {
                "installments": 1,
            },
        },
        timeout=15,
    )
    if not respuesta.ok:
        print("ERROR WOMPI transactions:", respuesta.status_code, respuesta.text)
    respuesta.raise_for_status()
    return respuesta.json()["data"]


def consultar_transaccion(id_transaccion: str) -> dict:
    """Consulta el estado actual de una transacción por su id."""
    respuesta = requests.get(
        f"{WOMPI_BASE_URL}/transactions/{id_transaccion}",
        headers={"Authorization": f"Bearer {WOMPI_PRIVATE_KEY}"},
        timeout=15,
    )
    respuesta.raise_for_status()
    return respuesta.json()["data"]