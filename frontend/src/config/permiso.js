export const PERMISOS = {
  "/dashboard": "todos",
  "/turnos": "todos",
  "/calendario": "todos",
  "/recordatorios": "todos",
  "/clientes": ["administrador", "recepcionista"],
  "/barberos": ["administrador", "recepcionista"],
  "/servicios": ["administrador", "recepcionista"],
  "/horarios": ["administrador"],
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
  "/reportes": ["administrador"],
  "/galeria": ["administrador"],
};

// ¿El rol puede acceder a esta ruta base?
export function puedeAcceder(ruta, rol) {
  if (rol === "super_admin") return true; // super_admin ve todo

  const permiso = PERMISOS[ruta];

  if (permiso === undefined) return true; // ruta no listada: permitida
  if (permiso === "todos") return true; // todos los roles pueden
  return permiso.includes(rol); // ¿el rol está en la lista?
}