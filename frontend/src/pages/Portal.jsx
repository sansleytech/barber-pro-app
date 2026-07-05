import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const portalApi = axios.create({ baseURL: "http://localhost:8000" });

const FRANJAS = [
  { valor: "manana", label: "Mañana" },
  { valor: "tarde", label: "Tarde" },
  { valor: "noche", label: "Noche" },
  { valor: "cualquiera", label: "Cualquiera" },
];

function Portal() {
  const { subdominio } = useParams();
  const [paso, setPaso] = useState("documento");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [documento, setDocumento] = useState("");
  const [cliente, setCliente] = useState(null);
  const [barberos, setBarberos] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [vista, setVista] = useState("inicio"); // inicio | turno
  const [registro, setRegistro] = useState({
    primer_nombre: "",
    apellidos: "",
    telefono: "",
    fecha_nacimiento: "",
    email: "",
  });
  const [solicitud, setSolicitud] = useState({
    id_barbero: "",
    fecha_preferida: "",
    franja_preferida: "cualquiera",
    comentario: "",
  });

  useEffect(() => {
    portalApi
      .get(`/portal/${subdominio}/barberos`)
      .then((res) => {
        setBarberos(res.data);
      })
      .catch(() => {});
    portalApi
      .get(`/portal/${subdominio}/galeria`)
      .then((res) => {
        setGaleria(res.data);
      })
      .catch(() => {});
  }, [subdominio]);

  const identificar = async (e) => {
    e.preventDefault();
    setError("");
    if (!documento.trim()) {
      setError("Ingresá tu número de documento");
      return;
    }
    setCargando(true);
    try {
      const res = await portalApi.get(
        `/portal/${subdominio}/cliente/${documento.trim()}`,
      );
      if (res.data.existe) {
        setCliente(res.data);
        setPaso("solicitar");
      } else {
        setPaso("registro");
      }
    } catch (err) {
      setError("No se pudo verificar el documento. Probá de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  const registrarCliente = async (e) => {
    e.preventDefault();
    setError("");
    if (
      !registro.primer_nombre.trim() ||
      !registro.apellidos.trim() ||
      !registro.telefono.trim() ||
      !registro.fecha_nacimiento
    ) {
      setError("Completá todos los campos obligatorios");
      return;
    }
    setCargando(true);
    try {
      const res = await portalApi.post(`/portal/${subdominio}/cliente`, {
        documento: documento.trim(),
        primer_nombre: registro.primer_nombre,
        apellidos: registro.apellidos,
        telefono: registro.telefono,
        fecha_nacimiento: registro.fecha_nacimiento,
        email: registro.email || null,
      });
      setCliente({ primer_nombre: res.data.primer_nombre });
      setPaso("solicitar");
    } catch (err) {
      setError(
        err.response?.data?.detail || "No se pudo registrar. Probá de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  };

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await portalApi.post(`/portal/${subdominio}/solicitar`, {
        nombre_cliente: cliente.primer_nombre,
        telefono: registro.telefono || "0000000",
        documento: documento.trim(),
        id_barbero: solicitud.id_barbero ? Number(solicitud.id_barbero) : null,
        fecha_preferida: solicitud.fecha_preferida || null,
        franja_preferida: solicitud.franja_preferida,
        comentario: solicitud.comentario || null,
      });
      setPaso("listo");
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo enviar la solicitud.");
    } finally {
      setCargando(false);
    }
  };

  const input =
    "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400";

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-1">
            <span className="text-yellow-400">Barber</span> Pro
          </h1>
          <p className="text-white/50 text-sm">Solicitá tu turno</p>
        </div>

        {vista === "inicio" && (
          <div className="space-y-6">
            {galeria.length > 0 && (
              <div>
                <h2 className="text-white/70 text-sm mb-3">
                  Nuestros trabajos
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {galeria.map((foto) => (
                    <div
                      key={foto.id_foto}
                      className="rounded-2xl overflow-hidden border border-white/10"
                    >
                      <img
                        src={foto.url}
                        alt={foto.titulo || "Corte"}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => setVista("turno")}
              className="w-full bg-yellow-400 text-black font-semibold rounded-xl py-4 hover:bg-yellow-300 transition-colors"
            >
              Pedir turno
            </button>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {paso === "documento" && (
            <form onSubmit={identificar} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Tu número de documento
                </label>
                <input
                  type="text"
                  value={documento}
                  onChange={(e) =>
                    setDocumento(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="Ej: 1234567890"
                  className={input}
                  autoFocus
                />
                <p className="text-xs text-white/40 mt-2">
                  Lo usamos para identificarte. Si es tu primera vez, te
                  pediremos registrarte.
                </p>
              </div>
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-yellow-400 text-black font-semibold rounded-xl py-3 hover:bg-yellow-300 transition-colors disabled:opacity-50"
              >
                {cargando ? "Verificando..." : "Continuar"}
              </button>
            </form>
          )}

          {paso === "registro" && (
            <form onSubmit={registrarCliente} className="space-y-4">
              <p className="text-sm text-white/60">
                No te encontramos. Registrate para continuar:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre *"
                  value={registro.primer_nombre}
                  onChange={(e) =>
                    setRegistro((r) => ({
                      ...r,
                      primer_nombre: e.target.value,
                    }))
                  }
                  className={input}
                />
                <input
                  type="text"
                  placeholder="Apellidos *"
                  value={registro.apellidos}
                  onChange={(e) =>
                    setRegistro((r) => ({ ...r, apellidos: e.target.value }))
                  }
                  className={input}
                />
              </div>
              <input
                type="text"
                placeholder="Teléfono *"
                value={registro.telefono}
                onChange={(e) =>
                  setRegistro((r) => ({ ...r, telefono: e.target.value }))
                }
                className={input}
              />
              <div>
                <label className="block text-xs text-white/50 mb-1">
                  Fecha de nacimiento *
                </label>
                <input
                  type="date"
                  value={registro.fecha_nacimiento}
                  onChange={(e) =>
                    setRegistro((r) => ({
                      ...r,
                      fecha_nacimiento: e.target.value,
                    }))
                  }
                  className={input}
                />
              </div>
              <input
                type="email"
                placeholder="Email (opcional)"
                value={registro.email}
                onChange={(e) =>
                  setRegistro((r) => ({ ...r, email: e.target.value }))
                }
                className={input}
              />
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-yellow-400 text-black font-semibold rounded-xl py-3 hover:bg-yellow-300 transition-colors disabled:opacity-50"
              >
                {cargando ? "Registrando..." : "Registrarme y continuar"}
              </button>
            </form>
          )}

          {paso === "solicitar" && (
            <form onSubmit={enviarSolicitud} className="space-y-4">
              <p className="text-lg">
                ¡Hola{" "}
                <span className="text-yellow-400 font-semibold">
                  {cliente?.primer_nombre}
                </span>
                !
              </p>
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Barbero (opcional)
                </label>
                <select
                  value={solicitud.id_barbero}
                  onChange={(e) =>
                    setSolicitud((s) => ({ ...s, id_barbero: e.target.value }))
                  }
                  className={input}
                >
                  <option value="">Cualquiera</option>
                  {barberos.map((b) => (
                    <option key={b.id_barbero} value={b.id_barbero}>
                      {b.nombre} {b.apellido}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Día preferido (opcional)
                </label>
                <input
                  type="date"
                  value={solicitud.fecha_preferida}
                  onChange={(e) =>
                    setSolicitud((s) => ({
                      ...s,
                      fecha_preferida: e.target.value,
                    }))
                  }
                  className={input}
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Franja preferida
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FRANJAS.map((f) => (
                    <button
                      key={f.valor}
                      type="button"
                      onClick={() =>
                        setSolicitud((s) => ({
                          ...s,
                          franja_preferida: f.valor,
                        }))
                      }
                      className={`rounded-xl py-2.5 text-sm font-medium border transition-colors ${
                        solicitud.franja_preferida === f.valor
                          ? "bg-yellow-400 text-black border-yellow-400"
                          : "bg-white/5 text-white/70 border-white/15"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="Comentario (opcional)"
                value={solicitud.comentario}
                onChange={(e) =>
                  setSolicitud((s) => ({ ...s, comentario: e.target.value }))
                }
                rows={2}
                className={input}
              />
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-yellow-400 text-black font-semibold rounded-xl py-3 hover:bg-yellow-300 transition-colors disabled:opacity-50"
              >
                {cargando ? "Enviando..." : "Solicitar turno"}
              </button>
            </form>
          )}

          {paso === "listo" && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold mb-2">¡Solicitud enviada!</h2>
              <p className="text-white/60 text-sm">
                Te contactaremos pronto para confirmar tu turno.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Barbería: {subdominio}
        </p>
      </div>
    </div>
  );
}

export default Portal;
