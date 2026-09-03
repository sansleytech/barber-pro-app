from alembic import op
import sqlalchemy as sa

revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("barberias", sa.Column("latitud", sa.String(30), nullable=True))
    op.add_column("barberias", sa.Column("longitud", sa.String(30), nullable=True))


def downgrade() -> None:
    op.drop_column("barberias", "longitud")
    op.drop_column("barberias", "latitud")