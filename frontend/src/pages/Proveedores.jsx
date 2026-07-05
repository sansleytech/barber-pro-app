import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, Truck } from "lucide-react";
import api from "../api/cliente";
import { useUI } from "../context/UIContext";
import Tabla from "../components/Tabla";

function Proveedores() {
  const { confirmar, avisar } = useUI();
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  const cargarProveedores = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await api.get("/proveedores");
      setProveedores(res.data);
    } catch (err) {
      setError("No se pudieron cargar los proveedores");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const eliminarProveedor = (id, nombre) => {
    confirmar({
      titulo: "Confirmar",
      mensaje: `¿Seguro que querés desactivar a${nombre}?`,
      textoConfirmar: "Desactivar",
      onConfirmar: async () => {
        try {
          await api.delete(`/proveedores/${id}`);
          cargarProveedores();
          avisar("Se desactivó correctamente", "exito");
        } catch {
          avisar("No se pudo desactivar el proveedor", "error");
        }
      },
    });
  };

  const filtrados = proveedores.filter((p) =>
    `${p.nombre} ${p.telefono || ""} ${p.email || ""}`
      .toLowerCase()
      .includes(busqueda.toLowerCase()),
  );

  const columnas = [
    {
      campo: "nombre",
      titulo: "Proveedor",
      render: (p) => <span className="text-white font-medium">{p.nombre}</span>,
    },
    { campo: "telefono", titulo: "Teléfono", render: (p) => p.telefono || "—" },
    {
      campo: "email",
      titulo: "Correo",
      oculta: "hidden md:table-cell",
      render: (p) => p.email || "—",
    },
    {
      campo: "direccion",
      titulo: "Dirección",
      oculta: "hidden lg:table-cell",
      render: (p) => p.direccion || "—",
    },
    {
      campo: "acciones",
      titulo: "Acciones",
      ordenable: false,
      alinear: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => navigate(`/proveedores/editar/${p.id_proveedor}`)}
            className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => eliminarProveedor(p.id_proveedor, p.nombre)}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Desactivar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Proveedores</h1>
          <p className="text-gray-400">
            Gestioná los proveedores de tu barbería
          </p>
        </div>
        <button
          onClick={() => navigate("/proveedores/nuevo")}
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo proveedor
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar proveedor..."
          className="w-full bg-ink-card border border-line rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {cargando ? (
        <div className="text-center py-16 text-gray-500">
          Cargando proveedores...
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
            busqueda
              ? "No se encontraron proveedores"
              : "Todavía no hay proveedores"
          }
        />
      )}
    </div>
  );
}

export default Proveedores;
