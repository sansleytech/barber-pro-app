"""Endpoints de Horarios de barbero y disponibilidad — multi-tenant."""
from datetime import datetime, timedelta, date as date_type
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.horario import HorarioBarbero
from app.models.barbero import Barbero
from app.models.turno import Turno, EstadoTurnoEnum
from app.models.usuario import Usuario, RolEnum
from app.schemas.horario import HorarioCrear, HorarioRespuesta, HorarioActualizar
from app.core.dependencies import get_barberia_actual, requiere_rol

router = APIRouter(prefix="/horarios", tags=["Horarios"])


@router.get("/barbero/{id_barbero}", response_model=list[HorarioRespuesta])
def listar_horarios_barbero(id_barbero: int, db: Session = Depends(get_db),
                            id_barberia: int = Depends(get_barberia_actual)):
    return db.query(HorarioBarbero).filter(
        HorarioBarbero.id_barbero == id_barbero,
        HorarioBarbero.id_barberia == id_barberia,
    ).order_by(HorarioBarbero.dia_semana, HorarioBarbero.hora_inicio).all()


@router.get("/disponibilidad/{id_barbero}")
def disponibilidad_barbero(id_barbero: int, fecha: date_type, duracion_minutos: int = 30,
                           db: Session = Depends(get_db),
                           id_barberia: int = Depends(get_barberia_actual)):
    barbero = db.query(Barbero).filter(
        Barbero.id_barbero == id_barbero, Barbero.id_barberia == id_barberia
    ).first()
    if barbero is None:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")

    dia_iso = fecha.isoweekday()
    horario = db.query(HorarioBarbero).filter(
        HorarioBarbero.id_barbero == id_barbero,
        HorarioBarbero.id_barberia == id_barberia,
        HorarioBarbero.dia_semana == dia_iso,
    ).first()
    if horario is None:
        return {"fecha": fecha, "disponibles": [], "mensaje": "El barbero no trabaja ese día"}

    turnos = db.query(Turno).filter(
        Turno.id_barbero == id_barbero,
        Turno.id_barberia == id_barberia,
        Turno.fecha == fecha,
        Turno.estado != EstadoTurnoEnum.cancelado,
    ).all()
    ocupados = [(t.hora_inicio, t.hora_fin) for t in turnos]

    disponibles = []
    actual = datetime.combine(fecha, horario.hora_inicio)
    fin_jornada = datetime.combine(fecha, horario.hora_fin)
    paso = timedelta(minutes=duracion_minutos)
    while actual + paso <= fin_jornada:
        ini, fin = actual.time(), (actual + paso).time()
        en_pausa = False
        if horario.pausa_inicio and horario.pausa_fin:
            if ini < horario.pausa_fin and fin > horario.pausa_inicio:
                en_pausa = True
        solapado = any(ini < of and fin > oi for oi, of in ocupados)
        if not en_pausa and not solapado:
            disponibles.append(ini.strftime("%H:%M"))
        actual += paso
    return {"fecha": fecha, "id_barbero": id_barbero, "disponibles": disponibles}


@router.post("", response_model=HorarioRespuesta, status_code=201)
def crear(datos: HorarioCrear, db: Session = Depends(get_db),
          usuario: Usuario = Depends(requiere_rol(RolEnum.administrador))):
    barbero = db.query(Barbero).filter(
        Barbero.id_barbero == datos.id_barbero, Barbero.id_barberia == usuario.id_barberia
    ).first()
    if barbero is None:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")
    if datos.hora_fin <= datos.hora_inicio:
        raise HTTPException(status_code=400, detail="La hora de fin debe ser posterior a la de inicio")
    nuevo = HorarioBarbero(**datos.model_dump(), id_barberia=usuario.id_barberia)
    db.add(nuevo); db.commit(); db.refresh(nuevo)
    return nuevo


@router.put("/{id_horario}", response_model=HorarioRespuesta)
def actualizar(id_horario: int, datos: HorarioActualizar, db: Session = Depends(get_db),
               usuario: Usuario = Depends(requiere_rol(RolEnum.administrador))):
    item = db.query(HorarioBarbero).filter(
        HorarioBarbero.id_horario == id_horario,
        HorarioBarbero.id_barberia == usuario.id_barberia,
    ).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    for c, v in datos.model_dump(exclude_unset=True).items():
        setattr(item, c, v)
    db.commit(); db.refresh(item)
    return item


@router.delete("/{id_horario}", status_code=200)
def eliminar(id_horario: int, db: Session = Depends(get_db),
             usuario: Usuario = Depends(requiere_rol(RolEnum.administrador))):
    item = db.query(HorarioBarbero).filter(
        HorarioBarbero.id_horario == id_horario,
        HorarioBarbero.id_barberia == usuario.id_barberia,
    ).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    db.delete(item); db.commit()
    return {"mensaje": f"Horario {id_horario} eliminado"}
