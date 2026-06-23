-- BARBER PRO APP - DATOS DE PRUEBA
INSERT INTO barberos (nombre, apellido, fecha_nacimiento, telefono, email, especialidad, fecha_ingreso, activo) VALUES
('Carlos',  'Ramirez',  '1990-03-15', '3001112233', 'carlos@barberkobe.com',  'Fade y diseños',      '2023-01-10', 1),
('Andres',  'Gomez',    '1988-07-22', '3004445566', 'andres@barberkobe.com',  'Clásico y barba',     '2023-03-05', 1),
('Julian',  'Torres',   '1995-11-30', '3007778899', 'julian@barberkobe.com',  'Cortes modernos',     '2024-02-20', 1),
('Mateo',   'Vargas',   '1992-05-08', '3002223344', 'mateo@barberkobe.com',   'Color y tratamientos','2024-06-01', 1);

INSERT INTO servicios (nombre, descripcion, precio, duracion_minutos, activo) VALUES
('Corte de cabello',   'Corte clásico o moderno',              25000, 30, 1),
('Corte + Barba',      'Corte completo con perfilado de barba',38000, 45, 1),
('Perfilado de barba', 'Arreglo y perfilado de barba',         18000, 20, 1),
('Corte infantil',     'Corte para niños menores de 12',       20000, 30, 1),
('Tinte',              'Coloración completa',                  60000, 90, 1),
('Mascarilla facial',  'Tratamiento facial relajante',         30000, 30, 1);

INSERT INTO clientes (primer_nombre, segundo_nombre, apellidos, fecha_nacimiento, genero, email, telefono, tipo_documento, documento, direccion, es_vip, activo) VALUES
('Juan',    'David',  'Perez Lopez',    '1995-06-23', 'masculino', 'juan.perez@mail.com',   '3011234567', 'CC', '1001234567', 'Calle 10 # 20-30',   1, 1),
('Santiago', NULL,    'Mejia Ruiz',     '1998-02-14', 'masculino', 'santi.mejia@mail.com',  '3019876543', 'CC', '1009876543', 'Carrera 50 # 12-15', 0, 1),
('Laura',   'Sofia',  'Castro Diaz',    '2000-11-05', 'femenino',  'laura.castro@mail.com', '3015551122', 'CC', '1005551122', 'Av Siempre Viva 742',0, 1),
('Pedro',    NULL,    'Gonzalez Mora',  '1985-09-30', 'masculino', 'pedro.g@mail.com',      '3013334455', 'CC', '1003334455', 'Calle 80 # 45-10',   1, 1),
('Camila',  'Andrea', 'Restrepo Velez', '1993-06-23', 'femenino',  'camila.r@mail.com',     '3017778800', 'CC', '1007778800', 'Transversal 3 # 5-5',0, 1),
('Diego',    NULL,    'Herrera Pino',   '1990-12-25', 'masculino', 'diego.h@mail.com',      '3012221100', 'CC', '1002221100', 'Calle 33 # 7-22',    0, 1);

INSERT INTO horarios_barbero (id_barbero, dia_semana, hora_inicio, hora_fin, pausa_inicio, pausa_fin) VALUES
(1, 1, '09:00:00', '18:00:00', '13:00:00', '14:00:00'),
(1, 2, '09:00:00', '18:00:00', '13:00:00', '14:00:00'),
(1, 3, '09:00:00', '18:00:00', '13:00:00', '14:00:00'),
(1, 4, '09:00:00', '18:00:00', '13:00:00', '14:00:00'),
(1, 5, '09:00:00', '18:00:00', '13:00:00', '14:00:00'),
(2, 1, '08:00:00', '17:00:00', '12:00:00', '13:00:00'),
(2, 2, '08:00:00', '17:00:00', '12:00:00', '13:00:00'),
(2, 3, '08:00:00', '17:00:00', '12:00:00', '13:00:00'),
(3, 2, '11:00:00', '20:00:00', NULL, NULL),
(3, 3, '11:00:00', '20:00:00', NULL, NULL),
(3, 4, '11:00:00', '20:00:00', NULL, NULL);

INSERT INTO categorias_productos (nombre, color, icono, orden, activo) VALUES
('Cuidado capilar',  '#D4AF37', 'package',  1, 1),
('Barba',            '#8B4513', 'scissors', 2, 1),
('Herramientas',     '#2C3E50', 'tool',     3, 1),
('Cuidado facial',   '#16A085', 'smile',    4, 1);

INSERT INTO proveedores (nombre, telefono, email, direccion, notas, activo) VALUES
('Distribuidora BarberSupply', '6041234567', 'ventas@barbersupply.com',     'Bodega 5, Zona Industrial', 'Proveedor principal', 1),
('Importados Premium SAS',     '6047654321', 'info@importadospremium.com',  'Calle 100 # 20-30', 'Productos de gama alta', 1),
('Cosméticos del Valle',       '6049998877', 'contacto@cosmeticosvalle.com','Carrera 70 # 1-50', NULL, 1);

INSERT INTO productos (nombre, descripcion, marca, id_categoria, costo_actual, precio_venta, stock_actual, stock_minimo, stock_maximo, codigo_barras, activo) VALUES
('Cera modeladora mate', 'Fijación fuerte acabado mate',      'BarberPro',  1, 12000, 25000, 30, 5, 50, '7701001001', 1),
('Pomada brillo',        'Acabado con brillo',                'ClassicMan', 1, 14000, 28000, 18, 5, 40, '7701001002', 1),
('Aceite para barba',    'Hidrata y suaviza la barba',        'BeardKing',  2, 18000, 35000, 12, 5, 30, '7701001003', 1),
('Bálsamo para barba',   'Acondicionador sin enjuague',       'BeardKing',  2, 16000, 32000, 8,  5, 30, '7701001004', 1),
('Shampoo anticaspa',    'Uso profesional 500ml',             'PureHair',   1, 22000, 42000, 4,  5, 25, '7701001005', 1),
('Máquina de corte Pro', 'Inalámbrica profesional',           'WahlStyle',  3, 180000,320000,6,  2, 15, '7701001006', 1),
('Tijera profesional',   'Acero japonés 6.5"',                'SharpEdge',  3, 90000, 160000,10, 3, 20, '7701001007', 1),
('Mascarilla carbón',    'Limpieza facial profunda',          'PureSkin',   4, 8000,  18000, 25, 5, 50, '7701001008', 1);

INSERT INTO compras_productos (id_producto, id_proveedor, cantidad, costo_unitario, costo_total, fecha_compra, factura, observaciones) VALUES
(1, 1, 20, 12000, 240000, '2026-06-01', 'FAC-001', 'Reposición mensual'),
(3, 2, 10, 18000, 180000, '2026-06-05', 'FAC-002', 'Pedido barba'),
(5, 1, 15, 22000, 330000, '2026-06-10', 'FAC-003', 'Stock bajo');

INSERT INTO turnos (id_cliente, id_barbero, fecha, hora_inicio, hora_fin, precio_total, estado, metodo_pago, propina) VALUES
(1, 1, '2026-06-20', '09:00:00', '09:30:00', 25000, 'completado', 'efectivo',      5000),
(2, 1, '2026-06-20', '10:00:00', '10:45:00', 38000, 'completado', 'tarjeta',       3000),
(3, 2, '2026-06-20', '11:00:00', '11:20:00', 18000, 'completado', 'efectivo',      0),
(4, 1, '2026-06-21', '09:00:00', '09:30:00', 25000, 'completado', 'transferencia', 10000),
(5, 3, '2026-06-21', '14:00:00', '15:30:00', 60000, 'completado', 'tarjeta',       0),
(6, 2, '2026-06-22', '08:00:00', '08:45:00', 38000, 'completado', 'efectivo',      5000),
(1, 1, '2026-06-24', '09:00:00', '09:30:00', 25000, 'confirmado', NULL,            0),
(2, 3, '2026-06-24', '11:00:00', '11:30:00', 25000, 'pendiente',  NULL,            0),
(4, 1, '2026-06-19', '10:00:00', '10:30:00', 25000, 'no_asistio', NULL,            0),
(5, 2, '2026-06-19', '09:00:00', '09:45:00', 38000, 'cancelado',  NULL,            0);

INSERT INTO turno_servicios (id_turno, id_servicio, precio_aplicado, duracion_aplicada) VALUES
(1, 1, 25000, 30),
(2, 2, 38000, 45),
(3, 3, 18000, 20),
(4, 1, 25000, 30),
(5, 5, 60000, 90),
(6, 2, 38000, 45);

INSERT INTO ventas_productos (id_cliente, id_usuario_vendedor, subtotal, iva, total, metodo_pago, observaciones, fecha_venta) VALUES
(1,    1, 25000, 0, 25000, 'efectivo',      'Venta mostrador', '2026-06-20 09:35:00'),
(NULL, 1, 60000, 0, 60000, 'tarjeta',       NULL,              '2026-06-20 12:00:00'),
(4,    1, 35000, 0, 35000, 'efectivo',      'Cliente VIP',     '2026-06-21 09:40:00'),
(NULL, 1, 42000, 0, 42000, 'transferencia', NULL,              '2026-06-22 15:00:00');

INSERT INTO ventas_carrito (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 1, 25000, 25000),
(2, 1, 1, 25000, 25000),
(2, 3, 1, 35000, 35000),
(3, 3, 1, 35000, 35000),
(4, 5, 1, 42000, 42000);

INSERT INTO gastos_caja (concepto, monto, fecha, categoria, observaciones) VALUES
('Compra de toallas',       50000,  '2026-06-20', 'Insumos',       'Toallas nuevas'),
('Pago servicios públicos', 120000, '2026-06-20', 'Servicios',     'Luz y agua'),
('Café y snacks',           30000,  '2026-06-21', 'Varios',        'Para clientes'),
('Mantenimiento sillas',    80000,  '2026-06-22', 'Mantenimiento', NULL);

INSERT INTO descuentos_caja (concepto, monto, fecha, observaciones) VALUES
('Descuento cliente VIP', 5000,  '2026-06-20', 'Cliente frecuente'),
('Promo día del padre',   10000, '2026-06-21', 'Promoción especial');

INSERT INTO valoraciones_turnos (id_turno, id_barbero, id_cliente, estrellas, comentario) VALUES
(1, 1, 1, 5, 'Excelente corte, muy profesional'),
(2, 1, 2, 5, 'El mejor barbero, recomendado'),
(3, 2, 3, 4, 'Buen servicio, rápido'),
(4, 1, 4, 5, 'Siempre quedo conforme'),
(5, 3, 5, 4, 'Buen trabajo con el color'),
(6, 2, 6, 3, 'Correcto, nada especial');

INSERT INTO notificaciones (titulo, mensaje, tipo, id_usuario, leida) VALUES
('Bienvenido al sistema', 'Barber Pro App está lista para usar',     'info',         NULL, 0),
('Stock bajo',            'El shampoo anticaspa está por agotarse',  'alerta',       NULL, 0),
('Recordatorio de turno', 'Tienes turnos pendientes para mañana',    'recordatorio', NULL, 0);

INSERT INTO acontecimientos (titulo, descripcion, tipo, fecha, id_cliente, activo) VALUES
('Cumpleaños Juan Perez', 'Cliente cumple años hoy',   'cumpleanos',  '2026-06-23', 1,    1),
('Aniversario barbería',  '2 años de Barber Kobe',     'aniversario', '2026-07-15', NULL, 1),
('Promo julio',           '20% en tintes todo el mes', 'promocion',   '2026-07-01', NULL, 1);

INSERT INTO carousel_slides (titulo, subtitulo, imagen, texto_boton, enlace_boton, orden, activo) VALUES
('Bienvenido a Barber Kobe', 'Tu estilo, nuestra pasión',         '/img/slide1.jpg', 'Reservar ahora', '/reservar',  1, 1),
('Cortes profesionales',     'Los mejores barberos de la ciudad', '/img/slide2.jpg', 'Ver servicios',  '/servicios', 2, 1),
('Productos premium',        'Cuida tu estilo en casa',           '/img/slide3.jpg', NULL,             NULL,         3, 1);

INSERT INTO fotos_cliente (id_cliente, imagen, descripcion, activo) VALUES
(1,    '/img/trabajo1.jpg', 'Fade clásico',          1),
(2,    '/img/trabajo2.jpg', 'Corte + barba',         1),
(NULL, '/img/trabajo3.jpg', 'Diseño personalizado',  1);

INSERT INTO codigos_qr (nombre, tipo, url_destino, id_barbero) VALUES
('QR Sistema',         'sistema', 'http://localhost:5173',                     NULL),
('QR Reservar Carlos', 'barbero', 'http://localhost:5173/reservar/barbero/1',  1),
('QR Reservar Andres', 'barbero', 'http://localhost:5173/reservar/barbero/2',  2);

SELECT '✅ Datos de prueba insertados correctamente' AS resultado;
