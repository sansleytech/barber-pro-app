"""Endpoints de configuración del sistema — multi-tenant."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.configuracion import Configuracion
from app.models.usuario import Usuario, RolEnum
from app.models.barberia import Barberia, EstadoBarberiaEnum
from app.schemas.configuracion import ConfiguracionRespuesta, ConfiguracionActualizar
from app.core.dependencies import get_barberia_actual, requiere_rol

router = APIRouter(prefix="/configuracion", tags=["Configuración"])


@router.get("", response_model=list[ConfiguracionRespuesta])
def listar_configuracion(db: Session = Depends(get_db),
                         id_barberia: int = Depends(get_barberia_actual)):
    """Devuelve la configuración de la barbería."""
    return db.query(Configuracion).filter(Configuracion.id_barberia == id_barberia).all()


@router.get("/{clave}", response_model=ConfiguracionRespuesta)
def obtener_configuracion(clave: str, db: Session = Depends(get_db),
                          id_barberia: int = Depends(get_barberia_actual)):
    """Devuelve un ajuste por su clave."""
    item = db.query(Configuracion).filter(
        Configuracion.clave == clave, Configuracion.id_barberia == id_barberia
    ).first()
    if item is None:
        return {"clave": clave, "valor": None, "fecha_actualizacion": None}
    return item


@router.put("/{clave}", response_model=ConfiguracionRespuesta)
def guardar_configuracion(clave: str, datos: ConfiguracionActualizar, db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador))):
    """Crea o actualiza un ajuste. Solo administradores."""
    item = db.query(Configuracion).filter(
        Configuracion.clave == clave, Configuracion.id_barberia == usuario.id_barberia
    ).first()
    if item is None:
        item = Configuracion(clave=clave, valor=datos.valor, id_barberia=usuario.id_barberia)
        db.add(item)
    else:
        item.valor = datos.valor
    db.commit(); db.refresh(item)
    return item

@router.post("/cancelar-cuenta")
def cancelar_cuenta(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """El propio admin cancela su cuenta. No se borran datos: la barbería
    queda 'congelada' (sin acceso), y se puede reactivar contactando soporte."""
    barberia = db.query(Barberia).filter(Barberia.id_barberia == usuario.id_barberia).first()
    if barberia is None:
        raise HTTPException(status_code=404, detail="Barbería no encontrada")

    barberia.estado = EstadoBarberiaEnum.cancelada
    db.commit()

    if usuario.email:
        from app.core.email import enviar_email
        enviar_email(
            destinatario=usuario.email,
            asunto="Tu cuenta fue cancelada — Barber Pro",
            cuerpo_html=f"""
                <p>Hola {usuario.nombre_usuario},</p>
                <p>Tu cuenta de <strong>{barberia.nombre}</strong> fue cancelada. Tus datos quedan guardados de forma segura por si querés reactivarla más adelante.</p>
                <p>Si fue un error o querés volver, escribinos a sansley.tech-sol@outlook.com.</p>
            """,
        )

    return {"mensaje": "Cuenta cancelada correctamente"}