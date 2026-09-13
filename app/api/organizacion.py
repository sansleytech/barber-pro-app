"""Endpoints de organizaciones (cadenas de barberías, Plan Premium).
Usa el mismo login/token que el resto del panel — no hace falta otro usuario."""

from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.barberia import Barberia, EstadoBarberiaEnum
from app.models.plan import Plan, Suscripcion, EstadoSuscripcionEnum
from app.models.usuario import Usuario, RolEnum
from app.core.dependencies import requiere_rol, get_barberia_actual
from app.core.security import hashear_password
from app.models.organizacion import Organizacion

router = APIRouter(prefix="/organizacion", tags=["Organizaciones"])


class CrearSede(BaseModel):
    nombre_barberia: str
    subdominio: str
    email_contacto: str | None = None
    telefono: str | None = None
    nombre_admin: str
    email_admin: str
    password_admin: str


def _validar_es_premium_y_tiene_organizacion(db: Session, id_barberia: int) -> int:
    """Confirma que la barbería del usuario sea Premium y devuelve su id_organizacion.
    Si no tiene organización todavía (es su primera sede), la crea sola."""
    suscripcion = (
        db.query(Suscripcion)
        .filter(Suscripcion.id_barberia == id_barberia)
        .order_by(Suscripcion.fecha_creacion.desc())
        .first()
    )
    if not suscripcion or not suscripcion.plan or suscripcion.plan.nombre != "Premium":
        raise HTTPException(status_code=403, detail="Esta función solo está disponible en el plan Premium")

    barberia = db.query(Barberia).filter(Barberia.id_barberia == id_barberia).first()
    if barberia.id_organizacion is None:
        nueva_org = Organizacion(nombre=f"Cadena {barberia.nombre}")
        db.add(nueva_org)
        db.flush()
        barberia.id_organizacion = nueva_org.id_organizacion
        db.commit()

    return barberia.id_organizacion


@router.get("/mis-sedes")
def listar_mis_sedes(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Lista las sedes hermanas de la barbería actual (misma organización).
    Si todavía no es Premium o no tiene organización, devuelve solo la propia."""
    barberia = db.query(Barberia).filter(Barberia.id_barberia == id_barberia).first()
    if barberia.id_organizacion is None:
        return [{
            "id_barberia": barberia.id_barberia,
            "subdominio": barberia.subdominio,
            "nombre": barberia.nombre,
            "estado": barberia.estado.value,
            "es_actual": True,
        }]

    sedes = db.query(Barberia).filter(Barberia.id_organizacion == barberia.id_organizacion).all()
    return [
        {
            "id_barberia": s.id_barberia,
            "subdominio": s.subdominio,
            "nombre": s.nombre,
            "estado": s.estado.value,
            "es_actual": s.id_barberia == id_barberia,
        }
        for s in sedes
    ]


@router.post("/sedes", status_code=201)
def crear_sede(
    datos: CrearSede,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Crea una barbería nueva (sede) dentro de la misma organización del usuario actual."""
    id_organizacion = _validar_es_premium_y_tiene_organizacion(db, id_barberia)

    existe = db.query(Barberia).filter(Barberia.subdominio == datos.subdominio).first()
    if existe:
        raise HTTPException(status_code=409, detail="Ese subdominio ya está en uso, elegí otro")

    plan_premium = db.query(Plan).filter(Plan.nombre == "Premium").first()
    if plan_premium is None:
        raise HTTPException(status_code=500, detail="No hay plan Premium configurado")

    hoy = date.today()
    nueva_barberia = Barberia(
        id_organizacion=id_organizacion,
        subdominio=datos.subdominio,
        nombre=datos.nombre_barberia,
        email_contacto=datos.email_contacto,
        telefono=datos.telefono,
        estado=EstadoBarberiaEnum.activa,
    )
    db.add(nueva_barberia)
    db.flush()

    admin = Usuario(
        nombre_usuario=datos.nombre_admin,
        email=datos.email_admin,
        password_hash=hashear_password(datos.password_admin),
        rol=RolEnum.administrador,
        id_barberia=nueva_barberia.id_barberia,
        activo=True,
    )
    db.add(admin)

    nueva_suscripcion = Suscripcion(
        id_barberia=nueva_barberia.id_barberia,
        id_plan=plan_premium.id_plan,
        estado=EstadoSuscripcionEnum.activa,
        fecha_inicio=hoy,
        fecha_fin=None,
    )
    db.add(nueva_suscripcion)

    db.commit()
    db.refresh(nueva_barberia)

    return {
        "mensaje": "Sede creada correctamente",
        "id_barberia": nueva_barberia.id_barberia,
        "subdominio": nueva_barberia.subdominio,
    }

@router.get("/comparativa")
def comparativa_sedes(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Métricas comparativas de los últimos 30 días entre todas las sedes de la organización."""
    from app.models.turno import Turno, EstadoTurnoEnum
    from sqlalchemy import func

    barberia = db.query(Barberia).filter(Barberia.id_barberia == id_barberia).first()
    if barberia.id_organizacion is None:
        return []

    sedes = db.query(Barberia).filter(Barberia.id_organizacion == barberia.id_organizacion).all()
    hoy = date.today()
    hace_30_dias = hoy - timedelta(days=30)

    resultado = []
    for s in sedes:
        ingresos = db.query(func.coalesce(func.sum(Turno.precio_total), 0)).filter(
            Turno.id_barberia == s.id_barberia,
            Turno.estado == EstadoTurnoEnum.completado,
            Turno.fecha >= hace_30_dias,
        ).scalar()
        turnos_totales = db.query(func.count(Turno.id_turno)).filter(
            Turno.id_barberia == s.id_barberia,
            Turno.fecha >= hace_30_dias,
        ).scalar()
        turnos_completados = db.query(func.count(Turno.id_turno)).filter(
            Turno.id_barberia == s.id_barberia,
            Turno.estado == EstadoTurnoEnum.completado,
            Turno.fecha >= hace_30_dias,
        ).scalar()

        ingresos_float = float(ingresos or 0)
        ticket_promedio = ingresos_float / turnos_completados if turnos_completados else 0

        resultado.append({
            "id_barberia": s.id_barberia,
            "nombre": s.nombre,
            "ingresos": ingresos_float,
            "turnos": turnos_totales or 0,
            "ticket_promedio": round(ticket_promedio, 0),
        })

    resultado.sort(key=lambda r: r["ingresos"], reverse=True)
    for i, r in enumerate(resultado):
        r["puesto"] = i + 1

    return resultado