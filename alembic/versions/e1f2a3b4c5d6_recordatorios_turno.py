from alembic import op
import sqlalchemy as sa

revision = "e1f2a3b4c5d6"
down_revision = "d0e1f2a3b4c5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("turnos", sa.Column("recordatorio_enviado", sa.Boolean(), server_default=sa.false(), nullable=True))
    op.add_column("turnos", sa.Column("encuesta_enviada", sa.Boolean(), server_default=sa.false(), nullable=True))


def downgrade() -> None:
    op.drop_column("turnos", "encuesta_enviada")
    op.drop_column("turnos", "recordatorio_enviado")