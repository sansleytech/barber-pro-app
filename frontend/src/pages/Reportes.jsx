import { useState, useEffect, useRef } from "react";
import {
  DollarSign,
  Calendar,
  Receipt,
  XCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/cliente";

const PERIODOS = [
  { dias: 30, label: "1 mes" },
  { dias: 90, label: "3 meses" },
  { dias: 180, label: "6 meses" },
  { dias: 365, label: "12 meses" },
];

const TEXTO_ESTADO = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  completado: "Completado",
  cancelado: "Cancelado",
  no_asistio: "No asistió",
};
const COLORES_ESTADO = {
  pendiente: "#f59e0b",
  confirmado: "#3b82f6",
  completado: "#10b981",
  cancelado: "#ef4444",
  no_asistio: "#6b7280",
};

const money = (v) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(v || 0);
const moneyCorto = (v) => {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
  return `$${v}`;
};

function rangoDesdeDias(dias) {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - (dias - 1));
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { desde: fmt(desde), hasta: fmt(hasta) };
}

const fechaCorta = (f) =>
  f ? new Date(f + "T00:00:00").toLocaleDateString("es-CO") : "—";

function Reportes() {
  const [periodo, setPeriodo] = useState(90);
  const [rangoPersonalizado, setRangoPersonalizado] = useState(false);
  const [desdeCustom, setDesdeCustom] = useState("");
  const [hastaCustom, setHastaCustom] = useState("");
  const [resumen, setResumen] = useState(null);
  const [ingresosMes, setIngresosMes] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [serviciosTop, setServiciosTop] = useState([]);
  const [genero, setGenero] = useState(null);
  const [horasPico, setHorasPico] = useState([]);
  const [clientesFrec, setClientesFrec] = useState([]);
  const [barberoSel, setBarberoSel] = useState("");
  const [rendBarbero, setRendBarbero] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exportando, setExportando] = useState(false);
  const contenidoRef = useRef(null);

  const exportarPDF = () => {
    setExportando(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const W = doc.internal.pageSize.getWidth();
      let y = 15;

      doc.setFontSize(18);
      doc.setTextColor(20, 20, 20);
      doc.text("Reporte - Barber Pro", 14, y);
      y += 7;
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      const { desde: desdeRango, hasta: hastaRango } = rangoActivo();
      const etqPeriodo = rangoPersonalizado
        ? `${fechaCorta(desdeRango)} al ${fechaCorta(hastaRango)}`
        : `ultimos ${PERIODOS.find((p) => p.dias === periodo)?.label || ""}`;
      doc.text(
        `Periodo: ${etqPeriodo}  |  Generado: ${new Date().toLocaleDateString("es-CO")}`,
        14,
        y,
      );
      y += 8;

      // KPIs
      autoTable(doc, {
        startY: y,
        head: [["Metrica", "Actual", "Anterior", "Variacion"]],
        body: [
          [
            "Ingresos totales",
            money(a.ingresos_totales),
            money(ant?.ingresos_totales),
            `${v?.ingresos_totales}%`,
          ],
          [
            "Turnos totales",
            String(a.total_turnos),
            String(ant?.total_turnos),
            `${v?.total_turnos}%`,
          ],
          [
            "Ticket promedio",
            money(a.ticket_promedio),
            money(ant?.ticket_promedio),
            `${v?.ticket_promedio}%`,
          ],
          [
            "Tasa cancelacion",
            `${a.tasa_cancelacion}%`,
            `${ant?.tasa_cancelacion}%`,
            `${v?.tasa_cancelacion}%`,
          ],
        ],
        theme: "striped",
        headStyles: { fillColor: [212, 175, 55], textColor: [20, 20, 20] },
      });
      y = doc.lastAutoTable.finalY + 8;

      // Ranking de barberos
      if (barberos.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(20, 20, 20);
        doc.text("Ranking de barberos", 14, y);
        y += 2;
        autoTable(doc, {
          startY: y + 2,
          head: [["#", "Barbero", "Ingresos", "Turnos", "Clientes"]],
          body: barberos.map((b, i) => [
            String(i + 1),
            b.nombre,
            money(b.ingresos),
            String(b.turnos),
            String(b.clientes_unicos),
          ]),
          theme: "striped",
          headStyles: { fillColor: [212, 175, 55], textColor: [20, 20, 20] },
        });
        y = doc.lastAutoTable.finalY + 8;
      }

      // Servicios top
      if (serviciosTop.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(20, 20, 20);
        doc.text("Servicios mas vendidos", 14, y);
        y += 2;
        autoTable(doc, {
          startY: y + 2,
          head: [["Servicio", "Cantidad"]],
          body: serviciosTop.map((s) => [s.nombre, String(s.cantidad)]),
          theme: "striped",
          headStyles: { fillColor: [167, 139, 250], textColor: [20, 20, 20] },
        });
        y = doc.lastAutoTable.finalY + 8;
      }

      // Clientes frecuentes
      if (clientesFrec.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(20, 20, 20);
        doc.text("Clientes frecuentes", 14, y);
        y += 2;
        autoTable(doc, {
          startY: y + 2,
          head: [["Cliente", "Visitas", "Total gastado", "Última visita"]],
          body: clientesFrec.map((cl) => [
            cl.nombre,
            String(cl.visitas),
            money(cl.total_gastado),
            fechaCorta(cl.ultima_visita),
          ]),
          theme: "striped",
          headStyles: { fillColor: [16, 185, 129], textColor: [20, 20, 20] },
        });
      }

      doc.save("reportes-barberpro.pdf");
    } catch (err) {
      setError("No se pudo generar el PDF");
    } finally {
      setExportando(false);
    }
  };

  const rangoActivo = () => {
    if (rangoPersonalizado && desdeCustom && hastaCustom) {
      return { desde: desdeCustom, hasta: hastaCustom };
    }
    return rangoDesdeDias(periodo);
  };

  const cargar = async () => {
    if (rangoPersonalizado && (!desdeCustom || !hastaCustom)) return;
    setCargando(true);
    setError("");
    try {
      const { desde, hasta } = rangoActivo();
      const dias = Math.round(
        (new Date(hasta) - new Date(desde)) / 86400000,
      ) + 1;
      const meses = Math.max(1, Math.round(dias / 30));
      const [resR, resI, resB, resE, resS, resG, resH, resCF] =
        await Promise.all([
          api.get("/estadisticas/resumen", {
            params: { desde, hasta, comparar: true },
          }),
          api.get(`/estadisticas/ingresos-mensuales?meses=${meses}`),
          api.get("/estadisticas/barberos", { params: { desde, hasta } }),
          api.get("/estadisticas/turnos-estado", { params: { desde, hasta } }),
          api.get("/estadisticas/servicios-top", {
            params: { desde, hasta, limite: 8 },
          }),
          api.get("/estadisticas/genero"),
          api.get("/estadisticas/horas-pico", { params: { desde, hasta } }),
          api.get("/estadisticas/clientes-frecuentes", {
            params: { desde, hasta, limite: 10 },
          }),
        ]);
      setResumen(resR.data);
      setIngresosMes(resI.data);
      setBarberos(resB.data);
      setEstados(resE.data);
      setServiciosTop(resS.data);
      setGenero(resG.data);
      setHorasPico(resH.data);
      setClientesFrec(resCF.data);
    } catch (err) {
      setError("No se pudieron cargar los reportes");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [periodo, rangoPersonalizado, desdeCustom, hastaCustom]);

  useEffect(() => {
    if (!barberoSel) {
      setRendBarbero(null);
      return;
    }
    if (rangoPersonalizado && (!desdeCustom || !hastaCustom)) return;
    const cargarRend = async () => {
      try {
        const { desde, hasta } = rangoActivo();
        const res = await api.get(
          `/estadisticas/rendimiento-barbero/${barberoSel}`,
          { params: { desde, hasta } },
        );
        setRendBarbero(res.data);
      } catch {
        setRendBarbero(null);
      }
    };
    cargarRend();
  }, [barberoSel, periodo, rangoPersonalizado, desdeCustom, hastaCustom]);

  const KpiCard = ({
    icono: Icono,
    color,
    label,
    valor,
    variacion,
    valorAnterior,
    invertir,
  }) => {
    const sube = variacion > 0;
    const esBueno = invertir ? !sube : sube;
    const neutral =
      variacion === 0 || variacion === undefined || variacion === null;
    return (
      <div className="bg-ink-card border border-line rounded-2xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}
          >
            <Icono className="w-5 h-5" />
          </div>
          {!neutral && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                esBueno
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {sube ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(variacion)}%
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          {label}
        </div>
        <div className="text-2xl font-bold text-white">{valor}</div>
        {valorAnterior !== undefined && (
          <div className="text-xs text-gray-600 mt-1">
            Anterior: {valorAnterior}
          </div>
        )}
      </div>
    );
  };

  const MetricaBar = ({ label, valor, variacion }) => {
    const sube = variacion > 0;
    const neutral =
      variacion === 0 || variacion === undefined || variacion === null;
    return (
      <div className="bg-ink border border-line rounded-xl p-4">
        <div className="text-xs text-gray-500 uppercase mb-1">{label}</div>
        <div className="text-xl font-bold text-white">{valor}</div>
        {!neutral && (
          <div
            className={`text-xs font-medium ${sube ? "text-emerald-400" : "text-red-400"}`}
          >
            {sube ? "▲" : "▼"} {Math.abs(variacion)}%
          </div>
        )}
      </div>
    );
  };

  const a = resumen?.actual;
  const ant = resumen?.anterior;
  const v = resumen?.variacion;

  const datosDona = estados
    .filter((e) => e.cantidad > 0)
    .map((e) => ({
      nombre: TEXTO_ESTADO[e.estado] || e.estado,
      valor: e.cantidad,
      color: COLORES_ESTADO[e.estado] || "#6b7280",
    }));

  const topBarberos = barberos.slice(0, 6).map((b) => ({
    nombre: b.nombre.split(" ")[0],
    ingresos: b.ingresos,
  }));

  const topServicios = serviciosTop.map((s) => ({
    nombre: s.nombre,
    cantidad: s.cantidad,
  }));

  const genTotal = genero?.total || 0;
  const genDet = (g) =>
    genero?.detalle?.find((d) => d.genero === g) || {
      cantidad: 0,
      porcentaje: 0,
    };
  const masc = genDet("masculino");
  const fem = genDet("femenino");

  const Card = ({ titulo, subtitulo, children, full }) => (
    <div
      className={`bg-ink-card border border-line rounded-2xl p-5 ${full ? "lg:col-span-2" : ""}`}
    >
      <div className="mb-4">
        <h2 className="text-white font-semibold">{titulo}</h2>
        {subtitulo && <p className="text-xs text-gray-500">{subtitulo}</p>}
      </div>
      {children}
    </div>
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Reportes</h1>
          <p className="text-gray-400">Analítica y métricas del negocio</p>
        </div>
        <button
          onClick={exportarPDF}
          disabled={exportando}
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {exportando ? "Generando..." : "Exportar PDF"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-xs text-gray-500 uppercase tracking-wide mr-2">
          Período:
        </span>
        <div className="flex gap-1 p-1 bg-ink-card border border-line rounded-full">
          {PERIODOS.map((p) => (
            <button
              key={p.dias}
              onClick={() => {
                setRangoPersonalizado(false);
                setPeriodo(p.dias);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !rangoPersonalizado && periodo === p.dias
                  ? "bg-gold text-ink"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setRangoPersonalizado(true)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              rangoPersonalizado
                ? "bg-gold text-ink"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Personalizado
          </button>
        </div>

        {rangoPersonalizado && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={desdeCustom}
              max={hastaCustom || undefined}
              onChange={(e) => setDesdeCustom(e.target.value)}
              className="bg-ink-card border border-line text-white text-sm rounded-full px-3.5 py-2 focus:outline-none focus:border-gold [color-scheme:dark]"
            />
            <span className="text-gray-500 text-sm">hasta</span>
            <input
              type="date"
              value={hastaCustom}
              min={desdeCustom || undefined}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setHastaCustom(e.target.value)}
              className="bg-ink-card border border-line text-white text-sm rounded-full px-3.5 py-2 focus:outline-none focus:border-gold [color-scheme:dark]"
            />
          </div>
        )}
      </div>

      {cargando ? (
        <div className="text-center py-16 text-gray-500">
          Cargando reportes...
        </div>
      ) : !resumen ? (
        <div className="text-center py-16 text-gray-500">Sin datos</div>
      ) : (
        <div ref={contenidoRef}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard
              icono={DollarSign}
              color="bg-emerald-500/10 text-emerald-400"
              label="Ingresos totales"
              valor={money(a.ingresos_totales)}
              variacion={v?.ingresos_totales}
              valorAnterior={money(ant?.ingresos_totales)}
            />
            <KpiCard
              icono={Calendar}
              color="bg-gold/10 text-gold"
              label="Turnos totales"
              valor={a.total_turnos}
              variacion={v?.total_turnos}
              valorAnterior={ant?.total_turnos}
            />
            <KpiCard
              icono={Receipt}
              color="bg-purple-500/10 text-purple-400"
              label="Ticket promedio"
              valor={money(a.ticket_promedio)}
              variacion={v?.ticket_promedio}
              valorAnterior={money(ant?.ticket_promedio)}
            />
            <KpiCard
              icono={XCircle}
              color="bg-red-500/10 text-red-400"
              label="Tasa de cancelación"
              valor={`${a.tasa_cancelacion}%`}
              variacion={v?.tasa_cancelacion}
              valorAnterior={`${ant?.tasa_cancelacion}%`}
              invertir
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card
              titulo="Ingresos mensuales"
              subtitulo="Evolución del período"
              full
            >
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={ingresosMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26262d" />
                  <XAxis dataKey="etiqueta" stroke="#6b7280" fontSize={12} />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={moneyCorto}
                  />
                  <Tooltip
                    formatter={(val) => money(val)}
                    contentStyle={{
                      background: "#1a1a1f",
                      border: "1px solid #26262d",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#d4af37"
                    strokeWidth={2}
                    dot={{ fill: "#d4af37" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card
              titulo="Turnos por estado"
              subtitulo="Distribución del período"
            >
              {datosDona.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-gray-500">
                  Sin turnos en el período
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="60%" height={220}>
                    <PieChart>
                      <Pie
                        data={datosDona}
                        dataKey="valor"
                        nameKey="nombre"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
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
                          borderRadius: 12,
                          color: "#fff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {datosDona.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ background: d.color }}
                        />
                        <span className="text-gray-300 flex-1">{d.nombre}</span>
                        <span className="text-white font-medium">
                          {d.valor}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card
              titulo="Ingresos por barbero"
              subtitulo="Total generado en el período"
            >
              {topBarberos.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-gray-500">
                  Sin datos
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topBarberos}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#26262d" />
                    <XAxis dataKey="nombre" stroke="#6b7280" fontSize={12} />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={moneyCorto}
                    />
                    <Tooltip
                      formatter={(val) => money(val)}
                      contentStyle={{
                        background: "#1a1a1f",
                        border: "1px solid #26262d",
                        borderRadius: 12,
                        color: "#fff",
                      }}
                    />
                    <Bar
                      dataKey="ingresos"
                      fill="#d4af37"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card titulo="Servicios más vendidos" subtitulo="Top del período">
              {topServicios.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-gray-500">
                  Sin datos
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topServicios} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#26262d" />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      stroke="#6b7280"
                      fontSize={11}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1a1a1f",
                        border: "1px solid #26262d",
                        borderRadius: 12,
                        color: "#fff",
                      }}
                    />
                    <Bar
                      dataKey="cantidad"
                      fill="#a78bfa"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card titulo="Horas pico" subtitulo="Turnos por hora del día" full>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={horasPico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26262d" />
                  <XAxis dataKey="etiqueta" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#1a1a1f",
                      border: "1px solid #26262d",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                  />
                  <Bar
                    dataKey="cantidad"
                    fill="#60a5fa"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card
              titulo="Distribución por género"
              subtitulo={`${genTotal} clientes`}
            >
              <div className="flex items-center justify-between gap-6 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold"
                    style={{
                      background: "rgba(96,165,250,0.2)",
                      color: "#93C5FD",
                    }}
                  >
                    ♂
                  </div>
                  <div>
                    <div
                      className="text-3xl font-bold"
                      style={{ color: "#93C5FD" }}
                    >
                      {masc.cantidad}
                    </div>
                    <div className="text-xs text-gray-500">
                      Hombres · {masc.porcentaje}%
                    </div>
                  </div>
                </div>
                <div className="w-px h-10 bg-line" />
                <div className="flex items-center gap-3">
                  <div>
                    <div
                      className="text-3xl font-bold text-right"
                      style={{ color: "#F9A8D4" }}
                    >
                      {fem.cantidad}
                    </div>
                    <div className="text-xs text-gray-500">
                      Mujeres · {fem.porcentaje}%
                    </div>
                  </div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold"
                    style={{
                      background: "rgba(244,114,182,0.2)",
                      color: "#F9A8D4",
                    }}
                  >
                    ♀
                  </div>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-white/5 flex">
                <div
                  style={{
                    width: `${masc.porcentaje}%`,
                    background: "linear-gradient(90deg,#60A5FA,#3B82F6)",
                  }}
                />
                <div
                  style={{
                    width: `${fem.porcentaje}%`,
                    background: "linear-gradient(90deg,#EC4899,#F472B6)",
                  }}
                />
              </div>
            </Card>
          </div>

          <Card
            titulo="🏆 Ranking de barberos"
            subtitulo="Por ingresos generados"
          >
            {barberos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Sin datos</div>
            ) : (
              <div className="space-y-1">
                {barberos.slice(0, 10).map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2.5 border-b border-line last:border-0"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        i === 0
                          ? "bg-gold text-ink"
                          : i === 1
                            ? "bg-gray-300 text-ink"
                            : i === 2
                              ? "bg-orange-700 text-white"
                              : "bg-ink text-gray-400"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {b.nombre}
                      </div>
                      <div className="text-xs text-gray-500">
                        {b.turnos} turnos · {b.clientes_unicos} clientes
                      </div>
                    </div>
                    <div className="text-emerald-400 font-semibold">
                      {money(b.ingresos)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card
            titulo="⭐ Clientes frecuentes"
            subtitulo="Top por cantidad de visitas"
          >
            {clientesFrec.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Sin datos</div>
            ) : (
              <div className="space-y-1">
                {clientesFrec.map((cl, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2.5 border-b border-line last:border-0"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        i === 0
                          ? "bg-gold text-ink"
                          : i === 1
                            ? "bg-gray-300 text-ink"
                            : i === 2
                              ? "bg-orange-700 text-white"
                              : "bg-ink text-gray-400"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {cl.nombre}
                      </div>
                      <div className="text-xs text-gray-500">
                        {cl.visitas} visitas · última:{" "}
                        {fechaCorta(cl.ultima_visita)}
                      </div>
                    </div>
                    <div className="text-emerald-400 font-semibold">
                      {money(cl.total_gastado)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Rendimiento por barbero */}
          <Card
            titulo="Rendimiento por barbero"
            subtitulo="Métricas detalladas con comparativo"
          >
            <select
              value={barberoSel}
              onChange={(e) => setBarberoSel(e.target.value)}
              className="w-full sm:max-w-xs bg-ink border border-line rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold mb-5"
            >
              <option value="">Seleccioná un barbero...</option>
              {barberos.map((b) => (
                <option key={b.id_barbero} value={b.id_barbero}>
                  {b.nombre}
                </option>
              ))}
            </select>

            {!rendBarbero ? (
              <div className="text-center py-8 text-gray-500">
                Elegí un barbero para ver sus métricas
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <MetricaBar
                  label="Ingresos"
                  valor={money(rendBarbero.actual.ingresos)}
                  variacion={rendBarbero.variacion.ingresos}
                />
                <MetricaBar
                  label="Turnos"
                  valor={rendBarbero.actual.turnos}
                  variacion={rendBarbero.variacion.turnos}
                />
                <MetricaBar
                  label="Propinas"
                  valor={money(rendBarbero.actual.propinas)}
                  variacion={rendBarbero.variacion.propinas}
                />
                <MetricaBar
                  label="Clientes unicos"
                  valor={rendBarbero.actual.clientes_unicos}
                  variacion={rendBarbero.variacion.clientes_unicos}
                />
                <MetricaBar
                  label="Ticket promedio"
                  valor={money(rendBarbero.actual.ticket_promedio)}
                  variacion={rendBarbero.variacion.ticket_promedio}
                />
                <div className="bg-ink border border-line rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase mb-1">
                    Rating
                  </div>
                  <div className="text-xl font-bold text-white">
                    {rendBarbero.rating ? `⭐ ${rendBarbero.rating}` : "—"}
                  </div>
                  <div className="text-xs text-gray-600">
                    {rendBarbero.cant_valoraciones} valoraciones
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default Reportes;
