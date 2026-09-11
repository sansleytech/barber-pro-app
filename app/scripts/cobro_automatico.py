"""
Script de cobro automático diario.
Revisa qué suscripciones vencen HOY, y le cobra a la fuente de pago guardada
de cada barbería. Pensado para correr una vez al día como Cron Job en Railway.
"""
import crear_tablas  # asegura que todos los modelos estén registrados
from datetime import date, timedelta
from app.db.session import SessionLocal
from app.models.plan import Suscripcion, EstadoSuscripcionEnum, Plan
from app.models.fuente_pago import FuentePago
from app.models.barberia import Barberia
from app.models.usuario import Usuario, RolEnum
from app.models.pago import Pago, EstadoPagoEnum
import time
import time
from app.core.wompi_api import cobrar_fuente_pago, consultar_transaccion, consultar_transaccion
from app.core.notificaciones_helper import crear_notificacion
import uuid


def ejecutar():
    db = SessionLocal()
    hoy = date.today()

    vencidas = (
        db.query(Suscripcion)
        .filter(
            Suscripcion.estado == EstadoSuscripcionEnum.activa,
            Suscripcion.fecha_fin != None,
            Suscripcion.fecha_fin <= hoy,
        )
        .all()
    )

    print(f"[{hoy}] Suscripciones a procesar: {len(vencidas)}")

    for sus in vencidas:
        barberia = db.query(Barberia).filter(Barberia.id_barberia == sus.id_barberia).first()
        plan = db.query(Plan).filter(Plan.id_plan == sus.id_plan).first()
        fuente = (
            db.query(FuentePago)
            .filter(FuentePago.id_barberia == sus.id_barberia, FuentePago.activa == True)
            .first()
        )
        admin = (
            db.query(Usuario)
            .filter(Usuario.id_barberia == sus.id_barberia, Usuario.rol == RolEnum.administrador)
            .first()
        )

        if not barberia or not plan:
            continue

        if not fuente:
            crear_notificacion(
                db, sus.id_barberia,
                titulo="No pudimos renovar tu plan",
                mensaje="No tenés una tarjeta guardada para la renovación automática. Renová manualmente desde Planes.",
                tipo="alerta",
                enlace="/planes",
                email_destino=barberia.email_contacto or (admin.email if admin else None),
            )
            db.commit()
            print(f"  Barbería {sus.id_barberia}: sin tarjeta guardada, notificada")
            continue

        monto_en_centavos = int(plan.precio_mensual * 100)
        referencia = f"auto_{sus.id_barberia}_{uuid.uuid4().hex[:12]}"
        email_cliente = admin.email if admin and admin.email else barberia.email_contacto

        try:
            resultado = cobrar_fuente_pago(
                id_fuente_pago=fuente.id_fuente_wompi,
                monto_en_centavos=monto_en_centavos,
                referencia=referencia,
                email_cliente=email_cliente,
            )
            estado_actual = resultado.get("status")
            id_transaccion = resultado.get("id")

            # Si queda "pendiente", esperamos unos segundos y consultamos de nuevo (hasta 5 intentos).
            intentos = 0
            while estado_actual == "PENDING" and intentos < 5:
                time.sleep(3)
                resultado = consultar_transaccion(id_transaccion)
                estado_actual = resultado.get("status")
                intentos += 1

            print(f"  Resultado final Wompi: {estado_actual}")
            aprobado = estado_actual == "APPROVED"
        except Exception as e:
            aprobado = False
            print(f"  Error al cobrar barbería {sus.id_barberia}: {e}")

        nuevo_pago = Pago(
            id_barberia=sus.id_barberia,
            id_plan=plan.id_plan,
            referencia=referencia,
            monto=plan.precio_mensual,
            estado=EstadoPagoEnum.aprobado if aprobado else EstadoPagoEnum.rechazado,
        )
        db.add(nuevo_pago)

        if aprobado:
            sus.fecha_fin = hoy + timedelta(days=30)
            crear_notificacion(
                db, sus.id_barberia,
                titulo="Plan renovado automáticamente",
                mensaje=f"Se cobró tu plan {plan.nombre} correctamente. ¡Gracias por seguir con nosotros!",
                tipo="info",
                enlace="/dashboard",
                email_destino=email_cliente,
            )
            print(f"  Barbería {sus.id_barberia}: cobro APROBADO, renovada hasta {sus.fecha_fin}")
        else:
            sus.estado = EstadoSuscripcionEnum.vencida
            crear_notificacion(
                db, sus.id_barberia,
                titulo="No pudimos cobrar tu plan",
                mensaje="El cobro automático fue rechazado. Actualizá tu método de pago desde Facturación.",
                tipo="alerta",
                enlace="/facturacion",
                email_destino=email_cliente,
            )
            print(f"  Barbería {sus.id_barberia}: cobro RECHAZADO")

        db.commit()

    db.close()
    print("Cobro automático finalizado.")


if __name__ == "__main__":
    ejecutar()