from alembic import op
import sqlalchemy as sa

revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pagos",
        sa.Column("id_pago", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("id_barberia", sa.Integer(), sa.ForeignKey("barberias.id_barberia", ondelete="CASCADE"), nullable=False),
        sa.Column("id_suscripcion", sa.Integer(), sa.ForeignKey("suscripciones.id_suscripcion", ondelete="SET NULL"), nullable=True),
        sa.Column("referencia", sa.String(100), nullable=False, unique=True),
        sa.Column("id_transaccion_wompi", sa.String(100), nullable=True),
        sa.Column("monto", sa.DECIMAL(10, 2), nullable=False),
        sa.Column("estado", sa.Enum("pendiente", "aprobado", "rechazado", "error", name="estadopagoenum"), nullable=False, server_default="pendiente"),
        sa.Column("metodo_pago", sa.String(50), nullable=True),
        sa.Column("fecha_creacion", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("fecha_actualizacion", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("pagos")
    op.execute("DROP TYPE IF EXISTS estadopagoenum")