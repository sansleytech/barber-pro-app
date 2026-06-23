# Barber Pro — Documento de Especificación
### SaaS multi-barbería para gestión de barberías
*Documento maestro del proyecto. Versión 1.0*

---

## 1. Visión del producto

**Barber Pro** es una plataforma SaaS (Software as a Service) que se ofrece por suscripción a barberías. Cada barbería tiene su propia cuenta aislada, se registra por autoservicio, prueba el sistema gratis (trial) y luego paga un plan mensual.

**Objetivo:** vender Barber Pro como producto a múltiples barberías, cada una gestionando su negocio de forma independiente.

---

## 2. Identidad visual

- **Nombre de plataforma:** Barber Pro
- **Referencia de estilo:** **Linear** (linear.app) — minimalista, premium, oscuro, ultra cuidado
- **Características del estilo Linear a replicar:**
  - Fondos oscuros profundos (casi negro, con sutiles matices fríos)
  - Tipografía limpia, legible, con buena jerarquía
  - Mucho espacio de respiro (aunque sea oscuro)
  - Bordes sutiles en vez de sombras pesadas
  - Transiciones y animaciones suaves
  - Gradientes delicados, acentos de color puntuales
  - Sensación de rapidez y precisión
- **Color de acento:** dorado (#D4AF37 o similar) — reemplaza el violeta de Linear
- **Paleta:** negro profundo + dorado de acento
- **Modo:** oscuro principal (estilo Linear) + modo claro disponible (el usuario elige)
- **Nota:** "Barber Kobe" NO es el nombre del producto — es el nombre de una barbería cliente de ejemplo (va en la configuración de cada cuenta).

---

## 3. Tipos de usuario

| Usuario | Acceso | Descripción |
|---|---|---|
| **Super Admin (vos)** | Panel SaaS | Gestiona todas las barberías, planes, suscripciones |
| **Dueño de barbería** | Panel de su barbería | Administra su propio negocio |
| **Recepcionista** | Panel (limitado) | Operación diaria de su barbería |
| **Barbero** | Panel (limitado) | Su agenda y turnos |
| **Cliente final** | Cara pública | Reserva turnos SIN cuenta (solo deja datos) |

**Login del panel:** usuario o correo + contraseña (fase 1). Login con Google/redes (fase posterior).

---

## 4. Arquitectura SaaS (multi-tenancy)

Este es el corazón del cambio respecto al backend actual.

**Concepto:** cada barbería es un "tenant" (inquilino). Todos sus datos están aislados de las demás.

**Lo que hay que agregar al backend actual:**
- Tabla `barberias` (tenants): nombre, NIT, plan, estado, fecha de registro, trial hasta, etc.
- Tabla `planes`: nombre, precio, límites (cant. barberos, features habilitadas).
- Tabla `suscripciones`: qué barbería tiene qué plan, vigencia, estado de pago.
- Columna `id_barberia` en TODAS las tablas de datos (barberos, clientes, turnos, productos, etc.).
- Filtrado automático: cada consulta solo ve los datos de SU barbería.
- El token JWT debe incluir el `id_barberia` del usuario.
- Registro autoservicio: una barbería nueva se crea sola con su admin inicial.

---

## 5. Funcionalidades

### Panel de gestión (por barbería)
- Dashboard con métricas (ingresos, turnos del día, alertas de stock)
- Calendario / agenda visual de turnos
- Gestión de clientes con historial
- Gestión de barberos, servicios, horarios
- Inventario (productos, categorías, proveedores, compras)
- Ventas (POS) y caja (cierres, gastos, descuentos)
- Valoraciones, notificaciones
- Reportes y gráficos (ventas, barbero top, estadísticas)
- Permisos finos por usuario (tabla usuario_permisos)
- Configuración de la barbería

### Cara pública (clientes)
- Landing atractiva
- Reserva de turnos: elige **barbero → servicio → día/hora disponible**
- Galería de trabajos
- Valoraciones visibles
- Confirmación en pantalla (fase 1) + correo/WhatsApp (fase posterior)

### Panel SaaS (super admin = vos)
- Ver/gestionar todas las barberías
- Gestionar planes y precios
- Ver suscripciones y estados de pago
- Métricas del negocio (cuántas barberías, ingresos por suscripción)

---

## 6. Integraciones (fases posteriores — dependen de servicios externos de pago)

| Integración | Servicio necesario | Notas |
|---|---|---|
| **Email** (login, confirmaciones) | SendGrid / Resend | Costo por volumen |
| **WhatsApp** (recordatorios, confirmaciones, promos, cumpleaños) | WhatsApp Business API (Meta) | Requiere número verificado y aprobación, costo por mensaje |
| **Pagos online** (cliente paga al reservar, opcional) | Wompi / MercadoPago / Stripe | Comisión por transacción |
| **Pagos de suscripción** (barberías te pagan) | Stripe / MercadoPago suscripciones | Pagos recurrentes |
| **Facturación PDF** (recibos internos) | Librería local (reportlab) | Sin costo externo |
| **Facturación electrónica DIAN** | Proveedor autorizado DIAN | Requiere habilitación legal en Colombia |

---

## 7. Plan de fases (orden de construcción realista)

### FASE 0 — Convertir el backend a multi-tenant ⚠️ (lo primero)
Sin esto, no hay SaaS. Antes de cualquier frontend.
1. Tabla `barberias`, `planes`, `suscripciones`
2. Agregar `id_barberia` a todas las tablas existentes (migración)
3. Modificar el login para incluir `id_barberia` en el token
4. Filtrar todas las consultas por barbería
5. Endpoint de registro autoservicio (crear barbería + admin + trial)

### FASE 1 — Frontend base + panel de una barbería
6. Configurar React (Tailwind, rutas, conexión API)
7. Login y autenticación
8. Dashboard
9. Las vistas CRUD (barberos, servicios, clientes, turnos, etc.)

### FASE 2 — Cara pública
10. Landing + galería + valoraciones
11. Flujo de reserva de turnos

### FASE 3 — Panel SaaS (super admin)
12. Gestión de barberías, planes, suscripciones

### FASE 4 — Pagos y suscripciones
13. Integrar pasarela de pago para las suscripciones
14. Trial → cobro automático

### FASE 5 — Integraciones de mensajería
15. Email (confirmaciones, login)
16. WhatsApp (recordatorios, promos)

### FASE 6 — Facturación
17. Recibos PDF internos
18. Facturación electrónica DIAN

### FASE 7 — Despliegue a producción
19. Hosting (backend + base de datos + frontend), dominio, HTTPS

---

## 8. Seguridad (requisito transversal — "lo más seguro posible")

Aplica en todas las fases:
- Aislamiento total de datos entre barberías (un tenant nunca ve datos de otro)
- Contraseñas hasheadas (ya implementado con bcrypt)
- JWT con expiración (ya implementado)
- HTTPS en producción
- Validación de datos en backend (ya implementado con Pydantic)
- Rate limiting (limitar intentos de login)
- Variables sensibles en .env, nunca en el código (ya implementado)
- Backups automáticos de la base de datos en producción

---

## 9. Estado actual del proyecto

**Backend (hecho):** 19 tablas, login JWT + roles, lógica completa de turnos/inventario/ventas/caja, valoraciones, notificaciones, contenido, acontecimientos, QR. **PERO es de una sola barbería — falta multi-tenancy.**

**Frontend:** proyecto creado con Vite (carpeta `frontend`). Sin construir aún.

**Próximo paso:** FASE 0 — convertir el backend a multi-tenant.

---

## 10. Nota sobre el aprendizaje

Este es un proyecto de nivel avanzado (SaaS multi-tenant con suscripciones). Se construye paso a paso, con paciencia. Cada concepto nuevo se explica antes de implementarlo. El objetivo es que Santiago entienda lo que construye, no solo que funcione.