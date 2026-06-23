"""Endpoints del recurso Usuario — multi-tenant."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.usuario import Usuario, RolEnum
from app.schemas.usuario import UsuarioCrear, UsuarioRespuesta
from app.core.security import hashear_password
from app.core.dependencies import get_usuario_actual, requiere_rol

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("", response_model=list[UsuarioRespuesta])
def listar_usuarios(db: Session = Depends(get_db),
                    usuario: Usuario = Depends(requiere_rol(RolEnum.administrador))):
    """Devuelve los usuarios activos de la barbería. Solo administradores."""
    return db.query(Usuario).filter(
        Usuario.activo == True, Usuario.id_barberia == usuario.id_barberia
    ).all()


@router.post("", response_model=UsuarioRespuesta, status_code=201)
def crear_usuario(datos: UsuarioCrear, db: Session = Depends(get_db),
                  usuario: Usuario = Depends(requiere_rol(RolEnum.administrador))):
    """Crea un usuario EN LA BARBERÍA del admin. Solo administradores."""
    existe = db.query(Usuario).filter(
        Usuario.nombre_usuario == datos.nombre_usuario,
        Usuario.id_barberia == usuario.id_barberia,
    ).first()
    if existe:
        raise HTTPException(status_code=409, detail="El nombre de usuario ya está en uso en esta barbería")

    nuevo = Usuario(
        nombre_usuario=datos.nombre_usuario,
        password_hash=hashear_password(datos.password),
        rol=datos.rol,
        id_barbero=datos.id_barbero,
        pregunta_seguridad=datos.pregunta_seguridad,
        respuesta_hash=hashear_password(datos.respuesta_seguridad) if datos.respuesta_seguridad else None,
        id_barberia=usuario.id_barberia,
    )
    db.add(nuevo); db.commit(); db.refresh(nuevo)
    return nuevo


@router.get("/yo", response_model=UsuarioRespuesta)
def mi_perfil(usuario: Usuario = Depends(get_usuario_actual)):
    """Devuelve los datos del usuario logueado."""
    return usuario
