import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  AlertTriangle,
  LayoutGrid,
  List,
  Boxes,
  DollarSign,
  Bell,
  XCircle,
  Minus,
} from "lucide-react";
import api from "../api/cliente";
import Tabla from "../components/Tabla";

function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState("tabla");
  const [catFiltro, setCatFiltro] = useState("todos");
  const navigate = useNavigate();

  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    try {
      const [resProd, resCat] = await Promise.all([
        api.get("/productos"),
        api.get("/categorias"),
      ]);
      setProductos(resProd.data);
      setCategorias(resCat.data);
    } catch (err) {
      setError("No se pudieron cargar los productos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const nombreCategoria = (idCat) => {
    const cat = categorias.find((c) => c.id_categoria === idCat);
    return cat ? cat.nombre : "Sin categoría";
  };

  const eliminarProducto = async (id, nombre) => {
    if (!confirm(`¿Seguro que querés desactivar "${nombre}"?`)) return;
    try {
      await api.delete(`/productos/${id}`);
      cargarDatos();
    } catch {
      alert("No se pudo desactivar el producto");
    }
  };

  // Ajuste rápido de stock (+1 / -1) usando el PUT existente
  const ajustarStock = async (producto, delta) => {
    const nuevoStock = Math.max(0, (producto.stock_actual || 0) + delta);
    try {
      await api.put(`/productos/${producto.id_producto}`, {
        stock_actual: nuevoStock,
      });
      // Actualizamos en memoria sin recargar todo (más fluido)
      setProductos((prev) =>
        prev.map((p) =>
          p.id_producto === producto.id_producto
            ? {
                ...p,
                stock_actual: nuevoStock,
                stock_bajo: nuevoStock <= p.stock_minimo,
              }
            : p,
        ),
      );
    } catch {
      alert("No se pudo ajustar el stock");
    }
  };

  // Filtrado por búsqueda Y por categoría
  const filtrados = productos.filter((p) => {
    const coincideBusqueda =
      `${p.nombre} ${p.marca || ""} ${p.codigo_barras || ""}`
        .toLowerCase()
        .includes(busqueda.toLowerCase());
    const coincideCategoria =
      catFiltro === "todos" || p.id_categoria === Number(catFiltro);
    return coincideBusqueda && coincideCategoria;
  });

  const formatoPrecio = (valor) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor || 0);

  // Métricas calculadas
  const totalProductos = productos.length;
  const valorInventario = productos.reduce(
    (acc, p) => acc + (p.precio_venta || 0) * (p.stock_actual || 0),
    0,
  );
  const stockBajo = productos.filter((p) => p.stock_bajo).length;
  const agotados = productos.filter((p) => (p.stock_actual || 0) === 0).length;

  // Calcula el margen % entre costo y precio
  const margen = (p) => {
    if (!p.costo_actual || p.costo_actual === 0) return null;
    return Math.round(
      ((p.precio_venta - p.costo_actual) / p.costo_actual) * 100,
    );
  };

  // Tarjetas de métricas
  const metricas = [
    {
      titulo: "TOTAL PRODUCTOS",
      valor: totalProductos,
      sub: "activos",
      icono: Boxes,
      color: "text-gray-300",
      borde: "border-line",
    },
    {
      titulo: "VALOR INVENTARIO",
      valor: formatoPrecio(valorInventario),
      sub: "precio de venta",
      icono: DollarSign,
      color: "text-gold",
      borde: "border-line",
    },
    {
      titulo: "STOCK BAJO",
      valor: stockBajo,
      sub: "requieren reposición",
      icono: Bell,
      color: "text-gold",
      borde: "border-gold/30",
    },
    {
      titulo: "AGOTADOS",
      valor: agotados,
      sub: "stock en 0",
      icono: XCircle,
      color: "text-red-400",
      borde: "border-red-500/30",
    },
  ];

  const columnas = [
    {
      campo: "nombre",
      titulo: "Producto",
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.foto ? (
            <img src={p.foto} alt={p.nombre} className="w-10 h-10 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-ink border border-line flex items-center justify-center text-gray-600 text-xs shrink-0">
              {p.nombre?.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{p.nombre}</span>
              {p.stock_bajo && <AlertTriangle className="w-4 h-4 text-red-400" />}
            </div>
            {p.marca && <span className="text-xs text-gray-500">{p.marca}</span>}
          </div>
        </div>
      ),
    },
    {
      campo: "id_categoria",
      titulo: "Categoría",
      oculta: "hidden md:table-cell",
      render: (p) => (
        <span className="inline-block bg-gold/10 text-gold text-xs font-medium px-2.5 py-1 rounded-full">
          {nombreCategoria(p.id_categoria)}
        </span>
      ),
    },
    {
      campo: "stock_actual",
      titulo: "Stock",
      render: (p) => {
        const pct = p.stock_maximo
          ? Math.min(100, (p.stock_actual / p.stock_maximo) * 100)
          : 0;
        const color = p.stock_bajo ? "bg-red-400" : "bg-emerald-400";
        return (
          <div className="flex items-center gap-3 min-w-[140px]">
            <span
              className={`text-sm font-medium ${p.stock_bajo ? "text-red-400" : "text-white"}`}
            >
              {p.stock_actual}/{p.stock_maximo}
            </span>
            <div className="flex-1 h-1.5 bg-ink rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      campo: "costo_actual",
      titulo: "Costo",
      oculta: "hidden lg:table-cell",
      render: (p) => formatoPrecio(p.costo_actual),
    },
    {
      campo: "precio_venta",
      titulo: "Precio",
      render: (p) => (
        <span className="text-gold font-medium">
          {formatoPrecio(p.precio_venta)}
        </span>
      ),
    },
    {
      campo: "margen",
      titulo: "Margen",
      ordenable: false,
      oculta: "hidden lg:table-cell",
      render: (p) => {
        const m = margen(p);
        return m === null ? (
          <span className="text-gray-500">—</span>
        ) : (
          <span className={m >= 0 ? "text-emerald-400" : "text-red-400"}>
            {m >= 0 ? "+" : ""}
            {m}%
          </span>
        );
      },
    },
    {
      campo: "acciones",
      titulo: "Acciones",
      ordenable: false,
      alinear: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => ajustarStock(p, 1)}
            className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
            title="Sumar stock"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => ajustarStock(p, -1)}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Restar stock"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/productos/editar/${p.id_producto}`)}
            className="p-1.5 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => eliminarProducto(p.id_producto, p.nombre)}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Desactivar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Productos</h1>
          <p className="text-gray-400">Inventario y stock de tu barbería</p>
        </div>
        <button
          onClick={() => navigate("/productos/nuevo")}
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo producto
        </button>
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

      {/* Filtro por categoría */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button
          onClick={() => setCatFiltro("todos")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            catFiltro === "todos"
              ? "bg-gold text-ink"
              : "bg-ink-card border border-line text-gray-300 hover:text-white"
          }`}
        >
          Todos
        </button>
        {categorias.map((c) => (
          <button
            key={c.id_categoria}
            onClick={() => setCatFiltro(String(c.id_categoria))}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              catFiltro === String(c.id_categoria)
                ? "bg-gold text-ink"
                : "bg-ink-card border border-line text-gray-300 hover:text-white"
            }`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {/* Buscador + selector de vista */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full bg-ink-card border border-line rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
          />
        </div>
        <div className="flex items-center bg-ink-card border border-line rounded-lg p-1">
          <button
            onClick={() => setVista("tabla")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              vista === "tabla"
                ? "bg-gold text-ink"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <List className="w-4 h-4" /> Lista
          </button>
          <button
            onClick={() => setVista("cards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              vista === "cards"
                ? "bg-gold text-ink"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Cards
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-16 text-gray-500">
          Cargando productos...
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
          {error}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            {busqueda || catFiltro !== "todos"
              ? "No se encontraron productos"
              : "Todavía no hay productos"}
          </p>
        </div>
      ) : vista === "tabla" ? (
        <Tabla columnas={columnas} datos={filtrados} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtrados.map((p) => (
            <div
              key={p.id_producto}
              className="bg-ink-card border border-line rounded-2xl overflow-hidden hover:border-gold/40 transition-colors"
            >
              <div className="h-40 bg-ink-soft flex items-center justify-center relative">
                {p.foto ? (
                  <img
                    src={p.foto}
                    alt={p.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-12 h-12 text-gray-700" />
                )}
                {p.stock_bajo && (
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-red-500/90 text-white text-xs font-medium px-2 py-1 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Stock bajo
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold leading-tight">
                  {p.nombre}
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  {p.marca || "Sin marca"} · {nombreCategoria(p.id_categoria)}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gold font-bold text-lg">
                    {formatoPrecio(p.precio_venta)}
                  </span>
                  <span
                    className={`text-sm ${p.stock_bajo ? "text-red-400" : "text-gray-400"}`}
                  >
                    Stock: {p.stock_actual}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => ajustarStock(p, -1)}
                    className="p-2 bg-ink border border-line text-gray-300 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => ajustarStock(p, 1)}
                    className="p-2 bg-ink border border-line text-gray-300 hover:text-emerald-400 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/productos/editar/${p.id_producto}`)
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-ink border border-line text-gray-300 hover:text-gold hover:border-gold/40 rounded-lg py-2 text-sm transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Editar
                  </button>
                  <button
                    onClick={() => eliminarProducto(p.id_producto, p.nombre)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Productos;
