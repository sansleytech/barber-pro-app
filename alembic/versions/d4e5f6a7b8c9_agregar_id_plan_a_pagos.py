from alembic import op
import sqlalchemy as sa

revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "pagos",
        sa.Column("id_plan", sa.Integer(), sa.ForeignKey("planes.id_plan"), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("pagos", "id_plan")