from alembic import op
import sqlalchemy as sa

revision = "j6e7f8g9h0i1"
down_revision = "i5d6e7f8g9h0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("usuarios", sa.Column("codigo_verificacion", sa.String(length=10), nullable=True))
    op.add_column("usuarios", sa.Column("codigo_verificacion_expira", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("usuarios", "codigo_verificacion_expira")
    op.drop_column("usuarios", "codigo_verificacion")
