"""
Script de recordatorios de turno.
Corre cada 30 minutos: busca turnos que empiezan en la próxima 1-2 horas
y todavía no tienen el recordatorio enviado, y les manda un email al cliente.
"""
import crear_tablas
from datetime import date, datetime, timedelta
from app.db.session import SessionLocal
from app.models.turno import Turno, EstadoTurnoEnum
from app.models.cliente import Cliente
from app.models.barbero import Barbero
from app.core.email import enviar_email


def ejecutar():
    db = SessionLocal()
    ahora = datetime.now()
    hoy = date.today()

    ventana_desde = ahora + timedelta(hours=1)
    ventana_hasta = ahora + timedelta(hours=2)

    turnos = (
        db.query(Turno)
        .filter(
            Turno.fecha == hoy,
            Turno.estado.in_([EstadoTurnoEnum.pendiente, EstadoTurnoEnum.confirmado]),
            Turno.recordatorio_enviado == False,
        )
        .all()
    )

    print(f"[{ahora}] Turnos candidatos hoy: {len(turnos)}")
    enviados = 0

    for t in turnos:
        inicio_turno = datetime.combine(t.fecha, t.hora_inicio)
        print(f"  Turno {t.id_turno}: hora {inicio_turno}, ventana {ventana_desde} - {ventana_hasta}")
        if not (ventana_desde <= inicio_turno <= ventana_hasta):
            print("    -> fuera de la ventana, se salta")
            continue

        cliente = db.query(Cliente).filter(Cliente.id_cliente == t.id_cliente).first()
        barbero = db.query(Barbero).filter(Barbero.id_barbero == t.id_barbero).first()

        print(f"    cliente encontrado: {cliente.primer_nombre if cliente else None}, email: {cliente.email if cliente else None}")

        if cliente and cliente.email:
            enviar_email(
                destinatario=cliente.email,
                asunto="Recordatorio: tu turno es pronto",
                cuerpo_html=f"""
                    <p>Hola {cliente.primer_nombre},</p>
                    <p>Te recordamos tu turno hoy a las <strong>{t.hora_inicio.strftime('%H:%M')}</strong>
                    {f'con {barbero.nombre}' if barbero else ''}.</p>
                    <p>¡Te esperamos!</p>
                """,
            )
            enviados += 1

        t.recordatorio_enviado = True
        db.commit()

    print(f"Recordatorios enviados: {enviados}")
    db.close()


if __name__ == "__main__":
    ejecutar()