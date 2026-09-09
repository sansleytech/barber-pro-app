import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Receipt,
  XCircle,
  Award,
  Star,
  Users,
  Package,
  Tags,
  Truck,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import api from "../api/cliente";
import { useAuth } from "../context/AuthContext";

const COLORES_ESTADO = {
  pendiente: "#f59e0b",
  confirmado: "#3b82f6",
  en_proceso: "#a855f7",
  completado: "#10b981",
  cancelado: "#ef4444",
  no_asistio: "#6b7280",
};

const TEXTO_ESTADO = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_proceso: "En proceso",
  completado: "Completado",
  cancelado: "Cancelado",
  no_asistio: "No asistió",
};

function calcularDiasRestantes(fechaISO) {
  if (!fechaISO) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(fechaISO);
  limite.setHours(0, 0, 0, 0);
  const dias = Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24));
  return dias;
}

function Dashboard() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "administrador" || usuario?.super_admin;

  const fechaLimite = usuario?.suscripcion_fin || usuario?.trial_hasta;
  const diasRestantes = calcularDiasRestantes(fechaLimite);
  const esTrial = usuario?.barberia_estado === "trial";

  const [resumen, setResumen] = useState(null);
  const [ingresosMes, setIngresosMes] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [conteos, setConteos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setError("");

      // Cada petición se resuelve por separado: si una falla (por ejemplo,
      // /productos con 403 porque el plan no incluye inventario), el resto
      // del dashboard igual se muestra.
      const [
        resR, resI, resB, resE,
        resCl, resPr, resCa, resPv, resSv, resUs,
      ] = await Promise.allSettled([
        api.get("/estadisticas/resumen"),
        api.get("/estadisticas/ingresos-mensuales?meses=6"),
        api.get("/estadisticas/barberos"),
        api.get("/estadisticas/turnos-estado"),
        api.get("/clientes"),
        api.get("/productos"),
        api.get("/categorias"),
        api.get("/proveedores"),
        api.get("/servicios"),
        api.get("/usuarios"),
      ]);

      const valor = (r, porDefecto) => (r.status === "fulfilled" ? r.value.data : porDefecto);

      setResumen(valor(resR, null));
      setIngresosMes(valor(resI, []));
      setBarberos(valor(resB, []));
      setEstados(valor(resE, []));
      setConteos({
        clientes: valor(resCl, []).length,
        productos: valor(resPr, []).length,
        categorias: valor(resCa, []).length,
        proveedores: valor(resPv, []).length,
        servicios: valor(resSv, []).length,
        usuarios: valor(resUs, []).length,
      });

      if (resR.status === "rejected") {
        setError("No se pudieron cargar las estadísticas");
      }

      setCargando(false);
    };
    cargar();
  }, []);

  const formatoPrecio = (valor) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor || 0);

  const formatoCorto = (valor) => {
    if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)}M`;
    if (valor >= 1000) return `$${(valor / 1000).toFixed(0)}k`;
    return `$${valor}`;
  };

  const KpiCard = ({
    icono: Icono,
    label,
    valor,
    variacion,
    colorIcono,
    invertir,
    irA,
  }) => {
    const positivo = invertir ? variacion < 0 : variacion > 0;
    const sinCambio =
      variacion === 0 || variacion === undefined || variacion === null;
    return (
      <div
        onClick={irA ? () => navigate(irA) : undefined}
        className={`bg-ink-card border border-line rounded-2xl p-5 transition-colors ${irA ? "cursor-pointer hover:border-gold/40" : ""
          }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorIcono}`}
          >
            <Icono className="w-5 h-5" />
          </div>
          {!sinCambio && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${positivo
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
        <div className="text-2xl font-bold text-white">{valor}</div>
        <div className="text-sm text-gray-400 mt-0.5">{label}</div>
      </div>
    );
  };

  const ConteoCard = ({ icono: Icono, label, valor, irA, color }) => (
    <div
      onClick={() => navigate(irA)}
      className="bg-ink-card border border-line rounded-xl p-4 cursor-pointer hover:border-gold/40 transition-colors flex items-center gap-3"
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}
      >
        <Icono className="w-4 h-4" />
      </div>
      <div>
        <div className="text-lg font-bold text-white leading-none">{valor}</div>
        <div className="text-xs text-gray-400 mt-1">{label}</div>
      </div>
    </div>
  );

  if (cargando) {
    return (
      <div className="text-center py-20 text-gray-500">
        Cargando dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
        {error}
      </div>
    );
  }

  const a = resumen?.actual || {};
  const v = resumen?.variacion || {};

  const datosDona = estados
    .filter((e) => e.cantidad > 0)
    .map((e) => ({
      nombre: TEXTO_ESTADO[e.estado] || e.estado,
      valor: e.cantidad,
      color: COLORES_ESTADO[e.estado] || "#6b7280",
    }));

  const topBarberos = barberos.slice(0, 5).map((b) => ({
    nombre: b.nombre.split(" ")[0],
    ingresos: b.ingresos,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-gray-400">Resumen de los últimos 30 días</p>
      </div>

      {esAdmin && diasRestantes !== null && diasRestantes <= 30 && (
        <div className={`mb-6 flex items-center justify-between gap-4 rounded-2xl px-5 py-4 border ${diasRestantes <= 3 ? "bg-red-500/5 border-red-500/25" : "bg-gold/5 border-gold/20"
          }`}>
          <p className="text-sm text-gray-200">
            {esTrial ? "Tu prueba gratuita" : "Tu plan actual"} vence en{" "}
            <strong className={diasRestantes <= 3 ? "text-red-400" : "text-gold"}>
              {diasRestantes <= 0 ? "hoy" : `${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}`}
            </strong>
            {diasRestantes <= 0 && " — actualizá tu plan para seguir usando el sistema"}
          </p>
          <button
            onClick={() => navigate("/planes")}
            className="bg-gold text-ink font-semibold text-sm rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors whitespace-nowrap"
          >
            {esTrial ? "Elegir un plan" : "Renovar"}
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {esAdmin && (
          <KpiCard
            icono={DollarSign}
            label="Ingresos totales"
            valor={formatoPrecio(a.ingresos_totales)}
            variacion={v.ingresos_totales}
            colorIcono="bg-emerald-500/10 text-emerald-400"
            irA="/caja"
          />
        )}
        <KpiCard
          icono={Calendar}
          label="Turnos totales"
          valor={a.total_turnos}
          variacion={v.total_turnos}
          colorIcono="bg-gold/10 text-gold"
          irA="/turnos"
        />
        {esAdmin && (
          <KpiCard
            icono={Receipt}
            label="Ticket promedio"
            valor={formatoPrecio(a.ticket_promedio)}
            variacion={v.ticket_promedio}
            colorIcono="bg-purple-500/10 text-purple-400"
            irA="/ventas"
          />
        )}
        <KpiCard
          icono={XCircle}
          label="Tasa de cancelación"
          valor={`${a.tasa_cancelacion}%`}
          variacion={v.tasa_cancelacion}
          colorIcono="bg-red-500/10 text-red-400"
          invertir
          irA="/turnos"
        />
      </div>

      {/* Resumen del negocio: cantidad de registros */}
      {conteos && (
        <div className="mb-6">
          <h2 className="text-white font-semibold mb-3">Resumen del negocio</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            <ConteoCard
              icono={Users}
              label="Clientes"
              valor={conteos.clientes}
              irA="/clientes"
              color="bg-blue-500/10 text-blue-400"
            />
            <ConteoCard
              icono={Award}
              label="Barberos"
              valor={barberos.length}
              irA="/barberos"
              color="bg-gold/10 text-gold"
            />
            <ConteoCard
              icono={Briefcase}
              label="Servicios"
              valor={conteos.servicios}
              irA="/servicios"
              color="bg-pink-500/10 text-pink-400"
            />
            <ConteoCard
              icono={Package}
              label="Productos"
              valor={conteos.productos}
              irA="/productos"
              color="bg-emerald-500/10 text-emerald-400"
            />
            <ConteoCard
              icono={Tags}
              label="Categorías"
              valor={conteos.categorias}
              irA="/categorias"
              color="bg-amber-500/10 text-amber-400"
            />
            <ConteoCard
              icono={Truck}
              label="Proveedores"
              valor={conteos.proveedores}
              irA="/proveedores"
              color="bg-purple-500/10 text-purple-400"
            />
            {esAdmin && (
              <ConteoCard
                icono={ShieldCheck}
                label="Usuarios"
                valor={conteos.usuarios}
                irA="/usuarios"
                color="bg-cyan-500/10 text-cyan-400"
              />
            )}
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {esAdmin && (
          <div className="lg:col-span-2 bg-ink-card border border-line rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-1">
              Ingresos mensuales
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Evolución de los últimos 6 meses
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={ingresosMes}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="etiqueta"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatoCorto}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a1f",
                    border: "1px solid #26262d",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  formatter={(valor) => [formatoPrecio(valor), "Ingresos"]}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#d4af37"
                  strokeWidth={2.5}
                  dot={{ fill: "#d4af37", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div
          className={`bg-ink-card border border-line rounded-2xl p-6 ${esAdmin ? "" : "lg:col-span-3"}`}
        >
          <h2 className="text-white font-semibold mb-1">Turnos por estado</h2>
          <p className="text-xs text-gray-500 mb-4">Distribución del período</p>
          {datosDona.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-16">
              Sin turnos en el período
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={datosDona}
                    dataKey="valor"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {datosDona.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#1a1a1f",
                      border: "1px solid #26262d",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {datosDona.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span className="text-gray-300 flex-1">{d.nombre}</span>
                    <span className="text-white font-medium">{d.valor}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ranking de barberos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {esAdmin && (
          <div className="bg-ink-card border border-line rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-5 h-5 text-gold" />
              <h2 className="text-white font-semibold">Ingresos por barbero</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">Top 5 del período</p>
            {topBarberos.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-16">
                Sin datos
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={topBarberos}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="nombre"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatoCorto}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1a1a1f",
                      border: "1px solid #26262d",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    formatter={(valor) => [formatoPrecio(valor), "Ingresos"]}
                    cursor={{ fill: "rgba(212,175,55,0.1)" }}
                  />
                  <Bar
                    dataKey="ingresos"
                    fill="#d4af37"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        <div
          className={`bg-ink-card border border-line rounded-2xl p-6 ${esAdmin ? "" : "lg:col-span-2"}`}
        >
          <h2 className="text-white font-semibold mb-4">Ranking detallado</h2>
          {barberos.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-16">
              Sin datos del período
            </p>
          ) : (
            <div className="space-y-3">
              {barberos.slice(0, 5).map((b, i) => (
                <div
                  key={b.id_barbero}
                  onClick={() => navigate("/barberos")}
                  className="flex items-center gap-3 cursor-pointer hover:bg-ink rounded-lg p-1 -m-1 transition-colors"
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-gold text-ink" : "bg-ink text-gray-400"
                      }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {b.nombre}
                    </div>
                    <div className="text-xs text-gray-500">
                      {b.turnos} turnos · {b.clientes_unicos} clientes
                    </div>
                  </div>
                  {esAdmin && b.rating != null && (
                    <span className="inline-flex items-center gap-1 text-xs text-gold">
                      <Star className="w-3 h-3 fill-gold" />
                      {b.rating}
                    </span>
                  )}
                  {esAdmin && (
                    <span className="text-gold font-semibold text-sm w-20 text-right">
                      {formatoPrecio(b.ingresos)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;