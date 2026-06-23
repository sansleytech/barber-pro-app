-- Desactiva chequeo de FK para poder vaciar en cualquier orden
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE turno_servicios;
TRUNCATE TABLE valoraciones_turnos;
TRUNCATE TABLE ventas_carrito;
TRUNCATE TABLE ventas_productos;
TRUNCATE TABLE compras_productos;
TRUNCATE TABLE turnos;
TRUNCATE TABLE horarios_barbero;
TRUNCATE TABLE productos;
TRUNCATE TABLE categorias_productos;
TRUNCATE TABLE proveedores;
TRUNCATE TABLE gastos_caja;
TRUNCATE TABLE descuentos_caja;
TRUNCATE TABLE cierres_caja;
TRUNCATE TABLE notificaciones;
TRUNCATE TABLE acontecimientos;
TRUNCATE TABLE carousel_slides;
TRUNCATE TABLE fotos_cliente;
TRUNCATE TABLE codigos_qr;
TRUNCATE TABLE clientes;
TRUNCATE TABLE barberos;
-- OJO: NO tocamos usuarios ni configuracion (los dejamos como están)

SET FOREIGN_KEY_CHECKS = 1;

SELECT '🧹 Tablas vaciadas. Ahora cargá datos_prueba.sql' AS paso;
