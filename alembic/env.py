"""Entorno de Alembic, conectado con la config y los modelos del proyecto."""
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# --- Conexión con nuestro proyecto ---
from app.core.config import settings
from app.db.session import Base

# Importamos TODOS los modelos para que Alembic los conozca
from app.models.barbero import Barbero
from app.models.servicio import Servicio
from app.models.cliente import Cliente
from app.models.turno import Turno, TurnoServicio
from app.models.usuario import Usuario
from app.models.horario import HorarioBarbero
from app.models.configuracion import Configuracion
from app.models.categoria_producto import CategoriaProducto
from app.models.proveedor import Proveedor
from app.models.producto import Producto
from app.models.compra import CompraProducto
from app.models.venta import VentaProducto, VentaCarrito
from app.models.caja import GastoCaja, DescuentoCaja, CierreCaja
from app.models.valoracion import Valoracion
from app.models.notificacion import Notificacion
from app.models.contenido import CarouselSlide, FotoCliente
from app.models.acontecimiento import Acontecimiento
from app.models.codigo_qr import CodigoQR
from app.models.barberia import Barberia
from app.models.plan import Plan, Suscripcion

# Configuración estándar de Alembic
config = context.config

# Le pasamos la URL de la base desde nuestro .env
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata de nuestros modelos: lo que Alembic compara para detectar cambios
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Ejecuta migraciones en modo 'offline' (genera SQL sin conectar)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Ejecuta migraciones en modo 'online' (conectado a la base)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
