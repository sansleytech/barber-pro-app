"""Endpoints PÚBLICOS del portal (sin login). Identifican la barbería por subdominio."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.models.barberia import Barberia
from app.models.cliente import Cliente
from app.models.barbero import Barbero
from app.models.solicitud_turno import SolicitudTurno
from app.schemas.solicitud_turno import SolicitudCrear

router = APIRouter(prefix="/portal", tags=["Portal público"])


def _barberia_por_subdominio(subdominio: str, db: Session) -> Barberia:
    """Busca la barbería activa por su subdominio. Rechaza si no existe o está inactiva."""
    barberia = (
        db.query(Barberia)
        .filter(
            Barberia.subdominio == subdominio,
            Barberia.activo == True,
        )
        .first()
    )
    if barberia is None:
        raise HTTPException(status_code=404, detail="Barbería no encontrada")
    return barberia


class ClientePublico(BaseModel):
    """Lo mínimo que devolvemos públicamente de un cliente (sin datos sensibles)."""

    primer_nombre: str
    existe: bool


@router.get("/{subdominio}/cliente/{documento}", response_model=ClientePublico)
def identificar_cliente(subdominio: str, documento: str, db: Session = Depends(get_db)):
    """Dice si un cliente con ese documento ya existe en la barbería. No expone datos sensibles."""
    barberia = _barberia_por_subdominio(subdominio, db)
    cliente = (
        db.query(Cliente)
        .filter(
            Cliente.documento == documento,
            Cliente.id_barberia == barberia.id_barberia,
        )
        .first()
    )
    if cliente is None:
        return {"primer_nombre": "", "existe": False}
    return {"primer_nombre": cliente.primer_nombre, "existe": True}


@router.post("/{subdominio}/solicitar", status_code=201)
def crear_solicitud(
    subdominio: str, datos: SolicitudCrear, db: Session = Depends(get_db)
):
    """Crea una solicitud de turno (estado pendiente). Pública."""
    barberia = _barberia_por_subdominio(subdominio, db)

    # Validación básica anti-spam: nombre y teléfono con contenido razonable
    if not datos.nombre_cliente.strip() or len(datos.nombre_cliente.strip()) < 2:
        raise HTTPException(status_code=400, detail="Nombre inválido")
    if not datos.telefono.strip() or len(datos.telefono.strip()) < 6:
        raise HTTPException(status_code=400, detail="Teléfono inválido")

    # Si mandó un barbero, validar que pertenezca a esta barbería
    if datos.id_barbero is not None:
        barbero = (
            db.query(Barbero)
            .filter(
                Barbero.id_barbero == datos.id_barbero,
                Barbero.id_barberia == barberia.id_barberia,
            )
            .first()
        )
        if barbero is None:
            raise HTTPException(status_code=400, detail="Barbero no válido")

    solicitud = SolicitudTurno(
        id_barberia=barberia.id_barberia,
        id_barbero=datos.id_barbero,
        nombre_cliente=datos.nombre_cliente.strip(),
        telefono=datos.telefono.strip(),
        documento=datos.documento.strip() if datos.documento else None,
        fecha_preferida=datos.fecha_preferida,
        franja_preferida=datos.franja_preferida,
        comentario=datos.comentario.strip() if datos.comentario else None,
    )
    db.add(solicitud)
    db.commit()
    db.refresh(solicitud)

    from app.core.notificaciones_helper import crear_notificacion
    crear_notificacion(
        db, barberia.id_barberia,
        titulo="Nueva solicitud de turno",
        mensaje=f"{solicitud.nombre_cliente} pidió un turno desde el portal.",
        tipo="info",
        enlace="/solicitudes",
        email_destino=barberia.email_contacto,
    )
    db.commit()

    return {"mensaje": "Solicitud recibida", "id_solicitud": solicitud.id_solicitud}


@router.get("/{subdominio}/barberos")
def listar_barberos_publico(subdominio: str, db: Session = Depends(get_db)):
    """Lista pública de barberos activos de la barbería (para el portal)."""
    barberia = _barberia_por_subdominio(subdominio, db)
    barberos = db.query(Barbero).filter(
        Barbero.id_barberia == barberia.id_barberia,
        Barbero.activo == True,
    ).all()
    # Solo devolvemos lo necesario (nada sensible)
    return [
        {
            "id_barbero": b.id_barbero,
            "nombre": b.nombre,
            "apellido": b.apellido,
            "foto": b.foto,
            "especialidad": b.especialidad,
        }
        for b in barberos
    ]

class ClienteRegistro(BaseModel):
    documento: str
    tipo_documento: Optional[str] = "CC"
    primer_nombre: str
    apellidos: str
    telefono: str
    fecha_nacimiento: str
    email: Optional[str] = None


@router.post("/{subdominio}/cliente", status_code=201)
def registrar_cliente(subdominio: str, datos: ClienteRegistro, db: Session = Depends(get_db)):
    """Registra un cliente nuevo en la barbería. Documento obligatorio y único."""
    barberia = _barberia_por_subdominio(subdominio, db)
    if not datos.documento.strip():
        raise HTTPException(status_code=400, detail="El documento es obligatorio")
    if not datos.primer_nombre.strip() or not datos.apellidos.strip():
        raise HTTPException(status_code=400, detail="Nombre y apellidos son obligatorios")
    if not datos.telefono.strip() or len(datos.telefono.strip()) < 6:
        raise HTTPException(status_code=400, detail="Teléfono inválido")
    existe = db.query(Cliente).filter(
        Cliente.documento == datos.documento.strip(),
        Cliente.id_barberia == barberia.id_barberia,
    ).first()
    if existe is not None:
        raise HTTPException(status_code=409, detail="Ya estás registrado con ese documento")
    cliente = Cliente(
        id_barberia=barberia.id_barberia,
        documento=datos.documento.strip(),
        tipo_documento=datos.tipo_documento or "CC",
        primer_nombre=datos.primer_nombre.strip(),
        apellidos=datos.apellidos.strip(),
        telefono=datos.telefono.strip(),
        fecha_nacimiento=datos.fecha_nacimiento,
        email=datos.email.strip() if datos.email else None,
    )
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return {"mensaje": "Cliente registrado", "id_cliente": cliente.id_cliente, "primer_nombre": cliente.primer_nombre}


@router.get("/{subdominio}/galeria")
def galeria_publica(subdominio: str, db: Session = Depends(get_db)):
    """Lista pública de fotos de la galería (para el portal). Solo las activas."""
    from app.models.galeria import FotoGaleria
    barberia = _barberia_por_subdominio(subdominio, db)
    fotos = db.query(FotoGaleria).filter(
        FotoGaleria.id_barberia == barberia.id_barberia,
        FotoGaleria.activo == True,
    ).order_by(FotoGaleria.orden, FotoGaleria.id_foto).all()
    return [
        {
            "id_foto": f.id_foto,
            "url": f.url,
            "titulo": f.titulo,
            "descripcion": f.descripcion,
            "id_categoria_galeria": f.id_categoria_galeria,
            "destacado": f.destacado,
        }
        for f in fotos
    ]


@router.get("/{subdominio}/info")
def info_barberia(subdominio: str, db: Session = Depends(get_db)):
    """Info pública de la barbería (para el hero y el pie del portal)."""
    from app.models.configuracion import Configuracion
    barberia = _barberia_por_subdominio(subdominio, db)

    # Leer todas las claves de configuración de esta barbería
    filas = db.query(Configuracion).filter(
        Configuracion.id_barberia == barberia.id_barberia
    ).all()
    config = {f.clave: f.valor for f in filas}

    return {
        "nombre": config.get("negocio_nombre") or barberia.nombre,
        "logo_url": config.get("logo_url"),
        "hero_url": config.get("hero_url"),
        "slogan": config.get("portal_slogan"),
        "direccion": config.get("negocio_direccion"),
        "telefono": config.get("negocio_telefono"),
        "email": config.get("negocio_email"),
        "ciudad": config.get("negocio_ciudad"),
        "redes_sociales": config.get("redes_sociales") or "[]",
        "latitud": barberia.latitud,
        "longitud": barberia.longitud,
        "mision": config.get("portal_mision"),
        "vision": config.get("portal_vision"),
        "historia": config.get("portal_historia"),
    }


class ComentarioCrear(BaseModel):
    documento: str
    id_barbero: Optional[int] = None
    estrellas: int
    comentario: Optional[str] = None


@router.get("/{subdominio}/comentarios")
def listar_comentarios(subdominio: str, db: Session = Depends(get_db)):
    """Lista pública de comentarios/reseñas de la barbería."""
    from app.models.valoracion import Valoracion
    barberia = _barberia_por_subdominio(subdominio, db)
    valoraciones = db.query(Valoracion).filter(
        Valoracion.id_barberia == barberia.id_barberia,
    ).order_by(Valoracion.fecha_creacion.desc()).limit(50).all()

    # Traer nombres de clientes y barberos
    clientes = {c.id_cliente: f"{c.primer_nombre} {c.apellidos}" for c in db.query(Cliente).filter(Cliente.id_barberia == barberia.id_barberia).all()}
    barberos = {b.id_barbero: f"{b.nombre} {b.apellido}" for b in db.query(Barbero).filter(Barbero.id_barberia == barberia.id_barberia).all()}

    return [
        {
            "id_valoracion": v.id_valoracion,
            "nombre_cliente": clientes.get(v.id_cliente, "Cliente"),
            "nombre_barbero": barberos.get(v.id_barbero),
            "estrellas": v.estrellas,
            "comentario": v.comentario,
            "fecha": v.fecha_creacion.isoformat() if v.fecha_creacion else None,
        }
        for v in valoraciones
    ]


@router.post("/{subdominio}/comentarios", status_code=201)
def crear_comentario(subdominio: str, datos: ComentarioCrear, db: Session = Depends(get_db)):
    """Crea un comentario/reseña. El cliente se identifica por documento (cédula)."""
    from app.models.valoracion import Valoracion
    barberia = _barberia_por_subdominio(subdominio, db)

    # Validar estrellas
    if datos.estrellas < 1 or datos.estrellas > 5:
        raise HTTPException(status_code=400, detail="Las estrellas deben ser entre 1 y 5")

    # Buscar el cliente por documento
    cliente = db.query(Cliente).filter(
        Cliente.documento == datos.documento.strip(),
        Cliente.id_barberia == barberia.id_barberia,
    ).first()
    if cliente is None:
        raise HTTPException(status_code=404, detail="No encontramos un cliente con ese documento. Registrate primero pidiendo un turno.")

    valoracion = Valoracion(
        id_barberia=barberia.id_barberia,
        id_turno=None,
        id_barbero=datos.id_barbero,
        id_cliente=cliente.id_cliente,
        estrellas=datos.estrellas,
        comentario=datos.comentario,
    )
    db.add(valoracion)
    db.commit()
    db.refresh(valoracion)

    from app.core.notificaciones_helper import crear_notificacion
    estrellas_texto = "★" * datos.estrellas
    crear_notificacion(
        db, barberia.id_barberia,
        titulo="Nueva reseña recibida",
        mensaje=f"{cliente.primer_nombre} dejó {estrellas_texto}" + (f': "{datos.comentario}"' if datos.comentario else "."),
        tipo="info",
        enlace="/valoraciones",
        email_destino=barberia.email_contacto if datos.estrellas <= 3 else None,
    )
    db.commit()

    return {
        "mensaje": "Comentario publicado",
        "nombre_cliente": f"{cliente.primer_nombre} {cliente.apellidos}",
    } 


@router.get("/{subdominio}/categorias-galeria")
def categorias_galeria_publica(subdominio: str, db: Session = Depends(get_db)):
    """Lista pública de categorías de galería (para los filtros del portal)."""
    from app.models.categoria_galeria import CategoriaGaleria
    barberia = _barberia_por_subdominio(subdominio, db)
    cats = db.query(CategoriaGaleria).filter(
        CategoriaGaleria.id_barberia == barberia.id_barberia
    ).order_by(CategoriaGaleria.orden, CategoriaGaleria.id_categoria_galeria).all()
    return [
        {"id_categoria_galeria": c.id_categoria_galeria, "nombre": c.nombre}
        for c in cats
    ]
