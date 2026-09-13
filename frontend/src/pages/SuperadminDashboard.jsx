import { useState, useEffect } from "react";
import { Building2, Users, TrendingUp, AlertTriangle, XCircle, DollarSign, Sparkles } from "lucide-react";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../api/cliente";

function formatoPrecio(valor) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(valor || 0);
}
function formatoCorto(valor) {
  if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)}M`;
  if (valor >= 1000) return `$${(valor / 1000).toFixed(0)}k`;
  return `$${valor}`;
}

const COLOR_ESTADO = { trial: "#60a5fa", activas: "#34d399", suspendidas: "#fbbf24", canceladas: "#f87171" };

function MetricCard({ icono: Icono, label, valor, colorIcono }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl p-5 border border-line bg-ink-card hover:border-white/20 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorIcono}`}>
          <Icono className="w-5 h-5" />
        </div>
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">{valor}</div>
      <div className="text-xs text-gray-500 mt-1.5 uppercase tracking-wide">{label}</div>
    </div>
  );
}

const PERIODOS = [
  { meses: 1, label: "1 mes" },
  { meses: 3, label: "3 meses" },
  { meses: 6, label: "6 meses" },
  { meses: 12, label: "12 meses" },
];

function SuperadminDashboard() {
  const [metricas, setMetricas] = useState(null);
  const [series, setSeries] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [periodo, setPeriodo] = useState(6);
  const [cargandoSeries, setCargandoSeries] = useState(false);

  useEffect(() => {
    api.get("/superadmin/metricas").then((r) => setMetricas(r.data)).finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    setCargandoSeries(true);
    api.get(`/superadmin/series?meses=${periodo}`)
      .then((r) => setSeries(r.data))
      .finally(() => setCargandoSeries(false));
  }, [periodo]);

  if (cargando) return <div className="text-center py-20 text-gray-500">Cargando...</div>;

  const datosDona = metricas
    ? [
        { nombre: "Trial", valor: metricas.en_trial, color: COLOR_ESTADO.trial },
        { nombre: "Activas", valor: metricas.activas, color: COLOR_ESTADO.activas },
        { nombre: "Suspendidas", valor: metricas.suspendidas, color: COLOR_ESTADO.suspendidas },
        { nombre: "Canceladas", valor: metricas.canceladas, color: COLOR_ESTADO.canceladas },
      ].filter((d) => d.valor > 0)
    : [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">En vivo</span>
      </div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Resumen general</h1>
        <p className="text-gray-500 text-sm">Estado de la plataforma en tiempo real</p>
      </div>

      {/* Hero MRR — destacado, separado del resto */}
      {metricas && (
        <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-gold/10 via-ink-card to-ink-card p-7 mb-6">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-gold/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-xs font-semibold text-gold uppercase tracking-wider">Ingreso mensual recurrente</span>
              </div>
              <div className="text-5xl font-bold text-white tracking-tight">{formatoPrecio(metricas.mrr)}</div>
              <p className="text-gray-500 text-sm mt-2">Suma de todas las suscripciones activas este mes</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Building2 className="w-4 h-4" />
              {metricas.total_barberias} barberías registradas en total
            </div>
          </div>
        </div>
      )}

      {metricas && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <MetricCard icono={Users} label="En trial" valor={metricas.en_trial} colorIcono="bg-blue-500/10 text-blue-400" />
          <MetricCard icono={TrendingUp} label="Activas" valor={metricas.activas} colorIcono="bg-emerald-500/10 text-emerald-400" />
          <MetricCard icono={AlertTriangle} label="Suspendidas" valor={metricas.suspendidas} colorIcono="bg-amber-500/10 text-amber-400" />
          <MetricCard icono={XCircle} label="Canceladas" valor={metricas.canceladas} colorIcono="bg-red-500/10 text-red-400" />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Evolución</h2>
        <div className="flex gap-1 p-1 bg-ink-card border border-line rounded-full">
          {PERIODOS.map((p) => (
            <button
              key={p.meses}
              onClick={() => setPeriodo(p.meses)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                periodo === p.meses ? "bg-gold text-ink" : "text-gray-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-ink-card border border-line rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1">Crecimiento de barberías</h2>
          <p className="text-xs text-gray-500 mb-5">Acumulado, últimos {periodo} mes{periodo !== 1 ? "es" : ""}</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBarberias" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4af37" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#26262d" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="etiqueta" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1a1a1f", border: "1px solid #26262d", borderRadius: "12px", color: "#fff" }} />
              <Area type="monotone" dataKey="barberias_acumuladas" name="Barberías" stroke="#d4af37" strokeWidth={2.5} fill="url(#gradBarberias)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-ink-card border border-line rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1">Distribución actual</h2>
          <p className="text-xs text-gray-500 mb-5">Por estado</p>
          {datosDona.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-16">Sin datos</p>
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={datosDona} dataKey="valor" nameKey="nombre" cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3}>
                      {datosDona.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1a1a1f", border: "1px solid #26262d", borderRadius: "12px", color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-white">{metricas.total_barberias}</span>
                  <span className="text-[10px] text-gray-500 uppercase">Total</span>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                {datosDona.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-gray-300 flex-1">{d.nombre}</span>
                    <span className="text-white font-medium">{d.valor}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-3 bg-ink-card border border-line rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1">Evolución del MRR</h2>
          <p className="text-xs text-gray-500 mb-5">Estimado, últimos {periodo} mes{periodo !== 1 ? "es" : ""}</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#26262d" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="etiqueta" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatoCorto} />
              <Tooltip
                contentStyle={{ background: "#1a1a1f", border: "1px solid #26262d", borderRadius: "12px", color: "#fff" }}
                formatter={(v) => [formatoPrecio(v), "MRR"]}
              />
              <Area type="monotone" dataKey="mrr" name="MRR" stroke="#34d399" strokeWidth={2.5} fill="url(#gradMrr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default SuperadminDashboard;