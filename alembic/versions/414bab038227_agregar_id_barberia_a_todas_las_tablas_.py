"""agregar id_barberia a todas las tablas (multi-tenant)

Revision ID: 414bab038227
Revises: a45ce9a23449
Create Date: 2026-06-23 01:37:53.045662

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '414bab038227'
down_revision: Union[str, Sequence[str], None] = 'a45ce9a23449'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Tablas de datos que pertenecen a una barbería (NO incluye barberias, planes, suscripciones)
TABLAS = [
    "barberos",
    "servicios",
    "clientes",
    "turnos",
    "usuarios",
    "horarios_barbero",
    "configuracion",
    "categorias_productos",
    "proveedores",
    "productos",
    "compras_productos",
    "ventas_productos",
    "gastos_caja",
    "descuentos_caja",
    "cierres_caja",
    "valoraciones_turnos",
    "notificaciones",
    "carousel_slides",
    "fotos_cliente",
    "acontecimientos",
    "codigos_qr",
]


def upgrade() -> None:
    """Agrega id_barberia (nullable) + FK a barberias en cada tabla de datos."""
    for tabla in TABLAS:
        op.add_column(tabla, sa.Column("id_barberia", sa.Integer(), nullable=True))
        op.create_foreign_key(
            f"fk_{tabla}_barberia",
            tabla,
            "barberias",
            ["id_barberia"],
            ["id_barberia"],
            ondelete="CASCADE",
        )


def downgrade() -> None:
    """Revierte: elimina la FK y la columna id_barberia de cada tabla."""
    for tabla in TABLAS:
        op.drop_constraint(f"fk_{tabla}_barberia", tabla, type_="foreignkey")
        op.drop_column(tabla, "id_barberia")
