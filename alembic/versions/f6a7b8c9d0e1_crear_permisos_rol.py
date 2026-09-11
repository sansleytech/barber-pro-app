# alembic/versions/f6a7b8c9d0e1_crear_permisos_rol.py
from alembic import op
import sqlalchemy as sa

revision = "f6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "permisos_rol",
        sa.Column("id_permiso", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("ruta", sa.String(length=60), nullable=False, unique=True),
        sa.Column("administrador", sa.Boolean(), default=True),
        sa.Column("recepcionista", sa.Boolean(), default=False),
        sa.Column("barbero", sa.Boolean(), default=False),
    )


def downgrade() -> None:
    op.drop_table("permisos_rol")