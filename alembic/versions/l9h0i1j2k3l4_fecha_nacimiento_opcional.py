# alembic/versions/l9h0i1j2k3l4_fecha_nacimiento_opcional.py
from alembic import op
import sqlalchemy as sa

revision = "l9h0i1j2k3l4"
down_revision = "k8g9h0i1j2k3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("clientes", "fecha_nacimiento", existing_type=sa.Date(), nullable=True)


def downgrade() -> None:
    op.alter_column("clientes", "fecha_nacimiento", existing_type=sa.Date(), nullable=False)