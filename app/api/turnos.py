"""Endpoints del recurso Turno, con la lógica de negocio — multi-tenant."""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.turno import Turno, TurnoServicio, EstadoTurnoEnum
from app.models.cliente import Cliente
from app.models.barbero import Barbero
from app.models.servicio import Servicio
from app.models.usuario import Usuario, RolEnum
from app.schemas.turno import TurnoCrear, TurnoRespuesta, TurnoCambiarEstado
from app.core.dependencies import get_barberia_actual, requiere_rol

router = APIRouter(prefix="/turnos", tags=["Turnos"])


@router.post("", response_model=TurnoRespuesta, status_code=201)
def crear_turno(
    datos: TurnoCrear,
    db: Session = Depends(get_db),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Crea un turno validando cliente, barbero, servicios y disponibilidad."""

    # 1. Validar que el cliente exista EN ESTA BARBERÍA
    cliente = db.query(Cliente).filter(
        Cliente.id_cliente == datos.id_cliente,
        Cliente.id_barberia == id_barberia,
    ).first()
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # 2. Validar que el barbero exista EN ESTA BARBERÍA
    barbero = db.query(Barbero).filter(
        Barbero.id_barbero == datos.id_barbero,
        Barbero.id_barberia == id_barberia,
    ).first()
    if barbero is None:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")

    # 3. Validar que haya al menos un servicio
    if not datos.ids_servicios:
        raise HTTPException(status_code=400, detail="Debe elegir al menos un servicio")

    # 4. Buscar los servicios DE ESTA BARBERÍA y validar que todos existan
    servicios = db.query(Servicio).filter(
        Servicio.id_servicio.in_(datos.ids_servicios),
        Servicio.id_barberia == id_barberia,
    ).all()
    if len(servicios) != len(set(datos.ids_servicios)):
        raise HTTPException(status_code=404, detail="Uno o más servicios no existen")

    # 5. Calcular duración total y precio total sumando los servicios
    duracion_total = sum(s.duracion_minutos for s in servicios)
    precio_total = sum(s.precio for s in servicios)

    # 6. Calcular la hora de fin
    inicio_dt = datetime.combine(datos.fecha, datos.hora_inicio)
    fin_dt = inicio_dt + timedelta(minutes=duracion_total)
    hora_fin = fin_dt.time()

    # 7. Verificar que el barbero no tenga otro turno que se cruce (en esta barbería)
    solapado = (
        db.query(Turno)
        .filter(
            Turno.id_barberia == id_barberia,
            Turno.id_barbero == datos.id_barbero,
            Turno.fecha == datos.fecha,
            Turno.estado != EstadoTurnoEnum.cancelado,
            Turno.hora_inicio < hora_fin,
            Turno.hora_fin > datos.hora_inicio,
        )
        .first()
    )
    if solapado:
        raise HTTPException(
            status_code=409,
            detail="El barbero ya tiene un turno en ese horario",
        )

    # 8. Crear el turno (con su barbería)
    nuevo = Turno(
        id_cliente=datos.id_cliente,
        id_barbero=datos.id_barbero,
        fecha=datos.fecha,
        hora_inicio=datos.hora_inicio,
        hora_fin=hora_fin,
        precio_total=precio_total,
        estado=EstadoTurnoEnum.pendiente,
        id_barberia=id_barberia,
    )
    db.add(nuevo)
    db.flush()

    # 9. Asociar los servicios al turno
    for s in servicios:
        db.add(TurnoServicio(
            id_turno=nuevo.id_turno,
            id_servicio=s.id_servicio,
            id_barberia=id_barberia,
        ))

    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("", response_model=list[TurnoRespuesta])
def listar_turnos(
    db: Session = Depends(get_db),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Devuelve los turnos de la barbería."""
    return db.query(Turno).filter(Turno.id_barberia == id_barberia).all()


@router.get("/{id_turno}", response_model=TurnoRespuesta)
def obtener_turno(
    id_turno: int,
    db: Session = Depends(get_db),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Devuelve un turno por su id (solo de la barbería del usuario)."""
    turno = db.query(Turno).filter(
        Turno.id_turno == id_turno,
        Turno.id_barberia == id_barberia,
    ).first()
    if turno is None:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return turno


@router.patch("/{id_turno}/estado", response_model=TurnoRespuesta)
def cambiar_estado_turno(
    id_turno: int,
    datos: TurnoCambiarEstado,
    db: Session = Depends(get_db),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Cambia el estado de un turno (de la barbería del usuario)."""
    turno = db.query(Turno).filter(
        Turno.id_turno == id_turno,
        Turno.id_barberia == id_barberia,
    ).first()
    if turno is None:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    turno.estado = datos.estado
    db.commit()
    db.refresh(turno)
    return turno


@router.delete("/{id_turno}", status_code=200)
def cancelar_turno(
    id_turno: int,
    db: Session = Depends(get_db),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Cancela un turno (de la barbería del usuario)."""
    turno = db.query(Turno).filter(
        Turno.id_turno == id_turno,
        Turno.id_barberia == id_barberia,
    ).first()
    if turno is None:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    turno.estado = EstadoTurnoEnum.cancelado
    db.commit()
    return {"mensaje": f"Turno {id_turno} cancelado correctamente"}
