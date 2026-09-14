# alembic/versions/g3b4c5d6e7f8_unicidad_cliente_por_barberia.py
from alembic import op
import sqlalchemy as sa

revision = "g3b4c5d6e7f8"
down_revision = "f2a3b4c5d6e7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Quitamos la unicidad global de documento y email...
    op.drop_index("documento", table_name="clientes")
    op.drop_index("email", table_name="clientes")
    # ...y la reemplazamos por unicidad compuesta (documento/email + id_barberia).
    op.create_unique_constraint("uq_cliente_documento_barberia", "clientes", ["documento", "id_barberia"])
    op.create_unique_constraint("uq_cliente_email_barberia", "clientes", ["email", "id_barberia"])


def downgrade() -> None:
    op.drop_constraint("uq_cliente_email_barberia", "clientes", type_="unique")
    op.drop_constraint("uq_cliente_documento_barberia", "clientes", type_="unique")
    op.create_unique_constraint("documento", "clientes", ["documento"])
    op.create_unique_constraint("email", "clientes", ["email"])