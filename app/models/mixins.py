"""Mixins reutilizables para los modelos."""

from sqlalchemy import Column, Integer, ForeignKey


class TenantMixin:
    """Agrega id_barberia a un modelo (multi-tenancy).

    Cualquier modelo que herede de este mixin tendrá la columna
    id_barberia que lo asocia a una barbería (tenant).
    """
    id_barberia = Column(
        Integer,
        ForeignKey("barberias.id_barberia", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
