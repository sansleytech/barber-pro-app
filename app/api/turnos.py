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
from app.schemas.turno import (
    TurnoCrear,
    TurnoRespuesta,
    TurnoCambiarEstado,
    TurnoActualizar,
)
from app.core.dependencies import get_barberia_actual, requiere_rol, get_usuario_actual

router = APIRouter(prefix="/turnos", tags=["Turnos"])


@router.post("", response_model=TurnoRespuesta, status_code=201)
def crear_turno(
    datos: TurnoCrear,
    db: Session = Depends(get_db),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Crea un turno validando cliente, barbero, servicios y disponibilidad."""

    cliente = (
        db.query(Cliente)
        .filter(
            Cliente.id_cliente == datos.id_cliente,
            Cliente.id_barberia == id_barberia,
        )
        .first()
    )
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    barbero = (
        db.query(Barbero)
        .filter(
            Barbero.id_barbero == datos.id_barbero,
            Barbero.id_barberia == id_barberia,
        )
        .first()
    )
    if barbero is None:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")

    if not datos.ids_servicios:
        raise HTTPException(status_code=400, detail="Debe elegir al menos un servicio")

    servicios = (
        db.query(Servicio)
        .filter(
            Servicio.id_servicio.in_(datos.ids_servicios),
            Servicio.id_barberia == id_barberia,
        )
        .all()
    )
    if len(servicios) != len(set(datos.ids_servicios)):
        raise HTTPException(status_code=404, detail="Uno o más servicios no existen")

    duracion_total = sum(s.duracion_minutos for s in servicios)
    precio_total = sum(s.precio for s in servicios)

    inicio_dt = datetime.combine(datos.fecha, datos.hora_inicio)
    fin_dt = inicio_dt + timedelta(minutes=duracion_total)
    hora_fin = fin_dt.time()

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

    for s in servicios:
        db.add(
            TurnoServicio(
                id_turno=nuevo.id_turno,
                id_servicio=s.id_servicio,
                precio_aplicado=s.precio,
                duracion_aplicada=s.duracion_minutos,
                id_barberia=id_barberia,
            )
        )

    db.commit()
    db.refresh(nuevo)

    usuario_barbero = db.query(Usuario).filter(
        Usuario.id_barbero == barbero.id_barbero,
        Usuario.id_barberia == id_barberia,
    ).first()
    if usuario_barbero and usuario_barbero.email:
        from app.core.email import enviar_email
        enviar_email(
            destinatario=usuario_barbero.email,
            asunto="Tenés un turno nuevo asignado",
            cuerpo_html=f"""
                <p>Hola {barbero.nombre},</p>
                <p>Te asignaron un turno para el <strong>{nuevo.fecha}</strong> a las <strong>{nuevo.hora_inicio.strftime('%H:%M')}</strong>.</p>
                <p>Revisá los detalles en tu panel: <a href="https://barberproapp.online/login">Ingresar</a></p>
            """,
        )

    return nuevo


@router.put("/{id_turno}", response_model=TurnoRespuesta)
def actualizar_turno(
    id_turno: int,
    datos: TurnoActualizar,
    db: Session = Depends(get_db),
    id_barberia: int = Depends(get_barberia_actual),
):
    """Edita un turno: cliente, barbero, fecha, hora y servicios. Recalcula precio y duración."""

    turno = (
        db.query(Turno)
        .filter(
            Turno.id_turno == id_turno,
            Turno.id_barberia == id_barberia,
        )
        .first()
    )
    if turno is None:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    if datos.id_cliente is not None:
        cliente = (
            db.query(Cliente)
            .filter(
                Cliente.id_cliente == datos.id_cliente,
                Cliente.id_barberia == id_barberia,
            )
            .first()
        )
        if cliente is None:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        turno.id_cliente = datos.id_cliente

    if datos.id_barbero is not None:
        barbero = (
            db.query(Barbero)
            .filter(
                Barbero.id_barbero == datos.id_barbero,
                Barbero.id_barberia == id_barberia,
            )
            .first()
        )
        if barbero is None:
            raise HTTPException(status_code=404, detail="Barbero no encontrado")
        turno.id_barbero = datos.id_barbero

    if datos.fecha is not None:
        turno.fecha = datos.fecha
    if datos.hora_inicio is not None:
        turno.hora_inicio = datos.hora_inicio

    if datos.ids_servicios is not None:
        if not datos.ids_servicios:
            raise HTTPException(
                status_code=400, detail="Debe elegir al menos un servicio"
            )

        servicios = (
            db.query(Servicio)
            .filter(
                Servicio.id_servicio.in_(datos.ids_servicios),
                Servicio.id_barberia == id_barberia,
            )
            .all()
        )
        if len(servicios) != len(set(datos.ids_servicios)):
            raise HTTPException(
                status_code=404, detail="Uno o más servicios no existen"
            )

        duracion_total = sum(s.duracion_minutos for s in servicios)
        precio_total = sum(s.precio for s in servicios)
        turno.precio_total = precio_total

        db.query(TurnoServicio).filter(
            TurnoServicio.id_turno == turno.id_turno
        ).delete()
        for s in servicios:
            db.add(
                TurnoServicio(
                    id_turno=turno.id_turno,
                    id_servicio=s.id_servicio,
                    precio_aplicado=s.precio,
                    duracion_aplicada=s.duracion_minutos,
                    id_barberia=id_barberia,
                )
            )
    else:
        duracion_total = sum(item.duracion_aplicada for item in turno.servicios)

    inicio_dt = datetime.combine(turno.fecha, turno.hora_inicio)
    fin_dt = inicio_dt + timedelta(minutes=duracion_total)
    turno.hora_fin = fin_dt.time()

    if datos.observaciones is not None:
        turno.observaciones = datos.observaciones

    solapado = (
        db.query(Turno)
        .filter(
            Turno.id_barberia == id_barberia,
            Turno.id_barbero == turno.id_barbero,
            Turno.fecha == turno.fecha,
            Turno.id_turno != turno.id_turno,
            Turno.estado != EstadoTurnoEnum.cancelado,
            Turno.hora_inicio < turno.hora_fin,
            Turno.hora_fin > turno.hora_inicio,
        )
        .first()
    )
    if solapado:
        raise HTTPException(
            status_code=409, detail="El barbero ya tiene un turno en ese horario"
        )

    db.commit()
    db.refresh(turno)
    return turno


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
    turno = (
        db.query(Turno)
        .filter(
            Turno.id_turno == id_turno,
            Turno.id_barberia == id_barberia,
        )
        .first()
    )
    if turno is None:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return turno


@router.patch("/{id_turno}/estado", response_model=TurnoRespuesta)
def cambiar_estado_turno(
    id_turno: int,
    datos: TurnoCambiarEstado,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_actual),
):
    """Cambia el estado de un turno.
    Un barbero no puede tocar un turno ya completado (queda bloqueado para él).
    Administradores y recepcionistas sí pueden seguir modificándolo, igual que
    antes, para poder corregir errores o volver a emitir la factura."""
    turno = (
        db.query(Turno)
        .filter(
            Turno.id_turno == id_turno,
            Turno.id_barberia == usuario.id_barberia,
        )
        .first()
    )
    if turno is None:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    if turno.estado == EstadoTurnoEnum.completado and usuario.rol == RolEnum.barbero:
        raise HTTPException(
            status_code=409,
            detail="Este turno ya fue completado y no se puede modificar",
        )

    turno.estado = datos.estado
    if datos.metodo_pago is not None:
        turno.metodo_pago = datos.metodo_pago
    if datos.propina is not None:
        turno.propina = datos.propina
    if datos.id_barbero_propina is not None:
        turno.id_barbero_propina = datos.id_barbero_propina

    if datos.estado == EstadoTurnoEnum.completado:
        cliente = (
            db.query(Cliente)
            .filter(Cliente.id_cliente == turno.id_cliente)
            .first()
        )
        if cliente and (
            cliente.fecha_ultima_visita is None
            or turno.fecha > cliente.fecha_ultima_visita
        ):
            cliente.fecha_ultima_visita = turno.fecha

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
    turno = (
        db.query(Turno)
        .filter(
            Turno.id_turno == id_turno,
            Turno.id_barberia == id_barberia,
        )
        .first()
    )
    if turno is None:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    turno.estado = EstadoTurnoEnum.cancelado
    db.commit()
    return {"mensaje": f"Turno {id_turno} cancelado correctamente"}