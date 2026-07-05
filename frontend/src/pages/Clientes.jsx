import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Users, Search, Star } from "lucide-react";
import api from "../api/cliente";
import { useUI } from "../context/UIContext";
import Tabla from "../components/Tabla";

function Clientes() {
  const { confirmar, avisar } = useUI();
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  const cargarClientes = async () => {
    setCargando(true);
    setError("");
    try {
      const respuesta = await api.get("/clientes");
      setClientes(respuesta.data);
    } catch (err) {
      setError("No se pudieron cargar los clientes");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const eliminarCliente = (id, nombre) => {
    confirmar({
      titulo: "Confirmar",
      mensaje: `¿Seguro que querés desactivar a${nombre}?`,
      textoConfirmar: "Desactivar",
      onConfirmar: async () => {
        try {
          await api.delete(`/clientes/${id}`);
          cargarClientes();
          avisar("Se desactivó correctamente", "exito");
        } catch {
          avisar("No se pudo desactivar el cliente", "error");
        }
      },
    });
  };

  const filtrados = clientes.filter((c) => {
    const texto =
      `${c.primer_nombre} ${c.apellidos} ${c.telefono}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  // Definición de columnas para la tabla reutilizable
  const columnas = [
    {
      campo: "documento",
      titulo: "Documento",
      oculta: "hidden lg:table-cell",
      render: (c) => c.documento || "—",
    },
    {
      campo: "primer_nombre",
      titulo: "Nombre completo",
      render: (c) => (
        <div className="flex items-center gap-3">
          {c.foto ? (
            <img src={c.foto} alt={c.primer_nombre} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-gold text-sm font-bold">
              {c.primer_nombre?.[0]}{c.apellidos?.[0]}
            </div>
          )}
          <span className="text-white font-medium">
            {[c.primer_nombre, c.segundo_nombre, c.apellidos]
              .filter(Boolean)
              .join(" ")}
          </span>
          {c.es_vip && <Star className="w-4 h-4 text-gold fill-gold" />}
        </div>
      ),
    },
    {
      campo: "email",
      titulo: "Correo",
      oculta: "hidden md:table-cell",
      render: (c) => c.email || "—",
    },
    { campo: "telefono", titulo: "Teléfono" },
    {
      campo: "edad",
      titulo: "Edad",
      oculta: "hidden sm:table-cell",
      render: (c) => `${c.edad} años`,
    },
    {
      campo: "genero",
      titulo: "Género",
      oculta: "hidden lg:table-cell",
      render: (c) => c.genero || "—",
    },

    {
      campo: "notas",
      titulo: "Notas",
      ordenable: false,
      oculta: "hidden xl:table-cell",
      render: (c) => (
        <span className="text-gray-400 text-sm">
          {c.notas
            ? c.notas.length > 30
              ? c.notas.slice(0, 30) + "…"
              : c.notas
            : "—"}
        </span>
      ),
    },
    {
      campo: "acciones",
      titulo: "Acciones",
      ordenable: false,
      alinear: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => navigate(`/clientes/editar/${c.id_cliente}`)}
            className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => eliminarCliente(c.id_cliente, c.primer_nombre)}
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
          <h1 className="text-3xl font-bold text-white mb-1">Clientes</h1>
          <p className="text-gray-400">Gestioná los clientes de tu barbería</p>
        </div>
        <button
          onClick={() => navigate("/clientes/nuevo")}
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo cliente
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
          className="w-full bg-ink-card border border-line rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {cargando ? (
        <div className="text-center py-16 text-gray-500">
          Cargando clientes...
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
            busqueda ? "No se encontraron clientes" : "Todavía no hay clientes"
          }
        />
      )}
    </div>
  );
}

export default Clientes;
