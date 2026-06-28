import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Clock,
  DollarSign,
  Search,
  X,
  Plus,
  ChevronDown,
} from "lucide-react";
import api from "../api/cliente";

function TurnoForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const desdeSolicitud = location.state?.desdeSolicitud || null;

  const [clientes, setClientes] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [buscarServicio, setBuscarServicio] = useState("");
  const [listaAbierta, setListaAbierta] = useState(false);
  const [form, setForm] = useState({
    id_cliente: "",
    id_barbero: "",
    fecha: "",
    hora_inicio: "",
    ids_servicios: [],
    observaciones: "",
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Disponibilidad
  const [disponibles, setDisponibles] = useState([]);
  const [cargandoDisp, setCargandoDisp] = useState(false);
  const [mensajeDisp, setMensajeDisp] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        const [resC, resB, resS] = await Promise.all([
          api.get("/clientes"),
          api.get("/barberos"),
          api.get("/servicios"),
        ]);
        setClientes(resC.data);
        setBarberos(resB.data);
        setServicios(resS.data);

        // Si venimos de una solicitud, precargar cliente (por documento) y barbero
        if (desdeSolicitud) {
          const cli = resC.data.find((x) => x.documento === desdeSolicitud.documento);
          setForm((f) => ({
            ...f,
            id_cliente: cli ? String(cli.id_cliente) : "",
            id_barbero: desdeSolicitud.id_barbero ? String(desdeSolicitud.id_barbero) : "",
            fecha: desdeSolicitud.fecha_preferida || "",
          }));
        }

        if (editando) {
          const resT = await api.get(`/turnos/${id}`);
          const t = resT.data;
          setForm({
            id_cliente: String(t.id_cliente),
            id_barbero: String(t.id_barbero),
            fecha: t.fecha,
            hora_inicio: t.hora_inicio ? t.hora_inicio.slice(0, 5) : "",
            ids_servicios: t.servicios.map((s) => s.id_servicio),
            observaciones: t.observaciones || "",
          });
        }
      } catch {
        setError("No se pudieron cargar los datos");
      }
    };
    cargar();
  }, [id, editando]);

  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const toggleServicio = (idServicio) => {
    setForm((f) => {
      const yaEsta = f.ids_servicios.includes(idServicio);
      return {
        ...f,
        ids_servicios: yaEsta
          ? f.ids_servicios.filter((x) => x !== idServicio)
          : [...f.ids_servicios, idServicio],
      };
    });
  };

  const serviciosElegidos = servicios.filter((s) =>
    form.ids_servicios.includes(s.id_servicio),
  );
  const precioTotal = serviciosElegidos.reduce(
    (acc, s) => acc + Number(s.precio),
    0,
  );
  const duracionTotal = serviciosElegidos.reduce(
    (acc, s) => acc + s.duracion_minutos,
    0,
  );

  const serviciosFiltrados = servicios.filter(
    (s) =>
      !form.ids_servicios.includes(s.id_servicio) &&
      s.nombre.toLowerCase().includes(buscarServicio.toLowerCase()),
  );

  const formatoPrecio = (valor) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor || 0);

  const a12h = (hora24) => {
    if (!hora24) return "";
    const [h, m] = hora24.split(":").map(Number);
    const sufijo = h >= 12 ? "p.m." : "a.m.";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
  };

  // Consultar disponibilidad cuando hay barbero + fecha + duración
  useEffect(() => {
    if (!form.id_barbero || !form.fecha || duracionTotal === 0) {
      setDisponibles([]);
      setMensajeDisp("");
      return;
    }
    const consultar = async () => {
      setCargandoDisp(true);
      setMensajeDisp("");
      try {
        const res = await api.get(
          `/horarios/disponibilidad/${form.id_barbero}`,
          {
            params: { fecha: form.fecha, duracion_minutos: duracionTotal },
          },
        );
        setDisponibles(res.data.disponibles || []);
        if (res.data.mensaje) setMensajeDisp(res.data.mensaje);
        else if ((res.data.disponibles || []).length === 0)
          setMensajeDisp("No hay horarios libres ese día");
      } catch {
        setDisponibles([]);
        setMensajeDisp("No se pudo consultar la disponibilidad");
      } finally {
        setCargandoDisp(false);
      }
    };
    consultar();
  }, [form.id_barbero, form.fecha, duracionTotal]);

  const enviar = async (e) => {
    e.preventDefault();
    setError("");

    if (form.ids_servicios.length === 0) {
      setError("Elegí al menos un servicio");
      return;
    }
    if (!form.hora_inicio) {
      setError("Elegí un horario disponible");
      return;
    }

    setCargando(true);
    const datos = {
      id_cliente: Number(form.id_cliente),
      id_barbero: Number(form.id_barbero),
      fecha: form.fecha,
      hora_inicio: form.hora_inicio,
      ids_servicios: form.ids_servicios,
      observaciones: form.observaciones || null,
    };

    try {
      if (editando) {
        await api.put(`/turnos/${id}`, datos);
      } else {
        await api.post("/turnos", datos);
        // Si veníamos de una solicitud, marcarla como atendida
        if (desdeSolicitud?.id_solicitud) {
          try {
            await api.patch(`/solicitudes/${desdeSolicitud.id_solicitud}/estado`, { estado: "atendida" });
          } catch { /* si falla, igual el turno se creó */ }
        }
      }
      navigate("/turnos");
    } catch (err) {
      setError(
        err.response?.data?.detail &&
          typeof err.response.data.detail === "string"
          ? err.response.data.detail
          : "No se pudo guardar el turno",
      );
    } finally {
      setCargando(false);
    }
  };

  const inputClase =
    "w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors";

  return (
    <div className="w-full">
      <button
        onClick={() => navigate("/turnos")}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a turnos
      </button>

      <h1 className="text-3xl font-bold text-white mb-1">
        {editando ? "Editar turno" : "Nuevo turno"}
      </h1>
      <p className="text-gray-400 mb-6">
        {editando
          ? "Modificá los datos del turno"
          : "Agendá una cita para tu barbería"}
      </p>

      <form
        onSubmit={enviar}
        className="bg-ink-card border border-line rounded-2xl p-6 md:p-8 space-y-5"
      >
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-300 mb-1.5">
              Cliente *
            </label>
            <select
              value={form.id_cliente}
              onChange={(e) => cambiar("id_cliente", e.target.value)}
              className={inputClase}
              required
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.primer_nombre} {c.apellidos}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Barbero *
            </label>
            <select
              value={form.id_barbero}
              onChange={(e) => {
                cambiar("id_barbero", e.target.value);
                cambiar("hora_inicio", ""); // resetea hora al cambiar barbero
              }}
              className={inputClase}
              required
            >
              <option value="">Seleccionar barbero...</option>
              {barberos.map((b) => (
                <option key={b.id_barbero} value={b.id_barbero}>
                  {b.nombre} {b.apellido}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Fecha *
            </label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => {
                cambiar("fecha", e.target.value);
                cambiar("hora_inicio", ""); // resetea hora al cambiar fecha
              }}
              className={inputClase}
              required
            />
          </div>
        </div>

        {/* Buscador + desplegable de servicios */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Servicios *
          </label>

          {serviciosElegidos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {serviciosElegidos.map((s) => (
                <span
                  key={s.id_servicio}
                  className="inline-flex items-center gap-2 bg-gold/10 text-gold text-sm rounded-full pl-3 pr-2 py-1.5"
                >
                  {s.nombre} · {formatoPrecio(s.precio)}
                  <button
                    type="button"
                    onClick={() => toggleServicio(s.id_servicio)}
                    className="hover:bg-gold/20 rounded-full p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={buscarServicio}
              onChange={(e) => setBuscarServicio(e.target.value)}
              onFocus={() => setListaAbierta(true)}
              placeholder="Buscar o desplegar servicios..."
              className="w-full bg-ink border border-line rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
            />
            <button
              type="button"
              onClick={() => setListaAbierta((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold transition-colors"
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform ${listaAbierta ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {listaAbierta && (
            <div className="mt-2 border border-line rounded-lg overflow-hidden divide-y divide-line max-h-60 overflow-y-auto">
              {serviciosFiltrados.length === 0 ? (
                <p className="text-sm text-gray-500 px-4 py-3">
                  {servicios.length === 0
                    ? "No hay servicios cargados"
                    : "No hay más servicios para agregar"}
                </p>
              ) : (
                serviciosFiltrados.map((s) => (
                  <button
                    key={s.id_servicio}
                    type="button"
                    onClick={() => {
                      toggleServicio(s.id_servicio);
                      setBuscarServicio("");
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-ink hover:bg-ink-soft text-left transition-colors"
                  >
                    <div>
                      <div className="text-white text-sm font-medium">
                        {s.nombre}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {s.duracion_minutos} min
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 text-gold text-sm">
                      {formatoPrecio(s.precio)}
                      <Plus className="w-4 h-4" />
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Horarios disponibles */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Horario disponible *
          </label>
          {duracionTotal === 0 ? (
            <p className="text-sm text-gray-500">
              Elegí servicios para ver los horarios libres
            </p>
          ) : !form.id_barbero || !form.fecha ? (
            <p className="text-sm text-gray-500">
              Elegí barbero y fecha para ver los horarios libres
            </p>
          ) : cargandoDisp ? (
            <p className="text-sm text-gray-500">
              Buscando horarios disponibles...
            </p>
          ) : disponibles.length === 0 ? (
            <p className="text-sm text-amber-400">
              {mensajeDisp || "No hay horarios disponibles"}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {disponibles.map((hora) => {
                const elegido = form.hora_inicio === hora;
                return (
                  <button
                    key={hora}
                    type="button"
                    onClick={() => cambiar("hora_inicio", hora)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      elegido
                        ? "bg-gold text-ink border-gold"
                        : "bg-ink border-line text-gray-300 hover:border-gold/50"
                    }`}
                  >
                    {a12h(hora)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen en vivo */}
        {serviciosElegidos.length > 0 && (
          <div className="flex items-center justify-between bg-ink rounded-lg border border-line px-4 py-3">
            <span className="inline-flex items-center gap-2 text-gray-300 text-sm">
              <Clock className="w-4 h-4 text-gold" />
              Duración:{" "}
              <strong className="text-white">{duracionTotal} min</strong>
            </span>
            <span className="inline-flex items-center gap-2 text-gray-300 text-sm">
              <DollarSign className="w-4 h-4 text-gold" />
              Total:{" "}
              <strong className="text-gold">
                {formatoPrecio(precioTotal)}
              </strong>
            </span>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">
            Observaciones
          </label>
          <textarea
            value={form.observaciones}
            onChange={(e) => cambiar("observaciones", e.target.value)}
            rows={3}
            className={inputClase}
            placeholder="Notas del turno (opcional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-line pt-5">
          <button
            type="submit"
            disabled={cargando}
            className="inline-flex items-center justify-center gap-2 bg-gold text-ink font-semibold rounded-lg py-3 hover:bg-gold-soft transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {cargando
              ? "Guardando..."
              : editando
                ? "Guardar cambios"
                : "Crear turno"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/turnos")}
            className="border border-line text-gray-300 hover:text-white hover:bg-ink-soft rounded-lg py-3 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default TurnoForm;
