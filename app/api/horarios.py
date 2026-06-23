"""Endpoints de los horarios de barbero y disponibilidad."""

from datetime import datetime, timedelta, date as date_type
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.horario import HorarioBarbero
from app.models.barbero import Barbero
from app.models.turno import Turno, EstadoTurnoEnum
from app.models.usuario import Usuario, RolEnum
from app.schemas.horario import HorarioCrear, HorarioRespuesta, HorarioActualizar
from app.core.dependencies import requiere_rol

router = APIRouter(prefix="/horarios", tags=["Horarios"])


@router.get("/barbero/{id_barbero}", response_model=list[HorarioRespuesta])
def listar_horarios_barbero(id_barbero: int, db: Session = Depends(get_db)):
    """Devuelve los horarios de un barbero. Público (para reservas online)."""
    return db.query(HorarioBarbero).filter(
        HorarioBarbero.id_barbero == id_barbero
    ).order_by(HorarioBarbero.dia_semana, HorarioBarbero.hora_inicio).all()


@router.get("/disponibilidad/{id_barbero}")
def disponibilidad_barbero(
    id_barbero: int,
    fecha: date_type,
    duracion_minutos: int = 30,
    db: Session = Depends(get_db),
):
    """
    Devuelve los horarios disponibles de un barbero en una fecha dada.
    Público (para que el cliente vea turnos libres al reservar).
    'fecha' va como query param: ?fecha=2026-07-06
    """
    barbero = db.query(Barbero).filter(Barbero.id_barbero == id_barbero).first()
    if barbero is None:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")

    # 1. Día de la semana en formato ISO (1=Lunes ... 7=Domingo)
    dia_iso = fecha.isoweekday()

    # 2. Horario del barbero ese día
    horario = db.query(HorarioBarbero).filter(
        HorarioBarbero.id_barbero == id_barbero,
        HorarioBarbero.dia_semana == dia_iso,
    ).first()
    if horario is None:
        return {"fecha": fecha, "disponibles": [], "mensaje": "El barbero no trabaja ese día"}

    # 3. Turnos ya ocupados ese día (que no estén cancelados)
    turnos = db.query(Turno).filter(
        Turno.id_barbero == id_barbero,
        Turno.fecha == fecha,
        Turno.estado != EstadoTurnoEnum.cancelado,
    ).all()
    ocupados = [(t.hora_inicio, t.hora_fin) for t in turnos]

    # 4. Generar huecos posibles desde hora_inicio hasta hora_fin
    disponibles = []
    actual = datetime.combine(fecha, horario.hora_inicio)
    fin_jornada = datetime.combine(fecha, horario.hora_fin)
    paso = timedelta(minutes=duracion_minutos)

    while actual + paso <= fin_jornada:
        inicio_hueco = actual.time()
        fin_hueco = (actual + paso).time()

        # ¿Cae en la pausa de almuerzo?
        en_pausa = False
        if horario.pausa_inicio and horario.pausa_fin:
            if inicio_hueco < horario.pausa_fin and fin_hueco > horario.pausa_inicio:
                en_pausa = True

        # ¿Se solapa con un turno ocupado?
        solapado = any(
            inicio_hueco < ocup_fin and fin_hueco > ocup_inicio
            for ocup_inicio, ocup_fin in ocupados
        )

        if not en_pausa and not solapado:
            disponibles.append(inicio_hueco.strftime("%H:%M"))

        actual += paso

    return {"fecha": fecha, "id_barbero": id_barbero, "disponibles": disponibles}


@router.post("", response_model=HorarioRespuesta, status_code=201)
def crear_horario(
    datos: HorarioCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Crea un horario de trabajo para un barbero. Solo administradores."""
    barbero = db.query(Barbero).filter(Barbero.id_barbero == datos.id_barbero).first()
    if barbero is None:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")

    if datos.hora_fin <= datos.hora_inicio:
        raise HTTPException(status_code=400, detail="La hora de fin debe ser posterior a la de inicio")

    nuevo = HorarioBarbero(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_horario}", response_model=HorarioRespuesta)
def actualizar_horario(
    id_horario: int,
    datos: HorarioActualizar,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Actualiza un horario. Solo administradores."""
    horario = db.query(HorarioBarbero).filter(HorarioBarbero.id_horario == id_horario).first()
    if horario is None:
        raise HTTPException(status_code=404, detail="Horario no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(horario, campo, valor)

    db.commit()
    db.refresh(horario)
    return horario


@router.delete("/{id_horario}", status_code=200)
def eliminar_horario(
    id_horario: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Elimina un horario. Solo administradores."""
    horario = db.query(HorarioBarbero).filter(HorarioBarbero.id_horario == id_horario).first()
    if horario is None:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    db.delete(horario)
    db.commit()
    return {"mensaje": f"Horario {id_horario} eliminado correctamente"}
