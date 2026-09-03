"""Endpoints del recurso Usuario — multi-tenant."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.usuario import Usuario, RolEnum
from app.schemas.usuario import UsuarioCrear, UsuarioRespuesta, UsuarioActualizar
from app.core.security import hashear_password
from app.core.dependencies import get_usuario_actual, requiere_rol, verificar_barberia_activa

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("", response_model=list[UsuarioRespuesta])
def listar_usuarios(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Devuelve TODOS los usuarios de la barbería (activos e inactivos). Solo administradores."""
    return (
        db.query(Usuario)
        .filter(Usuario.id_barberia == usuario.id_barberia)
        .order_by(Usuario.activo.desc(), Usuario.nombre_usuario)
        .all()
    )


@router.post("", response_model=UsuarioRespuesta, status_code=201)
def crear_usuario(
    datos: UsuarioCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Crea un usuario EN LA BARBERÍA del admin. Solo administradores."""
    existe = (
        db.query(Usuario)
        .filter(
            Usuario.nombre_usuario == datos.nombre_usuario,
            Usuario.id_barberia == usuario.id_barberia,
        )
        .first()
    )
    if existe:
        raise HTTPException(
            status_code=409,
            detail="El nombre de usuario ya está en uso en esta barbería",
        )

    nuevo = Usuario(
        nombre_usuario=datos.nombre_usuario,
        password_hash=hashear_password(datos.password),
        rol=datos.rol,
        id_barbero=datos.id_barbero,
        pregunta_seguridad=datos.pregunta_seguridad,
        respuesta_hash=(
            hashear_password(datos.respuesta_seguridad)
            if datos.respuesta_seguridad
            else None
        ),
        id_barberia=usuario.id_barberia,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/yo", response_model=UsuarioRespuesta)
def mi_perfil(usuario: Usuario = Depends(verificar_barberia_activa)):
    """Devuelve los datos del usuario logueado. Bloquea si el trial venció."""
    return usuario


@router.put("/{id_usuario}", response_model=UsuarioRespuesta)
def actualizar_usuario(
    id_usuario: int,
    datos: UsuarioActualizar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Edita un usuario de la barbería. Solo administradores."""
    objetivo = (
        db.query(Usuario)
        .filter(
            Usuario.id_usuario == id_usuario,
            Usuario.id_barberia == usuario.id_barberia,
        )
        .first()
    )
    if not objetivo:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if objetivo.super_admin and objetivo.id_usuario != usuario.id_usuario:
        raise HTTPException(
            status_code=403, detail="No se puede editar a un super administrador"
        )

    if datos.rol is not None:
        objetivo.rol = datos.rol
    if datos.id_barbero is not None:
        objetivo.id_barbero = datos.id_barbero
    if datos.password:
        objetivo.password_hash = hashear_password(datos.password)
    if datos.pregunta_seguridad is not None:
        objetivo.pregunta_seguridad = datos.pregunta_seguridad
    if datos.respuesta_seguridad:
        objetivo.respuesta_hash = hashear_password(datos.respuesta_seguridad)

    db.commit()
    db.refresh(objetivo)
    return objetivo


@router.patch("/{id_usuario}/estado", response_model=UsuarioRespuesta)
def cambiar_estado(
    id_usuario: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Activa o desactiva un usuario (alterna). Solo administradores."""
    if id_usuario == usuario.id_usuario:
        raise HTTPException(status_code=400, detail="No podés cambiar tu propio estado")

    objetivo = (
        db.query(Usuario)
        .filter(
            Usuario.id_usuario == id_usuario,
            Usuario.id_barberia == usuario.id_barberia,
        )
        .first()
    )
    if not objetivo:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if objetivo.super_admin:
        raise HTTPException(
            status_code=403, detail="No se puede desactivar a un super administrador"
        )

    objetivo.activo = not objetivo.activo
    db.commit()
    db.refresh(objetivo)
    return objetivo


@router.delete("/{id_usuario}", status_code=204)
def eliminar_usuario(
    id_usuario: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador)),
):
    """Borrado lógico (desactiva) de un usuario. Solo administradores."""
    if id_usuario == usuario.id_usuario:
        raise HTTPException(status_code=400, detail="No podés eliminarte a vos mismo")

    objetivo = (
        db.query(Usuario)
        .filter(
            Usuario.id_usuario == id_usuario,
            Usuario.id_barberia == usuario.id_barberia,
        )
        .first()
    )
    if not objetivo:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if objetivo.super_admin:
        raise HTTPException(
            status_code=403, detail="No se puede eliminar a un super administrador"
        )

    objetivo.activo = False
    db.commit()
    return None