"""Endpoints de Planes y Pagos: consultar planes, iniciar un cobro, recibir confirmación."""

import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario, RolEnum
from app.models.plan import Plan, Suscripcion, EstadoSuscripcionEnum
from app.models.pago import Pago, EstadoPagoEnum
from app.schemas.plan import PlanRespuesta
from app.schemas.pago import PagoIniciar, PagoRespuesta
from app.core.dependencies import requiere_rol, get_barberia_actual

router = APIRouter(tags=["Planes y Pagos"])


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
    """Crea un registro de pago pendiente. El frontend usa la 'referencia'
    devuelta para abrir el widget/checkout de la pasarela elegida."""
    plan = db.query(Plan).filter(Plan.id_plan == datos.id_plan, Plan.activo == True).first()
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan no encontrado")

    referencia = f"barberia_{id_barberia}_{uuid.uuid4().hex[:12]}"

    nuevo_pago = Pago(
        id_barberia=id_barberia,
        referencia=referencia,
        monto=plan.precio_mensual,
        estado=EstadoPagoEnum.pendiente,
    )
    db.add(nuevo_pago)
    db.commit()
    db.refresh(nuevo_pago)

    # TODO: acá va la llamada real a la API de la pasarela elegida, para
    # generar el link/widget de pago usando `referencia` y `plan.precio_mensual`.

    return nuevo_pago


@router.post("/pagos/webhook")
def webhook_pago(payload: dict, db: Session = Depends(get_db)):
    """Recibe la confirmación de la pasarela cuando un pago se aprueba/rechaza.
    Esqueleto: falta validar la firma del webhook y adaptar `payload` al
    formato real de la pasarela elegida antes de usar esto en producción.
    """
    # TODO: validar la firma/secreto del webhook (evita que cualquiera
    # llame a este endpoint y active suscripciones sin haber pagado).

    referencia = payload.get("referencia")
    estado_nuevo = payload.get("estado")  # "aprobado" | "rechazado" | "error"
    id_transaccion = payload.get("id_transaccion")

    pago = db.query(Pago).filter(Pago.referencia == referencia).first()
    if pago is None:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    pago.estado = estado_nuevo
    pago.id_transaccion_wompi = id_transaccion
    db.commit()

    if estado_nuevo == EstadoPagoEnum.aprobado:
        plan = db.query(Plan).filter(Plan.precio_mensual == pago.monto).first()
        hoy = date.today()
        suscripcion = Suscripcion(
            id_barberia=pago.id_barberia,
            id_plan=plan.id_plan if plan else None,
            estado=EstadoSuscripcionEnum.activa,
            fecha_inicio=hoy,
            fecha_fin=None,  # lo completa la tarea de cobro recurrente (paso 6)
        )
        db.add(suscripcion)
        db.flush()
        pago.id_suscripcion = suscripcion.id_suscripcion
        db.commit()

    return {"mensaje": "Webhook procesado"}