import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, Tags } from "lucide-react";
import api from "../api/cliente";
import { useUI } from "../context/UIContext";
import Tabla from "../components/Tabla";

function Categorias() {
  const { confirmar, avisar } = useUI();
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  const cargarCategorias = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await api.get("/categorias");
      setCategorias(res.data);
    } catch (err) {
      setError("No se pudieron cargar las categorías");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const eliminarCategoria = (id, nombre) => {
    confirmar({
      titulo: "Confirmar",
      mensaje: `¿Seguro que querés desactivar "${nombre}"?`,
      textoConfirmar: "Desactivar",
      onConfirmar: async () => {
        try {
          await api.delete(`/categorias/${id}`);
          cargarCategorias();
          avisar("Se desactivó correctamente", "exito");
        } catch {
          avisar("No se pudo desactivar la categoría", "error");
        }
      },
    });
  };

  const filtrados = categorias.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const columnas = [
    {
      campo: "nombre",
      titulo: "Categoría",
      render: (c) => (
        <div className="flex items-center gap-3">
          <span
            className="w-4 h-4 rounded-full border border-line shrink-0"
            style={{ backgroundColor: c.color || "#D4AF37" }}
          />
          <span className="text-white font-medium">{c.nombre}</span>
        </div>
      ),
    },
    {
      campo: "color",
      titulo: "Color",
      oculta: "hidden md:table-cell",
      render: (c) => (
        <span className="text-gray-400 text-sm">{c.color || "—"}</span>
      ),
    },
    {
      campo: "orden",
      titulo: "Orden",
      oculta: "hidden sm:table-cell",
      render: (c) => c.orden ?? 0,
    },
    {
      campo: "acciones",
      titulo: "Acciones",
      ordenable: false,
      alinear: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => navigate(`/categorias/editar/${c.id_categoria}`)}
            className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => eliminarCategoria(c.id_categoria, c.nombre)}
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
          <h1 className="text-3xl font-bold text-white mb-1">Categorías</h1>
          <p className="text-gray-400">Organizá tus productos por categoría</p>
        </div>
        <button
          onClick={() => navigate("/categorias/nuevo")}
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva categoría
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar categoría..."
          className="w-full bg-ink-card border border-line rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {cargando ? (
        <div className="text-center py-16 text-gray-500">
          Cargando categorías...
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
              ? "No se encontraron categorías"
              : "Todavía no hay categorías"
          }
        />
      )}
    </div>
  );
}

export default Categorias;
