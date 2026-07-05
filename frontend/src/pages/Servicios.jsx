import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import api from "../api/cliente";
import { useUI } from "../context/UIContext";
import Tabla from "../components/Tabla";

function Servicios() {
  const { confirmar, avisar } = useUI();
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  const cargarServicios = async () => {
    setCargando(true);
    setError("");
    try {
      const respuesta = await api.get("/servicios");
      setServicios(respuesta.data);
    } catch (err) {
      setError("No se pudieron cargar los servicios");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarServicios();
  }, []);

  const eliminarServicio = (id, nombre) => {
    confirmar({
      titulo: "Confirmar",
      mensaje: `¿Seguro que querés desactivar "${nombre}"?`,
      textoConfirmar: "Desactivar",
      onConfirmar: async () => {
        try {
          await api.delete(`/servicios/${id}`);
          cargarServicios();
          avisar("Se desactivó correctamente", "exito");
        } catch {
          avisar("No se pudo desactivar el servicio", "error");
        }
      },
    });
  };

  const filtrados = servicios.filter((s) =>
    `${s.nombre} ${s.descripcion || ""}`
      .toLowerCase()
      .includes(busqueda.toLowerCase()),
  );

  // Formatea un número como dinero colombiano
  const formatoPrecio = (valor) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor);

  const columnas = [
    {
      campo: "nombre",
      titulo: "Servicio",
      render: (s) => <span className="text-white font-medium">{s.nombre}</span>,
    },
    {
      campo: "descripcion",
      titulo: "Descripción",
      oculta: "hidden md:table-cell",
      render: (s) => s.descripcion || "—",
    },
    {
      campo: "precio",
      titulo: "Precio",
      render: (s) => (
        <span className="text-gold font-medium">{formatoPrecio(s.precio)}</span>
      ),
    },
    {
      campo: "duracion_minutos",
      titulo: "Duración",
      render: (s) => `${s.duracion_minutos} min`,
    },
    {
      campo: "acciones",
      titulo: "Acciones",
      ordenable: false,
      alinear: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => navigate(`/servicios/editar/${s.id_servicio}`)}
            className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => eliminarServicio(s.id_servicio, s.nombre)}
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
          <h1 className="text-3xl font-bold text-white mb-1">Servicios</h1>
          <p className="text-gray-400">Gestioná los servicios de tu barbería</p>
        </div>
        <button
          onClick={() => navigate("/servicios/nuevo")}
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo servicio
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar servicio..."
          className="w-full bg-ink-card border border-line rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {cargando ? (
        <div className="text-center py-16 text-gray-500">
          Cargando servicios...
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
              ? "No se encontraron servicios"
              : "Todavía no hay servicios"
          }
        />
      )}
    </div>
  );
}

export default Servicios;
