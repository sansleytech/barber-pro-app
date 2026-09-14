# alembic/versions/i5d6e7f8g9h0_unicidad_barbero_categoria_por_barberia.py
from alembic import op
import sqlalchemy as sa

revision = "i5d6e7f8g9h0"
down_revision = "h4c5d6e7f8g9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("email", table_name="barberos")
    op.create_unique_constraint("uq_barbero_email_barberia", "barberos", ["email", "id_barberia"])

    op.drop_index("nombre", table_name="categorias_productos")
    op.create_unique_constraint("uq_categoria_nombre_barberia", "categorias_productos", ["nombre", "id_barberia"])


def downgrade() -> None:
    op.drop_constraint("uq_categoria_nombre_barberia", "categorias_productos", type_="unique")
    op.create_unique_constraint("nombre", "categorias_productos", ["nombre"])

    op.drop_constraint("uq_barbero_email_barberia", "barberos", type_="unique")
    op.create_unique_constraint("email", "barberos", ["email"])