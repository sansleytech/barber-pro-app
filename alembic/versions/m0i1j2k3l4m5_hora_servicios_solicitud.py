from alembic import op
import sqlalchemy as sa

revision = "m0i1j2k3l4m5"
down_revision = "l9h0i1j2k3l4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("solicitudes_turno", sa.Column("hora_preferida", sa.Time(), nullable=True))
    op.add_column("solicitudes_turno", sa.Column("ids_servicios", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("solicitudes_turno", "ids_servicios")
    op.drop_column("solicitudes_turno", "hora_preferida")
