# alembic/versions/e5f6a7b8c9d0_agregar_enlace_a_notificaciones.py
from alembic import op
import sqlalchemy as sa

revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("notificaciones", sa.Column("enlace", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("notificaciones", "enlace")