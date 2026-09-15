from alembic import op
import sqlalchemy as sa

revision = "j7f8g9h0i1j2"
down_revision = "j6e7f8g9h0i1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("fuentes_pago", sa.Column("exp_mes", sa.String(length=2), nullable=True))
    op.add_column("fuentes_pago", sa.Column("exp_anio", sa.String(length=4), nullable=True))
    op.add_column("fuentes_pago", sa.Column("aviso_vencimiento_enviado", sa.Boolean(), server_default=sa.false(), nullable=True))


def downgrade() -> None:
    op.drop_column("fuentes_pago", "aviso_vencimiento_enviado")
    op.drop_column("fuentes_pago", "exp_anio")
    op.drop_column("fuentes_pago", "exp_mes")
