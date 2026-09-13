import { useState, useEffect } from "react";
import React from "react";
import { Plus, Building2, ExternalLink, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../api/cliente";
import { useUI } from "../context/UIContext";

function formatoPrecio(valor) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(valor || 0);
}
function formatoCorto(valor) {
  if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)}M`;
  if (valor >= 1000) return `$${(valor / 1000).toFixed(0)}k`;
  return `$${valor}`;
}

const ESTADO_COLOR = {
  trial: "bg-blue-500/10 text-blue-400",
  activa: "bg-emerald-500/10 text-emerald-400",
  suspendida: "bg-amber-500/10 text-amber-400",
  cancelada: "bg-red-500/10 text-red-400",
};

function MisSedes() {
  const { avisar } = useUI();
  const [sedes, setSedes] = useState([]);
  const [comparativa, setComparativa] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre_barberia: "", subdominio: "", email_contacto: "", telefono: "",
    nombre_admin: "", email_admin: "", password_admin: "",
  });

  const cargar = () => {
    Promise.all([
      api.get("/organizacion/mis-sedes"),
      api.get("/organizacion/comparativa"),
    ]).then(([resSedes, resComp]) => {
      setSedes(resSedes.data);
      setComparativa(resComp.data);
    }).finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const crearSede = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/organizacion/sedes", form);
      avisar("Sede creada correctamente", "exito");
      setCreando(false);
      setForm({ nombre_barberia: "", subdominio: "", email_contacto: "", telefono: "", nombre_admin: "", email_admin: "", password_admin: "" });
      cargar();
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo crear la sede");
    }
  };

  if (cargando) return <div className="text-center py-20 text-gray-500">Cargando...</div>;

  const totalIngresos = comparativa.reduce((acc, s) => acc + s.ingresos, 0);
  const totalTurnos = comparativa.reduce((acc, s) => acc + s.turnos, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Mis sedes</h1>
          <p className="text-gray-400">Gestioná y comparás todas las sedes de tu cadena</p>
        </div>
        <button
          onClick={() => setCreando(true)}
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold text-sm rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
        >
          <Plus className="w-4 h-4" /> Crear sede
        </button>
      </div>

      {creando && (
        <div className="bg-ink-card border border-gold/25 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Nueva sede</h3>
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
          <form onSubmit={crearSede} className="grid sm:grid-cols-2 gap-4">
            <input placeholder="Nombre de la barbería" value={form.nombre_barberia} onChange={(e) => setForm((f) => ({ ...f, nombre_barberia: e.target.value }))} className="bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" required />
            <input placeholder="Subdominio" value={form.subdominio} onChange={(e) => setForm((f) => ({ ...f, subdominio: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") }))} className="bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" required />
            <input placeholder="Email de contacto (opcional)" value={form.email_contacto} onChange={(e) => setForm((f) => ({ ...f, email_contacto: e.target.value }))} className="bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" />
            <input placeholder="Teléfono (opcional)" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} className="bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" />
            <input placeholder="Nombre del admin de la sede" value={form.nombre_admin} onChange={(e) => setForm((f) => ({ ...f, nombre_admin: e.target.value }))} className="bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" required />
            <input placeholder="Email del admin" value={form.email_admin} onChange={(e) => setForm((f) => ({ ...f, email_admin: e.target.value }))} className="bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" required />
            <input type="password" placeholder="Contraseña del admin" value={form.password_admin} onChange={(e) => setForm((f) => ({ ...f, password_admin: e.target.value }))} className="bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold sm:col-span-2" required />
            <div className="sm:col-span-2 flex gap-3">
              <button type="button" onClick={() => setCreando(false)} className="flex-1 border border-line text-gray-300 rounded-lg py-2.5 text-sm hover:bg-ink transition-colors">Cancelar</button>
              <button type="submit" className="flex-[2] bg-gold text-ink font-semibold rounded-lg py-2.5 text-sm hover:bg-gold-soft transition-colors">Crear sede</button>
            </div>
          </form>
        </div>
      )}

      {/* Resumen total */}
      {comparativa.length > 1 && (
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-ink-card border border-line rounded-2xl p-5">
            <Building2 className="w-5 h-5 text-gold mb-2" />
            <div className="text-2xl font-bold text-white">{sedes.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">Sedes totales</div>
          </div>
          <div className="bg-ink-card border border-line rounded-2xl p-5">
            <DollarSign className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-2xl font-bold text-white">{formatoPrecio(totalIngresos)}</div>
            <div className="text-xs text-gray-500 mt-0.5">Ingresos totales (30 días)</div>
          </div>
          <div className="bg-ink-card border border-line rounded-2xl p-5">
            <Calendar className="w-5 h-5 text-blue-400 mb-2" />
            <div className="text-2xl font-bold text-white">{totalTurnos}</div>
            <div className="text-xs text-gray-500 mt-0.5">Turnos totales (30 días)</div>
          </div>
        </div>
      )}

      {/* Gráfico comparativo */}
      {comparativa.length > 1 && (
        <div className="bg-ink-card border border-line rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-gold" />
            <h2 className="text-white font-semibold">Ingresos por sede</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">Últimos 30 días</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={comparativa} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#26262d" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="nombre" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatoCorto} />
              <Tooltip
                contentStyle={{ background: "#1a1a1f", border: "1px solid #26262d", borderRadius: "12px", color: "#fff" }}
                formatter={(v) => [formatoPrecio(v), "Ingresos"]}
              />
              <Bar dataKey="ingresos" fill="#d4af37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Lista de sedes */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sedes.map((s) => (
          <div key={s.id_barberia} className={`bg-ink-card border rounded-2xl p-5 ${s.es_actual ? "border-gold/40" : "border-line"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-gold" />
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${ESTADO_COLOR[s.estado]}`}>{s.estado}</span>
            </div>
            <h3 className="text-white font-semibold mb-1">{s.nombre} {s.es_actual && <span className="text-gold text-xs">(actual)</span>}</h3>
            <p className="text-gray-500 text-xs mb-4">@{s.subdominio}</p>
            {!s.es_actual && (
              React.createElement(
                "a",
                {
                  href: `https://barberproapp.online/login?subdominio=${s.subdominio}`,
                  target: "_blank",
                  rel: "noreferrer",
                  className: "inline-flex items-center gap-1.5 text-sm text-gold hover:underline",
                },
                "Entrar a esta sede ",
                <ExternalLink key="icono" className="w-3.5 h-3.5" />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MisSedes;