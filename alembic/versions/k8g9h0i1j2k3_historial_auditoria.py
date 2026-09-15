# alembic/versions/k8g9h0i1j2k3_historial_auditoria.py
from alembic import op
import sqlalchemy as sa

revision = "k8g9h0i1j2k3"
down_revision = "j7f8g9h0i1j2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "historial_auditoria",
        sa.Column("id_registro", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nombre_usuario", sa.String(length=50), nullable=False),
        sa.Column("accion", sa.String(length=100), nullable=False),
        sa.Column("detalle", sa.Text(), nullable=True),
        sa.Column("id_barberia_afectada", sa.Integer(), nullable=True),
        sa.Column("fecha", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("historial_auditoria")