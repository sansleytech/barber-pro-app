import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/cliente";
import { setPermisosVigentes } from "../config/permiso";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem("usuario");
    return guardado ? JSON.parse(guardado) : null;
  });
  const [permisosListos, setPermisosListos] = useState(false);

  const cargarPermisos = async () => {
    try {
      const res = await api.get("/auth/permisos-vigentes");
      setPermisosVigentes(res.data);
    } catch {
      // Si falla (por ejemplo, sin conexión), permiso.js usa sus valores
      // por defecto de respaldo, así la app no se rompe.
    } finally {
      setPermisosListos(true);
    }
  };

  // Al recargar la página con sesión ya activa, volvemos a traer los
  // permisos vigentes (por si cambiaron desde la última vez).
  useEffect(() => {
    if (usuario) {
      cargarPermisos();
    } else {
      setPermisosListos(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (datos) => {
    localStorage.setItem("token", datos.access_token);
    localStorage.setItem("usuario", JSON.stringify(datos.usuario));
    setUsuario(datos.usuario);
    await cargarPermisos();
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, permisosListos }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}