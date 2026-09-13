"""Endpoint de registro autoservicio de barberías (SaaS)."""

from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.barberia import Barberia, EstadoBarberiaEnum
from app.models.plan import Plan, Suscripcion, EstadoSuscripcionEnum
from app.models.usuario import Usuario, RolEnum
from app.schemas.registro import RegistroBarberia, RegistroRespuesta
from app.core.security import hashear_password

router = APIRouter(prefix="/registro", tags=["Registro SaaS"])

DIAS_TRIAL = 14  # duración de la prueba gratuita


@router.post("", response_model=RegistroRespuesta, status_code=201)
def registrar_barberia(datos: RegistroBarberia, db: Session = Depends(get_db)):
    """Registra una barbería nueva con su admin inicial y un trial. Público."""

    # 1. Verificar que el subdominio no esté tomado
    existe = db.query(Barberia).filter(Barberia.subdominio == datos.subdominio).first()
    if existe:
        raise HTTPException(
            status_code=409, detail="Ese subdominio ya está en uso, elegí otro"
        )

    # 2. Buscar el plan Trial
    plan_trial = db.query(Plan).filter(Plan.nombre == "Trial").first()
    if plan_trial is None:
        raise HTTPException(status_code=500, detail="No hay plan Trial configurado")

    try:
        # 3. Crear la barbería (en estado trial)
        hoy = date.today()
        barberia = Barberia(
            subdominio=datos.subdominio,
            nombre=datos.nombre_barberia,
            email_contacto=datos.email_contacto,
            telefono=datos.telefono,
            estado=EstadoBarberiaEnum.trial,
            trial_hasta=hoy + timedelta(days=DIAS_TRIAL),
        )
        db.add(barberia)
        db.flush()  # para obtener el id_barberia

        # 4. Crear el usuario admin de esa barbería
        admin = Usuario(
            nombre_usuario=datos.nombre_admin,
            email=datos.email_admin,
            password_hash=hashear_password(datos.password_admin),
            rol=RolEnum.administrador,
            id_barberia=barberia.id_barberia,
            activo=True,
        )
        db.add(admin)

        # 5. Crear la suscripción trial
        suscripcion = Suscripcion(
            id_barberia=barberia.id_barberia,
            id_plan=plan_trial.id_plan,
            estado=EstadoSuscripcionEnum.trial,
            fecha_inicio=hoy,
            fecha_fin=hoy + timedelta(days=DIAS_TRIAL),
        )
        db.add(suscripcion)

        db.commit()
        db.refresh(barberia)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar: {str(e)}")

    from app.core.email import enviar_email
    if admin.email:
        enviar_email(
            destinatario=admin.email,
            asunto=f"¡Bienvenido a Barber Pro, {admin.nombre_usuario}! 💈",
            cuerpo_html=f"""
                <h2>¡Tu barbería ya está lista!</h2>
                <p>Hola {admin.nombre_usuario}, creamos <strong>{barberia.nombre}</strong> con éxito.</p>
                <p>Tenés 14 días de prueba gratis. Para arrancar con el pie derecho:</p>
                <ol>
                    <li>Cargá tus servicios y precios</li>
                    <li>Agregá a tus barberos</li>
                    <li>Personalizá tu portal público en Configuración</li>
                    <li>Compartí tu link: barberproapp.online/portal/{barberia.subdominio}</li>
                </ol>
                <p><a href="https://barberproapp.online/login">Entrar a mi panel</a></p>
            """,
        )

    return RegistroRespuesta(
        mensaje="Barbería registrada con éxito. Tu prueba gratuita es de 14 días.",
        id_barberia=barberia.id_barberia,
        subdominio=barberia.subdominio,
        nombre_usuario_admin=admin.nombre_usuario,
    )
