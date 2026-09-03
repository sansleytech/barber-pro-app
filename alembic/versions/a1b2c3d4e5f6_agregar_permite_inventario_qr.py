"""agregar permite_inventario y permite_qr a planes

Revision ID: a1b2c3d4e5f6
Revises: 49f0fed91cd9
Create Date: 2026-09-02 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "49f0fed91cd9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "planes",
        sa.Column("permite_inventario", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "planes",
        sa.Column("permite_qr", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("planes", "permite_qr")
    op.drop_column("planes", "permite_inventario")