import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import React from "react";
                      <SelectorEstado barberia={b} onCambiar={cambiarEstado} />

                      <button
                        onClick={() => eliminarBarberia(b)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Eliminar barbería"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleExpandir(b)}
import api from "../api/cliente";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import logo from "../assets/img/logo1.png";

const ESTADOS = [
  { valor: "trial", label: "Trial", dot: "bg-blue-400", pill: "bg-blue-500/10 text-blue-400 border-blue-500/25" },
  { valor: "activa", label: "Activa", dot: "bg-emerald-400", pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" },
  { valor: "suspendida", label: "Suspendida", dot: "bg-amber-400", pill: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
  { valor: "cancelada", label: "Cancelada", dot: "bg-red-400", pill: "bg-red-500/10 text-red-400 border-red-500/25" },
];

function formatoPrecio(valor) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(valor || 0);
}

function iniciales(nombre) {
  return (nombre || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function MetricCard({ icono: Icono, label, valor, destacado, colorIcono }) {
  return (
    <div className={`rounded-2xl p-5 border transition-colors ${destacado ? "bg-gold/5 border-gold/25" : "bg-ink-card border-line hover:border-white/20"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorIcono}`}>
        <Icono className="w-5 h-5" />
      </div>
      <div className={`text-2xl font-bold tracking-tight ${destacado ? "text-gold" : "text-white"}`}>{valor}</div>
      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}

// Pill de estado con menú desplegable propio, en vez de un <select> gris genérico.
function SelectorEstado({ barberia, onCambiar }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const est = ESTADOS.find((e) => e.valor === barberia.estado) || ESTADOS[0];

  useEffect(() => {
    const cerrar = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${est.pill}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} />
        {est.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {abierto && (
        <div className="absolute right-0 top-full mt-1.5 w-40 bg-ink-card border border-line rounded-xl shadow-xl z-30 overflow-hidden py-1">
          {ESTADOS.map((e) => (
            <button
              key={e.valor}
              onClick={() => { setAbierto(false); onCambiar(barberia, e.valor); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-ink hover:text-white transition-colors"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
              {e.label}
              {e.valor === barberia.estado && <Check className="w-3.5 h-3.5 ml-auto text-gold" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SuperadminPanel() {
  const { usuario, logout } = useAuth();
  const { confirmar, avisar } = useUI();

  const [metricas, setMetricas] = useState(null);
  const [barberias, setBarberias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [expandida, setExpandida] = useState(null);
  const [pagosPorBarberia, setPagosPorBarberia] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const cargar = useCallback(async () => {
    try {
      const [resM, resB] = await Promise.all([
        api.get("/superadmin/metricas"),
        api.get("/superadmin/barberias"),
      ]);
      setMetricas(resM.data);
      setBarberias(resB.data);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarEstado = (barberia, nuevoEstado) => {
    if (barberia.estado === nuevoEstado) return;
    confirmar({
      titulo: `¿Cambiar a "${ESTADOS.find((e) => e.valor === nuevoEstado)?.label}"?`,
      mensaje: `Esto afecta el acceso de "${barberia.nombre}" al sistema de inmediato.`,
      textoConfirmar: "Sí, cambiar",
      onConfirmar: async () => {
        try {
          await api.patch(`/superadmin/barberias/${barberia.id_barberia}/estado`, { estado: nuevoEstado });
          avisar("Estado actualizado", "exito");
          cargar();
        } catch (err) {
          avisar(err.response?.data?.detail || "No se pudo actualizar", "error");
        }
      },
    });
  };

    const eliminarBarberia = (barberia) => {
    confirmar({
      titulo: `¿Eliminar "${barberia.nombre}" permanentemente?`,
      mensaje: "Esto borra TODOS sus datos (clientes, turnos, historial, pagos). No se puede deshacer. Escribí el nombre exacto para confirmar.",
      textoConfirmar: "Sí, eliminar para siempre",
      pedirTexto: barberia.nombre,
      onConfirmar: async () => {
        try {
          await api.delete(`/superadmin/barberias/${barberia.id_barberia}`);
          avisar("Barbería eliminada", "exito");
          cargar();
        } catch (err) {
          avisar(err.response?.data?.detail || "No se pudo eliminar", "error");
        }
      },
    });
  };

  const toggleExpandir = async (barberia) => {



  const toggleExpandir = async (barberia) => {
    if (expandida === barberia.id_barberia) {
      setExpandida(null);
      return;
    }
    setExpandida(barberia.id_barberia);
    if (!pagosPorBarberia[barberia.id_barberia]) {
      try {
        const res = await api.get(`/superadmin/barberias/${barberia.id_barberia}/pagos`);
        setPagosPorBarberia((prev) => ({ ...prev, [barberia.id_barberia]: res.data }));
      } catch {
        setPagosPorBarberia((prev) => ({ ...prev, [barberia.id_barberia]: [] }));
      }
    }
  };

  const barberiasFiltradas = useMemo(() => {
    return barberias.filter((b) => {
      const coincideBusqueda =
        !busqueda ||
        b.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        b.subdominio.toLowerCase().includes(busqueda.toLowerCase()) ||
        (b.email_contacto || "").toLowerCase().includes(busqueda.toLowerCase());
      const coincideEstado = filtroEstado === "todos" || b.estado === filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
  }, [barberias, busqueda, filtroEstado]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="" className="w-12 h-12 rounded-xl object-cover animate-pulse" />
          <span className="text-gray-500 text-sm">Cargando panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <header className="border-b border-line bg-ink-soft/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Barber Pro" className="w-9 h-9 rounded-lg object-cover" />
            <div>
              <h1 className="text-white font-semibold leading-tight">Barber Pro</h1>
              <p className="text-[11px] text-gold font-mono tracking-wider uppercase leading-tight">Superadmin</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-lg bg-gold flex items-center justify-center text-ink font-bold text-xs">
                {iniciales(usuario?.nombre_usuario)}
              </div>
              <span className="text-gray-300">{usuario?.nombre_usuario}</span>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">Panel de control</h2>
          <p className="text-gray-500 text-sm">Vista global de todas las barberías registradas en la plataforma</p>
        </div>

        {metricas && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            <MetricCard icono={Building2} label="Barberías totales" valor={metricas.total_barberias} colorIcono="bg-white/5 text-gray-300" />
            <MetricCard icono={Users} label="En trial" valor={metricas.en_trial} colorIcono="bg-blue-500/10 text-blue-400" />
            <MetricCard icono={TrendingUp} label="Activas" valor={metricas.activas} colorIcono="bg-emerald-500/10 text-emerald-400" />
            <MetricCard icono={AlertTriangle} label="Suspendidas" valor={metricas.suspendidas} colorIcono="bg-amber-500/10 text-amber-400" />
            <MetricCard icono={XCircle} label="Canceladas" valor={metricas.canceladas} colorIcono="bg-red-500/10 text-red-400" />
            <MetricCard icono={DollarSign} label="MRR mensual" valor={formatoPrecio(metricas.mrr)} colorIcono="bg-gold/10 text-gold" destacado />
          </div>
        )}

        {/* Tabla */}
        <div className="bg-ink-card border border-line rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-line">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-white font-semibold text-lg">Barberías registradas</h3>
              <span className="text-xs text-gray-500">{barberiasFiltradas.length} de {barberias.length}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, subdominio o email..."
                  className="w-full bg-ink border border-line rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold transition-colors"
                />
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-ink border border-line rounded-full overflow-x-auto">
                <button
                  onClick={() => setFiltroEstado("todos")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    filtroEstado === "todos" ? "bg-gold text-ink" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Todos
                </button>
                {ESTADOS.map((e) => (
                  <button
                    key={e.valor}
                    onClick={() => setFiltroEstado(e.valor)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      filtroEstado === e.valor ? "bg-gold text-ink" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${filtroEstado === e.valor ? "bg-ink" : e.dot}`} />
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {barberiasFiltradas.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-7 h-7 text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm">No hay barberías que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {barberiasFiltradas.map((b) => (
                <div key={b.id_barberia}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold to-yellow-700 flex items-center justify-center text-ink font-bold text-sm">
                          {iniciales(b.nombre)}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-medium truncate">{b.nombre}</div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          @{b.subdominio} · {b.email_contacto || "sin email"}
                        </div>
                      </div>
                    </div>

                    <span className="hidden md:inline-flex items-center text-xs font-medium text-gray-400 bg-white/5 px-2.5 py-1 rounded-full whitespace-nowrap">
                      Plan {b.plan_actual || "sin plan"}
                    </span>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {React.createElement(
                        "a",
                        {
                          href: `https://barberproapp.online/portal/${b.subdominio}`,
                          target: "_blank",
                          rel: "noreferrer",
                          className: "inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gold hover:bg-gold/10 transition-colors",
                          title: "Ver portal",
                        },
                        <ExternalLink key="icono" className="w-4 h-4" />
                      )}

                      <SelectorEstado barberia={b} onCambiar={cambiarEstado} />

                      <button
                        onClick={() => eliminarBarberia(b)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Eliminar barbería"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleExpandir(b)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          expandida === b.id_barberia
                            ? "bg-white/10 border-white/20 text-white"
                            : "border-line text-gray-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Pagos
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandida === b.id_barberia ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {expandida === b.id_barberia && (
                    <div className="bg-ink px-6 py-5">
                      {!pagosPorBarberia[b.id_barberia] ? (
                        <p className="text-gray-500 text-sm">Cargando...</p>
                      ) : pagosPorBarberia[b.id_barberia].length === 0 ? (
                        <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                          <Receipt className="w-4 h-4" />
                          Sin pagos registrados todavía.
                        </div>
                      ) : (
                        <div className="max-w-2xl space-y-1.5">
                          {pagosPorBarberia[b.id_barberia].map((p) => (
                            <div key={p.id_pago} className="flex items-center gap-4 text-sm bg-ink-card border border-line rounded-xl px-4 py-3">
                              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                <Receipt className="w-4 h-4 text-gray-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-gray-300">{p.metodo_pago || "Sin método registrado"}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{new Date(p.fecha_creacion).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}</div>
                              </div>
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                p.estado === "aprobado" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                              }`}>
                                {p.estado}
                              </span>
                              <span className="text-white font-semibold w-28 text-right flex-shrink-0">{formatoPrecio(p.monto)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SuperadminPanel;