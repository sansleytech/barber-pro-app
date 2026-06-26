import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  ShoppingBag,
  Wallet,
  Package,
  X,
  Save,
  Calendar,
} from "lucide-react";
import api from "../api/cliente";
import Tabla from "../components/Tabla";

function Compras() {
  const [compras, setCompras] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [panelAbierto, setPanelAbierto] = useState(false);

  const hoyStr = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    id_producto: "",
    id_proveedor: "",
    cantidad: "",
    costo_unitario: "",
    fecha_compra: hoyStr,
    factura: "",
    observaciones: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    try {
      const [resC, resP, resPr] = await Promise.all([
        api.get("/compras"),
        api.get("/productos"),
        api.get("/proveedores"),
      ]);
      setCompras(resC.data);
      setProductos(resP.data);
      setProveedores(resPr.data);
    } catch (err) {
      setError("No se pudieron cargar las compras");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const nombreProducto = (id) => {
    const p = productos.find((x) => x.id_producto === id);
    return p ? p.nombre : "Producto";
  };
  const nombreProveedor = (id) => {
    if (!id) return "—";
    const p = proveedores.find((x) => x.id_proveedor === id);
    return p ? p.nombre : "Proveedor";
  };

  const formatoPrecio = (valor) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor || 0);

  const formatoFecha = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha + "T00:00:00").toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  // Solo números para cantidad y costo
  const soloNumeros = (valor) => valor.replace(/[^0-9]/g, "");

  const costoTotal =
    (Number(form.cantidad) || 0) * (Number(form.costo_unitario) || 0);

  const abrirPanel = () => {
    setForm({
      id_producto: "",
      id_proveedor: "",
      cantidad: "",
      costo_unitario: "",
      fecha_compra: hoyStr,
      factura: "",
      observaciones: "",
    });
    setErrorForm("");
    setPanelAbierto(true);
  };

  const registrar = async (e) => {
    e.preventDefault();
    setErrorForm("");

    if (!form.id_producto) {
      setErrorForm("Elegí un producto");
      return;
    }
    if (!form.cantidad || Number(form.cantidad) <= 0) {
      setErrorForm("La cantidad debe ser mayor a cero");
      return;
    }
    if (!form.costo_unitario || Number(form.costo_unitario) <= 0) {
      setErrorForm("El costo unitario debe ser mayor a cero");
      return;
    }

    setGuardando(true);
    const datos = {
      id_producto: Number(form.id_producto),
      id_proveedor: form.id_proveedor ? Number(form.id_proveedor) : null,
      cantidad: Number(form.cantidad),
      costo_unitario: Number(form.costo_unitario),
      fecha_compra: form.fecha_compra,
      factura: form.factura || null,
      observaciones: form.observaciones || null,
    };

    try {
      await api.post("/compras", datos);
      setPanelAbierto(false);
      cargarDatos(); // recarga compras y refleja el stock sumado
    } catch (err) {
      setErrorForm(
        err.response?.data?.detail &&
          typeof err.response.data.detail === "string"
          ? err.response.data.detail
          : "No se pudo registrar la compra",
      );
    } finally {
      setGuardando(false);
    }
  };

  // Filtrado por búsqueda
  const filtradas = compras.filter((c) => {
    const texto =
      `${nombreProducto(c.id_producto)} ${nombreProveedor(c.id_proveedor)} ${c.factura || ""}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  // Métricas del mes actual
  const mesActual = hoyStr.slice(0, 7); // "2026-06"
  const comprasMes = compras.filter(
    (c) => c.fecha_compra?.slice(0, 7) === mesActual,
  );
  const totalMes = comprasMes.reduce(
    (acc, c) => acc + Number(c.costo_total),
    0,
  );
  const unidadesMes = comprasMes.reduce((acc, c) => acc + c.cantidad, 0);
  const totalHistorico = compras.reduce(
    (acc, c) => acc + Number(c.costo_total),
    0,
  );

  const metricas = [
    {
      titulo: "COMPRAS DEL MES",
      valor: comprasMes.length,
      sub: "este mes",
      icono: ShoppingBag,
      color: "text-white",
      borde: "border-line",
    },
    {
      titulo: "INVERTIDO ESTE MES",
      valor: formatoPrecio(totalMes),
      sub: "costo total",
      icono: Wallet,
      color: "text-gold",
      borde: "border-gold/30",
    },
    {
      titulo: "UNIDADES",
      valor: unidadesMes,
      sub: "compradas este mes",
      icono: Package,
      color: "text-white",
      borde: "border-line",
    },
    {
      titulo: "TOTAL HISTÓRICO",
      valor: formatoPrecio(totalHistorico),
      sub: "todas las compras",
      icono: Wallet,
      color: "text-white",
      borde: "border-line",
    },
  ];

  const columnas = [
    {
      campo: "fecha_compra",
      titulo: "Fecha",
      render: (c) => (
        <span className="inline-flex items-center gap-1.5 text-gray-300">
          <Calendar className="w-3.5 h-3.5 text-gray-500" />
          {formatoFecha(c.fecha_compra)}
        </span>
      ),
    },
    {
      campo: "id_producto",
      titulo: "Producto",
      render: (c) => (
        <span className="text-white font-medium">
          {nombreProducto(c.id_producto)}
        </span>
      ),
    },
    {
      campo: "id_proveedor",
      titulo: "Proveedor",
      oculta: "hidden md:table-cell",
      render: (c) => nombreProveedor(c.id_proveedor),
    },
    {
      campo: "cantidad",
      titulo: "Cant.",
      render: (c) => `${c.cantidad} u.`,
    },
    {
      campo: "factura",
      titulo: "Factura",
      ordenable: false,
      oculta: "hidden lg:table-cell",
      render: (c) => c.factura || "—",
    },
    {
      campo: "costo_total",
      titulo: "Total",
      alinear: "right",
      render: (c) => (
        <span className="text-gold font-semibold">
          {formatoPrecio(c.costo_total)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Compras</h1>
          <p className="text-gray-400">Reposición de inventario</p>
        </div>
        <button
          onClick={abrirPanel}
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva compra
        </button>
      </div>

      {/* Métricas */}
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

      {/* Búsqueda */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por producto, proveedor o factura..."
          className="w-full bg-ink-card border border-line rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {cargando ? (
        <div className="text-center py-16 text-gray-500">
          Cargando compras...
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
            compras.length === 0
              ? 'Sin compras todavía. Registrá la primera con "Nueva compra"'
              : "No hay compras con esa búsqueda"
          }
        />
      )}

      {/* Panel lateral de nueva compra */}
      {panelAbierto && (
        <>
          {/* Fondo oscuro */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setPanelAbierto(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-ink-card border-l border-line z-50 overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-line">
              <h2 className="text-xl font-bold text-white">Nueva compra</h2>
              <button
                onClick={() => setPanelAbierto(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-ink rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={registrar} className="p-5 space-y-4">
              {errorForm && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                  {errorForm}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Producto *
                </label>
                <select
                  value={form.id_producto}
                  onChange={(e) => cambiar("id_producto", e.target.value)}
                  className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold"
                  required
                >
                  <option value="">Seleccionar producto...</option>
                  {productos.map((p) => (
                    <option key={p.id_producto} value={p.id_producto}>
                      {p.nombre} (stock: {p.stock_actual})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Proveedor
                </label>
                <select
                  value={form.id_proveedor}
                  onChange={(e) => cambiar("id_proveedor", e.target.value)}
                  className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold"
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map((p) => (
                    <option key={p.id_proveedor} value={p.id_proveedor}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">
                    Cantidad *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.cantidad}
                    onChange={(e) =>
                      cambiar("cantidad", soloNumeros(e.target.value))
                    }
                    placeholder="0"
                    className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">
                    Costo unitario *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.costo_unitario}
                    onChange={(e) =>
                      cambiar("costo_unitario", soloNumeros(e.target.value))
                    }
                    placeholder="0"
                    className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold"
                    required
                  />
                </div>
              </div>

              {/* Costo total en vivo */}
              <div className="flex items-center justify-between bg-ink rounded-lg border border-line px-4 py-3">
                <span className="text-gray-400 text-sm">Costo total</span>
                <span className="text-gold font-bold text-lg">
                  {formatoPrecio(costoTotal)}
                </span>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Fecha de compra *
                </label>
                <input
                  type="date"
                  value={form.fecha_compra}
                  onChange={(e) => cambiar("fecha_compra", e.target.value)}
                  className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  N° de factura
                </label>
                <input
                  type="text"
                  value={form.factura}
                  onChange={(e) => cambiar("factura", e.target.value)}
                  placeholder="Factura del proveedor (opcional)"
                  className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Observaciones
                </label>
                <textarea
                  value={form.observaciones}
                  onChange={(e) => cambiar("observaciones", e.target.value)}
                  rows={3}
                  placeholder="Notas (opcional)"
                  className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-line">
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gold text-ink font-semibold rounded-lg py-3 hover:bg-gold-soft transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {guardando ? "Registrando..." : "Registrar compra"}
                </button>
                <button
                  type="button"
                  onClick={() => setPanelAbierto(false)}
                  className="px-5 border border-line text-gray-300 hover:text-white hover:bg-ink rounded-lg py-3 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default Compras;
