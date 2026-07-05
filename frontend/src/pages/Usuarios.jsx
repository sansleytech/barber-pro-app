import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  ShieldCheck,
  Pencil,
  Power,
  Trash2,
  Link2,
} from "lucide-react";
import api from "../api/cliente";
import { useUI } from "../context/UIContext";
import Tabla from "../components/Tabla";
import { useAuth } from "../context/AuthContext";

function Usuarios() {
  const { confirmar, avisar } = useUI();
  const [usuarios, setUsuarios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();
  const { usuario: usuarioActual } = useAuth();

  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    try {
      const [resUsr, resBar] = await Promise.all([
        api.get("/usuarios"),
        api.get("/barberos"),
      ]);
      setUsuarios(resUsr.data);
      setBarberos(resBar.data);
    } catch (err) {
      setError("No se pudieron cargar los usuarios");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const nombreBarbero = (idBar) => {
    const b = barberos.find((x) => x.id_barbero === idBar);
    return b ? `${b.nombre} ${b.apellido}` : null;
  };

  const cambiarEstado = (u) => {
    const accion = u.activo ? "desactivar" : "activar";
    confirmar({
      titulo: accion === "activar" ? "Activar usuario" : "Desactivar usuario",
      mensaje: `¿Seguro que querés ${accion} a "${u.nombre_usuario}"?`,
      textoConfirmar: accion === "activar" ? "Activar" : "Desactivar",
      onConfirmar: async () => {
        try {
          await api.patch(`/usuarios/${u.id_usuario}/estado`);
          cargarDatos();
          avisar("Estado actualizado correctamente", "exito");
        } catch (err) {
          avisar(err.response?.data?.detail || "No se pudo cambiar el estado", "error");
        }
      },
    });
  };

  const eliminarUsuario = (u) => {
    confirmar({
      titulo: "Eliminar usuario",
      mensaje: `¿Seguro que querés eliminar a "${u.nombre_usuario}"?`,
      textoConfirmar: "Eliminar",
      onConfirmar: async () => {
        try {
          await api.delete(`/usuarios/${u.id_usuario}`);
          cargarDatos();
          avisar("Usuario eliminado correctamente", "exito");
        } catch (err) {
          avisar(err.response?.data?.detail || "No se pudo eliminar el usuario", "error");
        }
      },
    });
  };

  const filtrados = usuarios.filter((u) =>
    `${u.nombre_usuario} ${u.rol}`
      .toLowerCase()
      .includes(busqueda.toLowerCase()),
  );

  const badgeRol = (rol) => {
    const estilos = {
      administrador: "bg-gold/10 text-gold",
      recepcionista: "bg-blue-500/10 text-blue-400",
      barbero: "bg-emerald-500/10 text-emerald-400",
    };
    return estilos[rol] || "bg-gray-500/10 text-gray-400";
  };

  const formatoFecha = (fecha) => {
    if (!fecha) return "Nunca";
    return new Date(fecha).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const columnas = [
    {
      campo: "nombre_usuario",
      titulo: "Usuario",
      render: (u) => (
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{u.nombre_usuario}</span>
          {u.super_admin && (
            <ShieldCheck className="w-4 h-4 text-gold" title="Super admin" />
          )}
        </div>
      ),
    },
    {
      campo: "id_barbero",
      titulo: "Vinculado a",
      oculta: "hidden lg:table-cell",
      render: (u) =>
        nombreBarbero(u.id_barbero) ? (
          <span className="inline-flex items-center gap-1.5 text-gray-300 text-sm">
            <Link2 className="w-3.5 h-3.5 text-gray-500" />
            {nombreBarbero(u.id_barbero)}
          </span>
        ) : (
          <span className="text-gray-600">—</span>
        ),
    },
    {
      campo: "rol",
      titulo: "Rol",
      render: (u) => (
        <span
          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full capitalize ${badgeRol(u.rol)}`}
        >
          {u.rol}
        </span>
      ),
    },
    {
      campo: "activo",
      titulo: "Estado",
      oculta: "hidden sm:table-cell",
      render: (u) => (
        <span
          className={`inline-flex items-center gap-1.5 text-sm ${u.activo ? "text-emerald-400" : "text-gray-500"}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${u.activo ? "bg-emerald-400" : "bg-gray-500"}`}
          />
          {u.activo ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      campo: "ultimo_acceso",
      titulo: "Último acceso",
      oculta: "hidden xl:table-cell",
      render: (u) => (
        <span className="text-gray-400 text-sm">
          {formatoFecha(u.ultimo_acceso)}
        </span>
      ),
    },
    {
      campo: "acciones",
      titulo: "Acciones",
      ordenable: false,
      alinear: "right",
      render: (u) => {
        // No mostramos acciones para super admin ni para uno mismo
        const esUnoMismo = usuarioActual?.id_usuario === u.id_usuario;
        const bloqueado = u.super_admin || esUnoMismo;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => navigate(`/usuarios/editar/${u.id_usuario}`)}
              disabled={bloqueado}
              className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => cambiarEstado(u)}
              disabled={bloqueado}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                u.activo ? "bg-emerald-500" : "bg-gray-600"
              }`}
              title={u.activo ? "Desactivar" : "Activar"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  u.activo ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <button
              onClick={() => eliminarUsuario(u)}
              disabled={bloqueado}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Usuarios</h1>
          <p className="text-gray-400">Gestioná los accesos al sistema</p>
        </div>
        <button
          onClick={() => navigate("/usuarios/nuevo")}
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo usuario
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar usuario o rol..."
          className="w-full bg-ink-card border border-line rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {cargando ? (
        <div className="text-center py-16 text-gray-500">
          Cargando usuarios...
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
          {error}
        </div>
      ) : (
        <Tabla
          columnas={columnas}
          datos={filtrados}
          vacioTexto={
            busqueda ? "No se encontraron usuarios" : "Todavía no hay usuarios"
          }
        />
      )}
    </div>
  );
}

export default Usuarios;
