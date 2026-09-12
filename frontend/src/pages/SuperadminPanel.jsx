import { useState, useEffect, useCallback, useMemo } from "react";
import React from "react";
import {
  LogOut, Building2, Users, TrendingUp, AlertTriangle, XCircle, DollarSign,
  ChevronDown, ChevronUp, Search, ShieldCheck, Receipt, ExternalLink,
} from "lucide-react";
import api from "../api/cliente";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
            <div className="w-20 h-20 rounded-2xl bg-yellow-400 flex items-center justify-center mb-8">
                <span className="text-3xl">✂️</span>
            </div>

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
    <div className={`rounded-2xl p-5 border ${destacado ? "bg-gold/5 border-gold/25" : "bg-ink-card border-line"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorIcono}`}>
        <Icono className="w-5 h-5" />
      </div>
      <div className={`text-2xl font-bold ${destacado ? "text-gold" : "text-white"}`}>{valor}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
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

  const estiloEstado = (estado) => ESTADOS.find((e) => e.valor === estado) || ESTADOS[0];

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
        {/* Bienvenida */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">Panel de control</h2>
          <p className="text-gray-500 text-sm">Vista global de todas las barberías registradas en la plataforma</p>
        </div>

        {/* Métricas */}
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
          <div className="px-5 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-white font-semibold">Barberías registradas</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, subdominio o email..."
                  className="bg-ink border border-line rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-gold transition-colors w-full sm:w-72"
                />
              </div>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="bg-ink border border-line rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold"
              >
                <option value="todos">Todos los estados</option>
                {ESTADOS.map((e) => (
                  <option key={e.valor} value={e.valor}>{e.label}</option>
                ))}
              </select>
            </div>
          </div>

          {barberiasFiltradas.length === 0 ? (
            <div className="text-center py-16">
              <ShieldCheck className="w-8 h-8 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-500 text-sm">No hay barberías que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {barberiasFiltradas.map((b) => {
                const est = estiloEstado(b.estado);
                return (
                  <div key={b.id_barberia}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4 hover:bg-ink/40 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-yellow-700 flex items-center justify-center text-ink font-bold text-sm flex-shrink-0">
                          {iniciales(b.nombre)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-medium truncate">{b.nombre}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} />
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 truncate">
                            @{b.subdominio} · {b.email_contacto || "sin email"} · Plan {b.plan_actual || "sin plan"}
                          </div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border w-fit ${est.pill}`}>
                        {est.label}
                      </span>

                      {React.createElement(
                        "a",
                        {
                          href: `https://barberproapp.online/portal/${b.subdominio}`,
                          target: "_blank",
                          rel: "noreferrer",
                          className: "inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gold transition-colors",
                        },
                        "Ver portal ",
                        <ExternalLink key="icono" className="w-3 h-3" />
                      )}

                      <select
                        value={b.estado}
                        onChange={(e) => cambiarEstado(b, e.target.value)}
                        className="bg-ink border border-line rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold"
                      >
                        {ESTADOS.map((e) => (
                          <option key={e.valor} value={e.valor}>{e.label}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => toggleExpandir(b)}
                        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                      >
                        <Receipt className="w-4 h-4" />
                        Pagos {expandida === b.id_barberia ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {expandida === b.id_barberia && (
                      <div className="bg-ink px-5 py-4">
                        {!pagosPorBarberia[b.id_barberia] ? (
                          <p className="text-gray-500 text-sm">Cargando...</p>
                        ) : pagosPorBarberia[b.id_barberia].length === 0 ? (
                          <p className="text-gray-500 text-sm">Sin pagos registrados todavía.</p>
                        ) : (
                          <div className="space-y-2 max-w-2xl">
                            {pagosPorBarberia[b.id_barberia].map((p) => (
                              <div key={p.id_pago} className="flex items-center justify-between text-sm bg-ink-card border border-line rounded-lg px-4 py-2.5">
                                <span className="text-gray-400 w-24">{new Date(p.fecha_creacion).toLocaleDateString("es-CO")}</span>
                                <span className="text-gray-300 flex-1">{p.metodo_pago || "—"}</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  p.estado === "aprobado" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                }`}>
                                  {p.estado}
                                </span>
                                <span className="text-white font-medium w-28 text-right">{formatoPrecio(p.monto)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SuperadminPanel;