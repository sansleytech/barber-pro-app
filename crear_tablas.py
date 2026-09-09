"""Script para crear las tablas en la base de datos."""

from app.db.session import Base, engine

from app.models.barberia import Barberia
from app.models.barbero import Barbero
from app.models.servicio import Servicio
from app.models.cliente import Cliente
from app.models.turno import Turno, TurnoServicio
from app.models.solicitud_turno import SolicitudTurno
from app.models.usuario import Usuario
from app.models.horario import HorarioBarbero
from app.models.configuracion import Configuracion
from app.models.categoria_producto import CategoriaProducto
from app.models.proveedor import Proveedor
from app.models.producto import Producto
from app.models.compra import CompraProducto
from app.models.venta import VentaProducto, VentaCarrito
from app.models.caja import CajaDescuento, Gasto, CierreCaja
from app.models.valoracion import Valoracion
from app.models.notificacion import Notificacion
from app.models.contenido import CarouselSlide, FotoCliente
from app.models.acontecimiento import Acontecimiento
from app.models.codigo_qr import CodigoQR
from app.models.galeria import FotoGaleria
from app.models.categoria_galeria import CategoriaGaleria
from app.models.plan import Plan, Suscripcion
from app.models.pago import Pago

print("Creando tablas...")
Base.metadata.create_all(bind=engine)
print("✅ Tablas creadas correctamente")