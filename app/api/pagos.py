"""Endpoints de Planes y Pagos: consultar planes, iniciar un cobro con Wompi, recibir confirmación."""

import hashlib
import os
import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario, RolEnum
from app.models.plan import Plan, Suscripcion, EstadoSuscripcionEnum
from app.models.pago import Pago, EstadoPagoEnum
from app.schemas.plan import PlanRespuesta
from app.schemas.pago import PagoIniciar, PagoRespuesta
from app.core.dependencies import requiere_rol, get_barberia_actual

router = APIRouter(tags=["Planes y Pagos"])

WOMPI_PUBLIC_KEY = os.getenv("WOMPI_PUBLIC_KEY", "")
WOMPI_INTEGRITY_SECRET = os.getenv("WOMPI_INTEGRITY_SECRET", "")
WOMPI_EVENTS_SECRET = os.getenv("WOMPI_EVENTS_SECRET", "")
WOMPI_REDIRECT_URL = os.getenv("WOMPI_REDIRECT_URL", "http://localhost:5173/pago/resultado")


@router.get("/planes", response_model=list[PlanRespuesta])
def listar_planes_disponibles(db: Session = Depends(get_db)):
    """Lista los planes activos, para la pantalla pública de precios."""
    return (
        db.query(Plan)
        .filter(Plan.activo == True)
        .order_by(Plan.orden)
        .all()
    )


@router.post("/pagos/iniciar", response_model=PagoRespuesta, status_code=201)
def iniciar_pago(
    datos: PagoIniciar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Crea un registro de pago pendiente y devuelve los datos para armar el
    checkout de Wompi (referencia, monto en centavos, firma de integridad)."""
    plan = db.query(Plan).filter(Plan.id_plan == datos.id_plan, Plan.activo == True).first()
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan no encontrado")

    if not WOMPI_PUBLIC_KEY or not WOMPI_INTEGRITY_SECRET:
        raise HTTPException(
            status_code=500,
            detail="La pasarela de pago no está configurada (faltan variables de entorno de Wompi)",
        )

    referencia = f"barberia_{id_barberia}_{uuid.uuid4().hex[:12]}"
    monto_en_centavos = int(plan.precio_mensual * 100)
    moneda = "COP"

    # Firma de integridad: SHA256(referencia + monto_en_centavos + moneda + secreto)
    cadena_firma = f"{referencia}{monto_en_centavos}{moneda}{WOMPI_INTEGRITY_SECRET}"
    firma_integridad = hashlib.sha256(cadena_firma.encode("utf-8")).hexdigest()

    nuevo_pago = Pago(
        id_barberia=id_barberia,
        id_plan=plan.id_plan,
        referencia=referencia,
        monto=plan.precio_mensual,
        estado=EstadoPagoEnum.pendiente,
    )
    db.add(nuevo_pago)
    db.commit()
    db.refresh(nuevo_pago)

    # Datos que el frontend necesita para armar el formulario de checkout de Wompi
    respuesta = PagoRespuesta.model_validate(nuevo_pago).model_dump()
    respuesta["checkout"] = {
        "public_key": WOMPI_PUBLIC_KEY,
        "currency": moneda,
        "amount_in_cents": monto_en_centavos,
        "reference": referencia,
        "signature_integrity": firma_integridad,
        "redirect_url": WOMPI_REDIRECT_URL,
    }
    return respuesta


@router.get("/pagos/estado/{referencia}", response_model=PagoRespuesta)
def estado_pago(
    referencia: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Consulta el estado actual de un pago por su referencia.
    El frontend usa esto tras volver del checkout, ya que el webhook puede
    tardar unos segundos en procesarse."""
    pago = (
        db.query(Pago)
        .filter(Pago.referencia == referencia, Pago.id_barberia == id_barberia)
        .first()
    )
    if pago is None:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    return pago


@router.post("/pagos/webhook")
async def webhook_pago(request: Request, db: Session = Depends(get_db)):
    """Recibe la confirmación de Wompi cuando una transacción cambia de estado.
    Valida la firma del evento antes de hacer nada, para que nadie pueda
    activar una suscripción sin haber pagado de verdad."""
    payload = await request.json()

    if not WOMPI_EVENTS_SECRET:
        raise HTTPException(status_code=500, detail="Falta configurar el secreto de eventos de Wompi")

    transaccion = payload.get("data", {}).get("transaction", {})
    timestamp = payload.get("timestamp")
    firma_recibida = payload.get("signature", {}).get("checksum")
    propiedades = payload.get("signature", {}).get("properties", [])

    if not transaccion or not timestamp or not firma_recibida:
        raise HTTPException(status_code=400, detail="Payload de webhook incompleto")

    # Arma la cadena concatenando los valores de las propiedades que Wompi indica,
    # en el orden que Wompi indica (normalmente id, status, amount_in_cents).
    valores = []
    for prop in propiedades:
        clave = prop.split(".")[-1]
        valores.append(str(transaccion.get(clave, "")))
    cadena = "".join(valores) + str(timestamp) + WOMPI_EVENTS_SECRET
    firma_calculada = hashlib.sha256(cadena.encode("utf-8")).hexdigest()

    if firma_calculada != firma_recibida:
        raise HTTPException(status_code=403, detail="Firma del webhook inválida")

    referencia = transaccion.get("reference")
    estado_wompi = transaccion.get("status")  # APPROVED | DECLINED | VOIDED | ERROR
    id_transaccion = transaccion.get("id")

    pago = db.query(Pago).filter(Pago.referencia == referencia).first()
    if pago is None:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    mapa_estados = {
        "APPROVED": EstadoPagoEnum.aprobado,
        "DECLINED": EstadoPagoEnum.rechazado,
        "VOIDED": EstadoPagoEnum.rechazado,
        "ERROR": EstadoPagoEnum.error,
    }
    pago.estado = mapa_estados.get(estado_wompi, EstadoPagoEnum.error)
    pago.id_transaccion_wompi = id_transaccion
    pago.metodo_pago = transaccion.get("payment_method_type")
    db.commit()

    if pago.estado == EstadoPagoEnum.aprobado and pago.id_plan:
        hoy = date.today()
        suscripcion = Suscripcion(
            id_barberia=pago.id_barberia,
            id_plan=pago.id_plan,
            estado=EstadoSuscripcionEnum.activa,
            fecha_inicio=hoy,
            fecha_fin=None,
        )
        db.add(suscripcion)
        db.flush()
        pago.id_suscripcion = suscripcion.id_suscripcion
        db.commit()

    return {"mensaje": "Webhook procesado"}