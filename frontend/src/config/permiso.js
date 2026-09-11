// Valores de respaldo, usados solo si todavía no llegó la respuesta del
// backend (por ejemplo, en el primer instante tras el login) o si falla
// la conexión. La fuente de verdad real es la tabla permisos_rol.
const PERMISOS_RESPALDO = {
  "/dashboard": ["administrador", "recepcionista"],
  "/mi-dia": ["barbero"],
  "/turnos": "todos",
  "/calendario": "todos",
  "/recordatorios": "todos",
  "/clientes": ["administrador", "recepcionista"],
  "/barberos": ["administrador"],
  "/servicios": ["administrador", "recepcionista"],
  "/horarios": ["administrador", "barbero"],
  "/usuarios": ["administrador"],
  "/valoraciones": "todos",
  "/acontecimientos": ["administrador", "recepcionista"],
  "/notificaciones": "todos",
  "/productos": ["administrador"],
  "/categorias": ["administrador"],
  "/proveedores": ["administrador"],
  "/compras": ["administrador"],
  "/ventas": ["administrador", "recepcionista"],
  "/caja": ["administrador"],
  "/configuracion": ["administrador"],
  "/qr": ["administrador"],
  "/solicitudes": ["administrador", "recepcionista"],
  "/reportes": ["administrador", "barbero"],
  "/galeria": ["administrador"],
  "/facturacion": ["administrador"],
};

// Se llena en tiempo real desde /auth/permisos-vigentes (ver AuthContext.jsx).
// Formato: { "/ruta": { administrador: bool, recepcionista: bool, barbero: bool } }
let permisosDinamicos = null;

export function setPermisosVigentes(datos) {
  permisosDinamicos = datos;
}

// ¿El rol puede acceder a esta ruta base?
export function puedeAcceder(ruta, rol, esSuperAdmin) {
  if (esSuperAdmin) return true; // super_admin ve todo

  // Prioridad 1: lo que vino de la base de datos (editable desde el panel).
  if (permisosDinamicos && permisosDinamicos[ruta]) {
    return !!permisosDinamicos[ruta][rol];
  }

  // Prioridad 2: respaldo fijo, por si todavía no cargaron los dinámicos.
  const permiso = PERMISOS_RESPALDO[ruta];
  if (permiso === undefined) return true; // ruta no listada: permitida
  if (permiso === "todos") return true;
  return permiso.includes(rol);
}