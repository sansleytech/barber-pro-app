# alembic/versions/a7b8c9d0e1f2_crear_fuentes_pago.py
from alembic import op
import sqlalchemy as sa

revision = "a7b8c9d0e1f2"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "fuentes_pago",
        sa.Column("id_fuente_pago", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("id_barberia", sa.Integer(), sa.ForeignKey("barberias.id_barberia", ondelete="CASCADE"), nullable=False),
        sa.Column("id_fuente_wompi", sa.String(length=100), nullable=False),
        sa.Column("ultimos_4_digitos", sa.String(length=4), nullable=True),
        sa.Column("franquicia", sa.String(length=30), nullable=True),
        sa.Column("activa", sa.Boolean(), default=True),
        sa.Column("fecha_creacion", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("fuentes_pago")