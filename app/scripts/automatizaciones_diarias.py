"""
Automatizaciones diarias por email. Corre una vez al día:
- Resumen diario para cada barbero (ingresos, turnos, propinas de ayer)
- Reactivación de clientes inactivos (60+ días sin visita)
- Vencimiento escalonado del plan (7 días, 1 día, día 0)
"""
import crear_tablas
from datetime import date, datetime, timedelta
from sqlalchemy import func
from app.db.session import SessionLocal
from app.models.turno import Turno, EstadoTurnoEnum
from app.models.usuario import Usuario, RolEnum
from app.models.barbero import Barbero
from app.models.cliente import Cliente
from app.models.barberia import Barberia
from app.models.plan import Suscripcion
from app.core.email import enviar_email


def resumen_diario_barberos(db):
    ayer = date.today() - timedelta(days=1)
    barberos = db.query(Barbero).filter(Barbero.activo == True).all()
    enviados = 0

    for b in barberos:
        usuario_b = db.query(Usuario).filter(
            Usuario.id_barbero == b.id_barbero,
            Usuario.rol == RolEnum.barbero,
        ).first()
        if not usuario_b or not usuario_b.email:
            continue

        turnos_ayer = db.query(Turno).filter(
            Turno.id_barbero == b.id_barbero,
            Turno.fecha == ayer,
            Turno.estado == EstadoTurnoEnum.completado,
        ).all()

        if not turnos_ayer:
            continue

        ingresos = sum(float(t.precio_total) for t in turnos_ayer)
        propinas = sum(float(t.propina or 0) for t in turnos_ayer)

        enviar_email(
            destinatario=usuario_b.email,
            asunto=f"Tu resumen de ayer: {len(turnos_ayer)} turnos",
            cuerpo_html=f"""
                <p>Hola {b.nombre},</p>
                <p>Así te fue ayer ({ayer.strftime('%d/%m/%Y')}):</p>
                <ul>
                    <li><strong>{len(turnos_ayer)}</strong> turnos completados</li>
                    <li>Ingresos generados: <strong>${ingresos:,.0f}</strong></li>
                    <li>Propinas: <strong>${propinas:,.0f}</strong></li>
                </ul>
                <p>¡Seguí así!</p>
            """,
        )
        enviados += 1

    print(f"Resúmenes de barbero enviados: {enviados}")


def reactivacion_clientes(db):
    hoy = date.today()
    limite = hoy - timedelta(days=60)
    ahora = datetime.now()
    hace_90_dias = ahora - timedelta(days=90)

    clientes = db.query(Cliente).filter(
        Cliente.activo == True,
        Cliente.email.isnot(None),
        Cliente.fecha_ultima_visita.isnot(None),
        Cliente.fecha_ultima_visita <= limite,
    ).filter(
        (Cliente.fecha_ultima_reactivacion.is_(None))
        | (Cliente.fecha_ultima_reactivacion <= hace_90_dias)
    ).all()

    enviados = 0
    for c in clientes:
        barberia = db.query(Barberia).filter(Barberia.id_barberia == c.id_barberia).first()
        enviar_email(
            destinatario=c.email,
            asunto=f"Te extrañamos en {barberia.nombre if barberia else 'tu barbería'}",
            cuerpo_html=f"""
                <p>Hola {c.primer_nombre},</p>
                <p>Hace un tiempo no te vemos por {barberia.nombre if barberia else 'la barbería'}. ¡Te esperamos para tu próximo corte!</p>
                <p><a href="https://barberproapp.online/portal/{barberia.subdominio if barberia else ''}/turno">Reservá tu turno acá</a></p>
            """,
        )
        c.fecha_ultima_reactivacion = ahora
        enviados += 1

    db.commit()
    print(f"Emails de reactivación enviados: {enviados}")


def vencimiento_plan_escalonado(db):
    hoy = date.today()
    suscripciones = db.query(Suscripcion).filter(Suscripcion.fecha_fin.isnot(None)).all()
    enviados = 0

    for s in suscripciones:
        dias_restantes = (s.fecha_fin - hoy).days
        if dias_restantes not in (7, 1, 0):
            continue

        barberia = db.query(Barberia).filter(Barberia.id_barberia == s.id_barberia).first()
        admin = db.query(Usuario).filter(
            Usuario.id_barberia == s.id_barberia,
            Usuario.rol == RolEnum.administrador,
        ).first()
        if not admin or not admin.email:
            continue

        if dias_restantes == 0:
            asunto = "Tu plan vence HOY"
            texto = "Tu plan vence hoy. Renová ahora para no perder acceso al sistema."
        elif dias_restantes == 1:
            asunto = "Tu plan vence mañana"
            texto = "Tu plan vence mañana. Renová para seguir usando Barber Pro sin interrupciones."
        else:
            asunto = f"Tu plan vence en {dias_restantes} días"
            texto = f"Tu plan vence en {dias_restantes} días. Te avisamos con tiempo para que renueves cuando quieras."

        enviar_email(
            destinatario=admin.email,
            asunto=asunto,
            cuerpo_html=f"""
                <p>Hola {admin.nombre_usuario},</p>
                <p>{texto}</p>
                <p><a href="https://barberproapp.online/planes">Ver mi plan</a></p>
            """,
        )
        enviados += 1

    print(f"Avisos de vencimiento enviados: {enviados}")


def ejecutar():
    db = SessionLocal()
    print(f"[{datetime.now()}] Ejecutando automatizaciones diarias...")
    resumen_diario_barberos(db)
    reactivacion_clientes(db)
    vencimiento_plan_escalonado(db)
    db.close()
    print("Automatizaciones diarias finalizadas.")


if __name__ == "__main__":
    ejecutar()