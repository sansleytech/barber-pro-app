
from alembic import op
import sqlalchemy as sa

revision = "b8c9d0e1f2a3"
down_revision = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "organizaciones",
        sa.Column("id_organizacion", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nombre", sa.String(length=150), nullable=False),
        sa.Column("fecha_creacion", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table(
        "usuarios_organizacion",
        sa.Column("id_usuario_organizacion", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("id_organizacion", sa.Integer(), sa.ForeignKey("organizaciones.id_organizacion", ondelete="CASCADE"), nullable=False),
        sa.Column("nombre_usuario", sa.String(length=50), nullable=False, unique=True),
        sa.Column("email", sa.String(length=120), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("activo", sa.String(length=1), default="1"),
        sa.Column("fecha_creacion", sa.DateTime(), server_default=sa.func.now()),
    )
    op.add_column("barberias", sa.Column("id_organizacion", sa.Integer(), sa.ForeignKey("organizaciones.id_organizacion", ondelete="SET NULL"), nullable=True))


def downgrade() -> None:
    op.drop_column("barberias", "id_organizacion")
    op.drop_table("usuarios_organizacion")
    op.drop_table("organizaciones")