"""Helper para registrar acciones en el historial de auditoría."""
from sqlalchemy.orm import Session
from app.models.historial_auditoria import HistorialAuditoria


def registrar_auditoria(db: Session, nombre_usuario: str, accion: str, detalle: str = None, id_barberia_afectada: int = None):
    """Guarda una línea en el historial. No lanza excepción si falla,
    para no romper la operación principal por un problema de logging."""
    try:
        registro = HistorialAuditoria(
            nombre_usuario=nombre_usuario,
            accion=accion,
            detalle=detalle,
            id_barberia_afectada=id_barberia_afectada,
        )
        db.add(registro)
        db.commit()
    except Exception:
        db.rollback()