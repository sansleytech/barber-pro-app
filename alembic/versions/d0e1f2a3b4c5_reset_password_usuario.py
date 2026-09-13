# alembic/versions/d0e1f2a3b4c5_reset_password_usuario.py
from alembic import op
import sqlalchemy as sa

revision = "d0e1f2a3b4c5"
down_revision = "c9d0e1f2a3b4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("usuarios", sa.Column("reset_token", sa.String(length=255), nullable=True))
    op.add_column("usuarios", sa.Column("reset_token_expira", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("usuarios", "reset_token_expira")
    op.drop_column("usuarios", "reset_token")