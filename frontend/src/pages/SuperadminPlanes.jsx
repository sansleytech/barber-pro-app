import { useState, useEffect } from "react";
import { Building2, Users, TrendingUp, AlertTriangle, XCircle, DollarSign } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
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

function SuperadminDashboard() {
  const [metricas, setMetricas] = useState(null);
  const [series, setSeries] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/superadmin/metricas"), api.get("/superadmin/series?meses=6")])
      .then(([resM, resS]) => {
        setMetricas(resM.data);
        setSeries(resS.data);
      })
      .finally(() => setCargando(false));
  }, []);

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Resumen general</h1>
        <p className="text-gray-500 text-sm">Estado de la plataforma en tiempo real</p>
      </div>

      {metricas && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard icono={Building2} label="Barberías totales" valor={metricas.total_barberias} colorIcono="bg-white/5 text-gray-300" />
          <MetricCard icono={Users} label="En trial" valor={metricas.en_trial} colorIcono="bg-blue-500/10 text-blue-400" />
          <MetricCard icono={TrendingUp} label="Activas" valor={metricas.activas} colorIcono="bg-emerald-500/10 text-emerald-400" />
          <MetricCard icono={AlertTriangle} label="Suspendidas" valor={metricas.suspendidas} colorIcono="bg-amber-500/10 text-amber-400" />
          <MetricCard icono={XCircle} label="Canceladas" valor={metricas.canceladas} colorIcono="bg-red-500/10 text-red-400" />
          <MetricCard icono={DollarSign} label="MRR mensual" valor={formatoPrecio(metricas.mrr)} colorIcono="bg-gold/10 text-gold" destacado />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-ink-card border border-line rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1">Crecimiento de barberías</h2>
          <p className="text-xs text-gray-500 mb-4">Acumulado, últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#26262d" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="etiqueta" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1a1a1f", border: "1px solid #26262d", borderRadius: "12px", color: "#fff" }} />
              <Line type="monotone" dataKey="barberias_acumuladas" name="Barberías" stroke="#d4af37" strokeWidth={2.5} dot={{ fill: "#d4af37", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-ink-card border border-line rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1">Distribución actual</h2>
          <p className="text-xs text-gray-500 mb-4">Por estado</p>
          {datosDona.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-16">Sin datos</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={datosDona} dataKey="valor" nameKey="nombre" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
                    {datosDona.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1a1f", border: "1px solid #26262d", borderRadius: "12px", color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
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
          <p className="text-xs text-gray-500 mb-4">Estimado, últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#26262d" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="etiqueta" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatoCorto} />
              <Tooltip
                contentStyle={{ background: "#1a1a1f", border: "1px solid #26262d", borderRadius: "12px", color: "#fff" }}
                formatter={(v) => [formatoPrecio(v), "MRR"]}
              />
              <Line type="monotone" dataKey="mrr" name="MRR" stroke="#34d399" strokeWidth={2.5} dot={{ fill: "#34d399", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default SuperadminDashboard;