import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Clock, Phone, User, Calendar, MessageSquare, Scissors } from "lucide-react";
import api from "../api/cliente";

const FILTROS = [
  { valor: "pendiente", label: "Pendientes" },
  { valor: "atendida", label: "Atendidas" },
  { valor: "descartada", label: "Descartadas" },
  { valor: "", label: "Todas" },
];

const FRANJAS = {
  manana: "Mañana", tarde: "Tarde", noche: "Noche", cualquiera: "Cualquiera",
};

function Solicitudes() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [filtro, setFiltro] = useState("pendiente");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = async () => {
    setCargando(true);
    setError("");
    try {
      const url = filtro ? `/solicitudes?estado=${filtro}` : "/solicitudes";
      const [resS, resB] = await Promise.all([
        api.get(url),
        api.get("/barberos"),
      ]);
      setSolicitudes(resS.data);
      setBarberos(resB.data);
    } catch (err) {
      setError("No se pudieron cargar las solicitudes");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [filtro]);

  const nombreBarbero = (id) => {
    const b = barberos.find((x) => x.id_barbero === id);
    return b ? `${b.nombre} ${b.apellido}` : "Cualquiera";
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.patch(`/solicitudes/${id}/estado`, { estado: nuevoEstado });
      cargar();
    } catch (err) {
      setError("No se pudo actualizar la solicitud");
    }
  };

  const agendar = (s) => {
    // Vamos al formulario de turno pasando los datos de la solicitud
    navigate('/turnos/nuevo', { state: { desdeSolicitud: {
      id_solicitud: s.id_solicitud,
      documento: s.documento,
      nombre_cliente: s.nombre_cliente,
      id_barbero: s.id_barbero,
      fecha_preferida: s.fecha_preferida,
    } } });
  };

  const formatFecha = (f) => {
    if (!f) return null;
    return new Date(f + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Solicitudes de turno</h1>
        <p className="text-gray-400">Pedidos de turno desde el portal público</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6">{error}</div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTROS.map((f) => (
          <button key={f.valor} onClick={() => setFiltro(f.valor)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtro === f.valor ? "bg-gold text-ink" : "bg-ink-card text-gray-400 hover:text-white border border-line"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="text-center py-16 text-gray-500">Cargando solicitudes...</div>
      ) : solicitudes.length === 0 ? (
        <div className="bg-ink-card border border-line rounded-2xl p-12 text-center">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">No hay solicitudes {filtro && `(${FILTROS.find(f => f.valor === filtro)?.label.toLowerCase()})`}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {solicitudes.map((s) => (
            <div key={s.id_solicitud} className="bg-ink-card border border-line rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">{s.nombre_cliente}</div>
                    {s.documento && <div className="text-xs text-gray-500">Doc: {s.documento}</div>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  s.estado === "pendiente" ? "bg-amber-500/10 text-amber-400" :
                  s.estado === "atendida" ? "bg-emerald-500/10 text-emerald-400" :
                  "bg-gray-500/10 text-gray-400"
                }`}>
                  {s.estado}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-300 mb-4">
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500" /> {s.telefono}</div>
                <div className="flex items-center gap-2"><Scissors className="w-4 h-4 text-gray-500" /> {nombreBarbero(s.id_barbero)}</div>
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500" />
                  {formatFecha(s.fecha_preferida) || "Sin día"} · {FRANJAS[s.franja_preferida] || s.franja_preferida}
                </div>
                {s.comentario && (
                  <div className="flex items-start gap-2"><MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" /> <span className="text-gray-400">{s.comentario}</span></div>
                )}
              </div>

              {s.estado === "pendiente" && (
                <div className="flex gap-2">
                  <button onClick={() => agendar(s)}
                    className="flex-1 inline-flex items-center justify-center gap-1 bg-gold text-ink hover:bg-gold-soft rounded-lg py-2 text-sm font-semibold transition-colors">
                    Agendar
                  </button>
                  <button onClick={() => cambiarEstado(s.id_solicitud, "atendida")}
                    className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg py-2 text-sm font-medium transition-colors">
                    <Check className="w-4 h-4" /> Atendida
                  </button>
                  <button onClick={() => cambiarEstado(s.id_solicitud, "descartada")}
                    className="flex-1 inline-flex items-center justify-center gap-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg py-2 text-sm font-medium transition-colors">
                    <X className="w-4 h-4" /> Descartar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Solicitudes;
