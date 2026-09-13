# alembic/versions/c9d0e1f2a3b4_precio_anterior_plan.py
from alembic import op
import sqlalchemy as sa

revision = "c9d0e1f2a3b4"
down_revision = "b8c9d0e1f2a3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("planes", sa.Column("precio_anterior", sa.DECIMAL(10, 2), nullable=True))


def downgrade() -> None:
    op.drop_column("planes", "precio_anterior")