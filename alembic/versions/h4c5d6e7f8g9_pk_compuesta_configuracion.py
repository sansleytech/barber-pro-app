# alembic/versions/h4c5d6e7f8g9_pk_compuesta_configuracion.py
from alembic import op
import sqlalchemy as sa

revision = "h4c5d6e7f8g9"
down_revision = "g3b4c5d6e7f8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # MySQL no permite modificar una PK directamente; hay que recrearla.
    op.execute("ALTER TABLE configuracion DROP PRIMARY KEY")
    op.execute("ALTER TABLE configuracion ADD PRIMARY KEY (id_barberia, clave)")


def downgrade() -> None:
    op.execute("ALTER TABLE configuracion DROP PRIMARY KEY")
    op.execute("ALTER TABLE configuracion ADD PRIMARY KEY (clave)")