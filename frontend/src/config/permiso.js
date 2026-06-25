export const PERMISOS = {
    "/dashboard": "todos",
    "/turnos": "todos",
    "/clientes": ["administrador", "recepcionista"],
    "/barberos": ["administrador", "recepcionista"],
    "/servicios": ["administrador", "recepcionista"],
    "/horarios": ["administrador"],
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
};

// ¿EL rol puede acceder a esta ruta base?

export function puedeAcceder(ruta, rol) {
    if (rol === "super_admin")
        return true; // Super_admin ve todo
    const permiso = PERMISOS[ruta];
    
    if(permiso === undefined)
        return true;

    if(permiso === "todos")
        return permiso.includes(rol);
}

