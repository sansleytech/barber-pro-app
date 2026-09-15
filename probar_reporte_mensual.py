"""Script puntual: prueba el reporte de fin de mes sin esperar al día 1.
Llama a la lógica directamente, saltándose el chequeo de fecha."""
import crear_tablas
from datetime import date, timedelta
from app.db.session import SessionLocal
from app.models.barberia import Barberia
from app.models.usuario import Usuario, RolEnum
from app.models.turno import Turno, EstadoTurnoEnum
from app.models.barbero import Barbero
from app.core.email import enviar_email

db = SessionLocal()
hoy = date.today()

# Para la prueba, usamos "los últimos 30 días" en vez de "el mes calendario pasado".
primer_dia_mes_pasado = hoy - timedelta(days=30)
ultimo_dia_mes_pasado = hoy

barberias = db.query(Barberia).filter(Barberia.activo == True).all()
enviados = 0

for b in barberias:
    admin = db.query(Usuario).filter(
        Usuario.id_barberia == b.id_barberia,
        Usuario.rol == RolEnum.administrador,
    ).first()
    if not admin or not admin.email:
        continue

    turnos_mes = db.query(Turno).filter(
        Turno.id_barberia == b.id_barberia,
        Turno.fecha >= primer_dia_mes_pasado,
        Turno.fecha <= ultimo_dia_mes_pasado,
        Turno.estado == EstadoTurnoEnum.completado,
    ).all()

    if not turnos_mes:
        print(f"Barbería {b.nombre}: sin turnos completados en los últimos 30 días, se salta")
        continue

    ingresos = sum(float(t.precio_total) for t in turnos_mes)
    propinas = sum(float(t.propina or 0) for t in turnos_mes)

    ranking = {}
    for t in turnos_mes:
        b_id = t.id_barbero
        ranking[b_id] = ranking.get(b_id, 0) + float(t.precio_total)
    mejor_barbero_id = max(ranking, key=ranking.get) if ranking else None
    mejor_barbero = db.query(Barbero).filter(Barbero.id_barbero == mejor_barbero_id).first() if mejor_barbero_id else None

    enviar_email(
        destinatario=admin.email,
        asunto="[PRUEBA] Tu resumen del mes",
        cuerpo_html=f"""
            <p>Hola {admin.nombre_usuario},</p>
            <p>Así te fue en los últimos 30 días en <strong>{b.nombre}</strong>:</p>
            <ul>
                <li><strong>{len(turnos_mes)}</strong> turnos completados</li>
                <li>Ingresos totales: <strong>${ingresos:,.0f}</strong></li>
                <li>Propinas totales: <strong>${propinas:,.0f}</strong></li>
                {f'<li>Barbero destacado: <strong>{mejor_barbero.nombre}</strong></li>' if mejor_barbero else ''}
            </ul>
        """,
    )
    enviados += 1
    print(f"Enviado a {admin.email} ({b.nombre})")

db.close()
print(f"Reportes enviados: {enviados}")