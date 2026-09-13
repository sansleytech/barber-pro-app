from alembic import op
import sqlalchemy as sa

revision = "f2a3b4c5d6e7"
down_revision = "e1f2a3b4c5d6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("clientes", sa.Column("fecha_ultima_reactivacion", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("clientes", "fecha_ultima_reactivacion")