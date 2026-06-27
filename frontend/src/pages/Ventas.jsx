import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  BarChart3,
  Wallet,
  Package,
  Users,
  FileDown,
  Sheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/cliente";
import Tabla from "../components/Tabla";

function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [metodoFiltro, setMetodoFiltro] = useState("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const navigate = useNavigate();

  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    try {
      const [resV, resC] = await Promise.all([
        api.get("/ventas"),
        api.get("/clientes"),
      ]);
      setVentas(resV.data);
      setClientes(resC.data);
    } catch (err) {
      setError("No se pudieron cargar las ventas");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const nombreCliente = (id) => {
    if (!id) return "Ocasional";
    const c = clientes.find((x) => x.id_cliente === id);
    return c ? `${c.primer_nombre} ${c.apellidos}` : "Cliente";
  };

  const formatoPrecio = (valor) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor || 0);

  const formatoFechaHora = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const soloFecha = (fechaISO) => fechaISO.slice(0, 10);
  const hoyStr = new Date().toISOString().slice(0, 10);

  const textoMetodo = (m) => {
    const t = {
      efectivo: "Efectivo",
      tarjeta: "Tarjeta",
      transferencia: "Transferencia",
      nequi: "Nequi",
      daviplata: "Daviplata",
    };
    return t[m] || m;
  };

  // Filtrado por método, rango de fechas y búsqueda
  const filtradas = ventas.filter((v) => {
    const fechaV = soloFecha(v.fecha_venta);
    const coincideMetodo =
      metodoFiltro === "todos" || v.metodo_pago === metodoFiltro;
    const coincideDesde = !desde || fechaV >= desde;
    const coincideHasta = !hasta || fechaV <= hasta;
    const texto =
      `${nombreCliente(v.id_cliente)} ${v.numero_factura || ""} ${v.id_venta}`.toLowerCase();
    const coincideBusqueda = texto.includes(busqueda.toLowerCase());
    return coincideMetodo && coincideDesde && coincideHasta && coincideBusqueda;
  });

  // Métricas de HOY
  const ventasHoy = ventas.filter((v) => soloFecha(v.fecha_venta) === hoyStr);
  const totalHoy = ventasHoy.reduce((acc, v) => acc + Number(v.total), 0);
  const unidadesHoy = ventasHoy.reduce(
    (acc, v) => acc + v.items.reduce((a, it) => a + it.cantidad, 0),
    0,
  );
  const clientesUnicosHoy = new Set(
    ventasHoy.filter((v) => v.id_cliente).map((v) => v.id_cliente),
  ).size;

  const metricas = [
    {
      titulo: "VENTAS HOY",
      valor: ventasHoy.length,
      sub: "transacciones",
      icono: BarChart3,
      color: "text-white",
      borde: "border-line",
    },
    {
      titulo: "TOTAL HOY",
      valor: formatoPrecio(totalHoy),
      sub: "incluye IVA si aplica",
      icono: Wallet,
      color: "text-gold",
      borde: "border-gold/30",
    },
    {
      titulo: "PRODUCTOS",
      valor: unidadesHoy,
      sub: "unidades vendidas hoy",
      icono: Package,
      color: "text-white",
      borde: "border-line",
    },
    {
      titulo: "CLIENTES ÚNICOS",
      valor: clientesUnicosHoy,
      sub: "hoy",
      icono: Users,
      color: "text-white",
      borde: "border-line",
    },
  ];

  // Exportar a Excel
  const exportarExcel = () => {
    const filas = filtradas.map((v) => ({
      Venta: `#${v.numero_factura || v.id_venta}`,
      Fecha: formatoFechaHora(v.fecha_venta),
      Cliente: nombreCliente(v.id_cliente),
      Unidades: v.items.reduce((a, it) => a + it.cantidad, 0),
      Método: textoMetodo(v.metodo_pago),
      Subtotal: Number(v.subtotal),
      IVA: Number(v.iva),
      Total: Number(v.total),
    }));
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Ventas");
    XLSX.writeFile(
      libro,
      `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  // Exportar a PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Reporte de ventas", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [["Venta", "Fecha", "Cliente", "Unid.", "Método", "Total"]],
      body: filtradas.map((v) => [
        `#${v.numero_factura || v.id_venta}`,
        formatoFechaHora(v.fecha_venta),
        nombreCliente(v.id_cliente),
        v.items.reduce((a, it) => a + it.cantidad, 0),
        textoMetodo(v.metodo_pago),
        formatoPrecio(v.total),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [212, 175, 55] },
    });

    const totalGeneral = filtradas.reduce((acc, v) => acc + Number(v.total), 0);
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(
      `Total: ${formatoPrecio(totalGeneral)}`,
      14,
      doc.lastAutoTable.finalY + 10,
    );

    doc.save(`ventas_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const columnas = [
    {
      campo: "id_venta",
      titulo: "Venta",
      render: (v) => (
        <div>
          <div className="text-white font-medium">
            #{v.numero_factura || v.id_venta}
          </div>
          <div className="text-xs text-gray-500">
            {formatoFechaHora(v.fecha_venta)}
          </div>
        </div>
      ),
    },
    {
      campo: "id_cliente",
      titulo: "Cliente",
      render: (v) => nombreCliente(v.id_cliente),
    },
    {
      campo: "items",
      titulo: "Items",
      ordenable: false,
      oculta: "hidden md:table-cell",
      render: (v) => `${v.items.reduce((a, it) => a + it.cantidad, 0)} u.`,
    },
    {
      campo: "metodo_pago",
      titulo: "Método",
      oculta: "hidden sm:table-cell",
      render: (v) => (
        <span className="inline-block bg-ink border border-line text-gray-300 text-xs px-2.5 py-1 rounded-full">
          {textoMetodo(v.metodo_pago)}
        </span>
      ),
    },
    {
      campo: "total",
      titulo: "Total",
      alinear: "right",
      render: (v) => (
        <span className="text-gold font-semibold">
          {formatoPrecio(v.total)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Ventas de productos
          </h1>
          <p className="text-gray-400">Historial de ventas y facturas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportarPDF}
            disabled={filtradas.length === 0}
            className="inline-flex items-center gap-2 bg-ink-card border border-line text-gray-300 hover:text-white rounded-lg px-4 py-2.5 transition-colors disabled:opacity-40"
          >
            <FileDown className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={exportarExcel}
            disabled={filtradas.length === 0}
            className="inline-flex items-center gap-2 bg-ink-card border border-line text-gray-300 hover:text-white rounded-lg px-4 py-2.5 transition-colors disabled:opacity-40"
          >
            <Sheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={() => navigate("/ventas/nueva")}
            className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva venta
          </button>
        </div>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricas.map((m) => (
          <div
            key={m.titulo}
            className={`bg-ink-card border ${m.borde} rounded-2xl p-5`}
          >
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-3">
              <m.icono className="w-4 h-4" />
              {m.titulo}
            </div>
            <div className={`text-3xl font-bold mb-1 ${m.color}`}>
              {m.valor}
            </div>
            <div className="text-xs text-gray-500">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-ink-card border border-line rounded-2xl p-4 mb-6 flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 font-medium">DESDE:</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="bg-ink border border-line rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-gold"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 font-medium">HASTA:</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="bg-ink border border-line rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-gold"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 font-medium">MÉTODO:</label>
          <select
            value={metodoFiltro}
            onChange={(e) => setMetodoFiltro(e.target.value)}
            className="bg-ink border border-line rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-gold"
          >
            <option value="todos">Todos</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="nequi">Nequi</option>
            <option value="daviplata">Daviplata</option>
          </select>
        </div>
        <div className="relative lg:ml-auto lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar factura o cliente..."
            className="w-full bg-ink border border-line rounded-lg pl-10 pr-4 py-1.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold"
          />
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-16 text-gray-500">
          Cargando ventas...
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
          {error}
        </div>
      ) : (
        <Tabla
          columnas={columnas}
          datos={filtradas}
          vacioTexto={
            ventas.length === 0
              ? 'Sin ventas. Hacé tu primera venta con "Nueva venta"'
              : "No hay ventas con esos filtros"
          }
        />
      )}
    </div>
  );
}

export default Ventas;
