// src/pages/MiDia.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  MessageCircle,
  Check,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Star,
  Gem,
  X,
} from "lucide-react";
import api from "../api/cliente";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

function fechaHoyLocal() {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

const METODOS_PAGO = ["efectivo", "tarjeta", "transferencia", "nequi"];

function MiDia() {
  const { usuario } = useAuth();
  const { avisar } = useUI();

  const [turnos, setTurnos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Modal de "completar turno" (método de pago + propina)
  const [modalCompletar, setModalCompletar] = useState(null);
  const [metodoPagoSel, setMetodoPagoSel] = useState("efectivo");
  const [propinaMonto, setPropinaMonto] = useState("");
  const [completando, setCompletando] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const [resT, resC, resS, resStats] = await Promise.allSettled([
        api.get("/turnos"),
        api.get("/clientes"),
        api.get("/servicios"),
        api.get("/estadisticas/mis-estadisticas"),
      ]);
      const valor = (r, def) => (r.status === "fulfilled" ? r.value.data : def);
      const todosTurnos = valor(resT, []);
      setTurnos(
        todosTurnos.filter((t) => t.id_barbero === usuario?.id_barbero),
      );
      setClientes(valor(resC, []));
      setServicios(valor(resS, []));
      setStats(valor(resStats, null));
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const nombreCliente = (id) => {
    const c = clientes.find((x) => x.id_cliente === id);
    return c ? `${c.primer_nombre} ${c.apellidos}` : "Cliente";
  };
  const telefonoCliente = (id) =>
    clientes.find((x) => x.id_cliente === id)?.telefono || "";
  const nombresServicios = (lista) => {
    if (!lista || lista.length === 0) return "—";
    return lista
      .map(
        (item) =>
          servicios.find((s) => s.id_servicio === item.id_servicio)?.nombre ||
          "Servicio",
      )
      .join(", ");
  };
  const formatoHora = (hora) => {
    if (!hora) return "—";
    const [h, m] = hora.split(":").map(Number);
    const sufijo = h >= 12 ? "p.m." : "a.m.";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
  };
  const formatoPrecio = (valor) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor || 0);

  const hoy = fechaHoyLocal();
  const turnosHoy = turnos
    .filter((t) => t.fecha === hoy && t.estado !== "cancelado")
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  // Abre el modal de método de pago + propina, en vez de completar directo.
  const completarTurno = (turno) => {
    setMetodoPagoSel("efectivo");
    setPropinaMonto("");
    setModalCompletar(turno);
  };

  // Confirma el turno con método de pago + propina, todo en un solo pedido,
  // y ya queda reflejado en Caja sin tener que cargarlo ahí a mano.
  const confirmarCompletar = async () => {
    const turno = modalCompletar;
    if (!turno) return;
    setCompletando(true);
    const propinaNum = Number(propinaMonto) || 0;
    try {
      await api.patch(`/turnos/${turno.id_turno}/estado`, {
        estado: "completado",
        metodo_pago: metodoPagoSel,
        propina: propinaNum,
        id_barbero_propina: turno.id_barbero,
      });
      avisar("Turno completado", "exito");
      setModalCompletar(null);
      cargarDatos();
    } catch (err) {
      avisar(
        err.response?.data?.detail || "No se pudo completar el turno",
        "error",
      );
    } finally {
      setCompletando(false);
    }
  };

  const enviarWhatsApp = (t) => {
    const tel = String(telefonoCliente(t.id_cliente)).replace(/\D/g, "");
    if (!tel) {
      avisar("Este cliente no tiene teléfono cargado", "error");
      return;
    }
    let numero = tel;
    if (numero.length === 10) numero = "57" + numero;
    const mensaje = `Hola ${nombreCliente(t.id_cliente).split(" ")[0]}, te confirmo tu turno de hoy a las ${formatoHora(t.hora_inicio)}. ¡Te espero!`;
    window.open(
      `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
      "_blank",
    );
  };

  const estiloEstado = (estado) => {
    const estilos = {
      pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/25",
      confirmado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
      en_proceso: "bg-purple-500/15 text-purple-400 border-purple-500/25",
      completado: "bg-gold/15 text-gold border-gold/25",
      no_asistio: "bg-gray-500/15 text-gray-400 border-gray-500/25",
    };
    return estilos[estado] || estilos.pendiente;
  };

  const totalDelDia = turnosHoy
    .filter((t) => t.estado === "completado")
    .reduce((acc, t) => acc + Number(t.precio_total || 0), 0);

  // Tarjeta chica de estadística con variación (igual estilo que el Dashboard admin)
  const StatCard = ({ icono: Icono, label, valor, variacion, colorIcono }) => {
    const sinCambio = variacion === undefined || variacion === null;
    const positivo = variacion > 0;
    return (
      <div className="bg-ink-card border border-line rounded-2xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorIcono}`}
          >
            <Icono className="w-5 h-5" />
          </div>
          {!sinCambio && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                positivo
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {positivo ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(variacion)}%
            </span>
          )}
        </div>
        <div className="text-xl font-bold text-white">{valor}</div>
        <div className="text-sm text-gray-400 mt-0.5">{label}</div>
      </div>
    );
  };

  if (cargando) {
    return (
      <div className="text-center py-20 text-gray-500">Cargando tu día...</div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">
          Hola, {usuario?.nombre_usuario?.split(" ")[0] || "Barbero"} 👋
        </h1>
        <p className="text-gray-400">
          {new Date().toLocaleDateString("es-CO", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Resumen de hoy */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-ink-card border border-line rounded-2xl p-5">
          <div className="text-2xl font-bold text-white">
            {turnosHoy.length}
          </div>
          <div className="text-sm text-gray-400 mt-0.5">Turnos hoy</div>
        </div>
        <div className="bg-ink-card border border-line rounded-2xl p-5">
          <div className="text-2xl font-bold text-gold">
            {turnosHoy.filter((t) => t.estado === "completado").length}
          </div>
          <div className="text-sm text-gray-400 mt-0.5">Completados</div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-gold/5 border border-gold/20 rounded-2xl p-5">
          <div className="text-2xl font-bold text-gold">
            {formatoPrecio(totalDelDia)}
          </div>
          <div className="text-sm text-gray-400 mt-0.5">Generado hoy</div>
        </div>
      </div>

      {/* Mis estadísticas (últimos 30 días) — solo sus propios datos */}
      {stats && (
        <div className="mb-8">
          <h2 className="text-white font-semibold mb-3">
            Mis estadísticas (últimos 30 días)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icono={DollarSign}
              label="Mis ingresos"
              valor={formatoPrecio(stats.actual.ingresos)}
              variacion={stats.variacion.ingresos}
              colorIcono="bg-emerald-500/10 text-emerald-400"
            />
            <StatCard
              icono={Calendar}
              label="Mis turnos"
              valor={stats.actual.turnos}
              variacion={stats.variacion.turnos}
              colorIcono="bg-gold/10 text-gold"
            />
            <StatCard
              icono={Gem}
              label="Propinas"
              valor={formatoPrecio(stats.actual.propinas)}
              variacion={stats.variacion.propinas}
              colorIcono="bg-purple-500/10 text-purple-400"
            />
            <div className="bg-ink-card border border-line rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                <Star className="w-5 h-5" />
              </div>
              <div className="text-xl font-bold text-white">
                {stats.rating ? `${stats.rating} ★` : "—"}
              </div>
              <div className="text-sm text-gray-400 mt-0.5">
                {stats.cant_valoraciones} reseña
                {stats.cant_valoraciones !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Turnos de hoy */}
      <h2 className="text-white font-semibold mb-3">Turnos de hoy</h2>
      <div className="space-y-3">
        {turnosHoy.length === 0 ? (
          <div className="text-center py-20 bg-ink-card border border-line rounded-2xl">
            <Calendar className="w-10 h-10 mx-auto mb-4 text-gray-600" />
            <h3 className="text-white font-semibold mb-1">
              Sin turnos para hoy
            </h3>
            <p className="text-gray-500 text-sm">Disfrutá tu día libre 🎉</p>
          </div>
        ) : (
          turnosHoy.map((t) => {
            const completado = t.estado === "completado";
            return (
              <div
                key={t.id_turno}
                className={`flex items-center gap-4 p-5 rounded-2xl border transition-colors ${
                  completado
                    ? "bg-ink-card/50 border-line opacity-60"
                    : "bg-ink-card border-line"
                }`}
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gold/10 border border-gold/20 flex flex-col items-center justify-center">
                  <Clock className="w-4 h-4 text-gold mb-0.5" />
                  <span className="text-gold font-bold text-xs">
                    {formatoHora(t.hora_inicio)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-white font-semibold">
                      {nombreCliente(t.id_cliente)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${estiloEstado(t.estado)}`}
                    >
                      {t.estado.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Scissors className="w-3.5 h-3.5" />
                    {nombresServicios(t.servicios)}
                    <span className="text-gold font-semibold">
                      {formatoPrecio(t.precio_total)}
                    </span>
                  </div>
                </div>

                {!completado && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => enviarWhatsApp(t)}
                      className="p-2.5 rounded-lg bg-ink border border-line text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => completarTurno(t)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gold text-ink font-semibold text-sm hover:bg-gold-soft transition-colors"
                    >
                      <Check className="w-4 h-4" /> Completar
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: completar turno con método de pago + propina */}
      {modalCompletar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setModalCompletar(null)}
        >
          <div
            className="bg-ink-card border border-line rounded-2xl w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h3 className="text-white font-semibold">Completar turno</h3>
              <button
                onClick={() => setModalCompletar(null)}
                className="text-gray-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Método de pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {METODOS_PAGO.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodoPagoSel(m)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium capitalize border transition-colors ${
                        metodoPagoSel === m
                          ? "bg-gold text-ink border-gold"
                          : "bg-ink border-line text-gray-300 hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Propina (opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={propinaMonto}
                  onChange={(e) => setPropinaMonto(e.target.value)}
                  placeholder="0"
                  className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold"
                />
              </div>
              <button
                onClick={confirmarCompletar}
                disabled={completando}
                className="w-full bg-gold text-ink font-semibold rounded-lg py-3 hover:bg-gold-soft transition-colors disabled:opacity-50"
              >
                {completando ? "Completando..." : "Completar turno"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MiDia;
