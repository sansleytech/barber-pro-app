import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  List,
  FileText,
  Lock,
  LockOpen,
  X,
  Check,
  Gem,
  ShoppingCart,
} from "lucide-react";
import api from "../api/cliente";
import { useAuth } from "../context/AuthContext";

// ============================================================
// AJUSTA ESTAS RUTAS si tus endpoints reales tienen otro nombre
// ============================================================
const ENDPOINTS = {
  dia: "/caja/dia",
  metodoPago: "/caja/metodo-pago",
  descuento: "/caja/descuento",
  cerrar: "/caja/cerrar",
  reabrir: "/caja/reabrir",
  historial: "/caja/historial",
  ventasResumenDia: "/ventas-productos/resumen-dia",
  gastos: "/gastos",
};

const METODOS_PAGO = [
  { valor: "Efectivo", emoji: "💵" },
  { valor: "Tarjeta", emoji: "💳" },
  { valor: "Transferencia", emoji: "🏦" },
  { valor: "Nequi", emoji: "📱" },
  { valor: "Daviplata", emoji: "📱" },
];

const CATEGORIAS_GASTO = [
  "Arriendo",
  "Servicios públicos",
  "Sueldos",
  "Insumos",
  "Limpieza",
  "Marketing",
  "Otros",
];

function formatCOP(monto) {
  const n = parseFloat(monto || 0);
  return "$ " + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

function formatHora12(hora) {
  if (!hora) return "—";
  const [h, m] = hora.split(":").map(Number);
  const periodo = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${periodo}`;
}

function fechaHoyLocal() {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function Toast({ mensaje, tipo }) {
  if (!mensaje) return null;
  const colores = {
    success: "border-emerald-500/30 text-emerald-300",
    error: "border-red-500/30 text-red-300",
    warning: "border-gold/30 text-gold",
  };
  return (
    <div
      className={`fixed bottom-6 right-6 z-[1000] px-5 py-3.5 rounded-2xl bg-ink-card/95 backdrop-blur border ${
        colores[tipo] || colores.success
      } text-sm shadow-xl animate-fade-in`}
    >
      {mensaje}
    </div>
  );
}

export default function CajaDiaria() {
  const { usuario } = useAuth();

  const [fecha, setFecha] = useState(fechaHoyLocal());
  const [dataCaja, setDataCaja] = useState(null);
  const [ventasDia, setVentasDia] = useState(null);
  const [gastosDia, setGastosDia] = useState([]);
  const [descuento, setDescuento] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState({ mensaje: "", tipo: "success" });

  const [modalPago, setModalPago] = useState(null); // { idTurno, cliente, precio }
  const [modalCerrarAbierto, setModalCerrarAbierto] = useState(false);
  const [observacionesCierre, setObservacionesCierre] = useState("");
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [histDesde, setHistDesde] = useState("");
  const [histHasta, setHistHasta] = useState("");
  const [modalGastoAbierto, setModalGastoAbierto] = useState(false);
  const [gastoForm, setGastoForm] = useState({ categoria: "", monto: "", descripcion: "" });
  const [gastoError, setGastoError] = useState("");

  const mostrarToast = (mensaje, tipo = "success") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast({ mensaje: "", tipo }), 3000);
  };

  // ============================================================
  // CARGA DE DATOS
  // ============================================================
  const cargarCaja = useCallback(async () => {
    setCargando(true);
    try {
      const idBarbero = usuario?.rol === "barbero" ? usuario.id_barbero : null;
      const res = await api.get(ENDPOINTS.dia, { params: { fecha, id_barbero: idBarbero } });
      setDataCaja(res.data);
      setDescuento(res.data?.descuento?.monto || 0);
    } catch (err) {
      mostrarToast("Error cargando la caja del día", "error");
    } finally {
      setCargando(false);
    }
  }, [fecha, usuario]);

  const cargarVentasDia = useCallback(async () => {
    try {
      const res = await api.get(ENDPOINTS.ventasResumenDia, { params: { fecha } });
      setVentasDia(res.data);
    } catch {
      setVentasDia({ resumen: { cantidad_ventas: 0, total_ventas: 0 }, topProductos: [] });
    }
  }, [fecha]);

  const cargarGastos = useCallback(async () => {
    try {
      const res = await api.get(ENDPOINTS.gastos, { params: { fecha } });
      setGastosDia(res.data || []);
    } catch {
      setGastosDia([]);
    }
  }, [fecha]);

  useEffect(() => {
    cargarCaja();
    cargarVentasDia();
    cargarGastos();
  }, [cargarCaja, cargarVentasDia, cargarGastos]);

  // ============================================================
  // DERIVADOS
  // ============================================================
  const resumen = dataCaja?.resumen || {};
  const cerrada = !!dataCaja?.cerrada;
  const cierre = dataCaja?.cierre;
  const totalBruto = resumen.total_bruto || 0;
  const totalNeto = totalBruto - descuento;
  const totalPropinas = resumen.total_propinas || 0;
  const totalProductos = resumen.total_productos || 0;
  const totalGastos = gastosDia.reduce((acc, g) => acc + parseFloat(g.monto || 0), 0);
  const totalCajaGeneral = totalNeto + totalPropinas + totalProductos - totalGastos;

  // ============================================================
  // ACCIONES
  // ============================================================
  const cambiarFecha = (nuevaFecha) => setFecha(nuevaFecha);

  const irDia = (delta) => {
    const d = new Date(fecha);
    d.setDate(d.getDate() + delta);
    cambiarFecha(d.toISOString().split("T")[0]);
  };

  const guardarMetodoPago = async (metodo) => {
    if (!modalPago) return;
    try {
      await api.patch(ENDPOINTS.metodoPago, {
        id_turno: modalPago.idTurno,
        metodo_pago: metodo,
      });
      mostrarToast("Método actualizado");
      setModalPago(null);
      cargarCaja();
    } catch {
      mostrarToast("Error al actualizar el método de pago", "error");
    }
  };

  // Debounce del descuento
  useEffect(() => {
    if (cargando || cerrada) return;
    const timeout = setTimeout(async () => {
      try {
        await api.put(ENDPOINTS.descuento, { fecha, monto: descuento });
      } catch {
        mostrarToast("Error guardando el descuento", "error");
      }
    }, 600);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descuento]);

  const confirmarCierre = async () => {
    try {
      await api.post(ENDPOINTS.cerrar, {
        fecha,
        id_usuario: usuario?.id_usuario,
        observaciones: observacionesCierre.trim(),
      });
      mostrarToast("Caja cerrada");
      setModalCerrarAbierto(false);
      cargarCaja();
    } catch (err) {
      mostrarToast(err.response?.data?.detail || "Error al cerrar la caja", "error");
    }
  };

  const reabrirCaja = async () => {
    if (fecha < fechaHoyLocal()) {
      mostrarToast("No se puede reabrir una fecha anterior a hoy", "warning");
      return;
    }
    if (!window.confirm("¿Reabrir la caja de este día?")) return;
    try {
      await api.post(ENDPOINTS.reabrir, { fecha });
      mostrarToast("Caja reabierta");
      cargarCaja();
    } catch {
      mostrarToast("Error al reabrir la caja", "error");
    }
  };

  const cargarHistorial = async (desde, hasta) => {
    try {
      const res = await api.get(ENDPOINTS.historial, {
        params: { desde: desde || undefined, hasta: hasta || undefined },
      });
      setHistorial(res.data || []);
    } catch {
      setHistorial([]);
    }
  };

  const abrirHistorial = async () => {
    setModalHistorialAbierto(true);
    try {
      await cargarHistorial(histDesde, histHasta);
    } catch {
      setHistorial([]);
    }
  };

  const guardarGasto = async () => {
    setGastoError("");
    const monto = parseFloat(gastoForm.monto);
    if (!gastoForm.categoria) return setGastoError("Seleccioná una categoría");
    if (!monto || monto <= 0) return setGastoError("Ingresá un monto mayor a 0");

    try {
      await api.post(ENDPOINTS.gastos, {
        fecha,
        categoria: gastoForm.categoria,
        monto,
        descripcion: gastoForm.descripcion.trim(),
        id_usuario: usuario?.id_usuario,
      });
      mostrarToast("Gasto registrado");
      setModalGastoAbierto(false);
      setGastoForm({ categoria: "", monto: "", descripcion: "" });
      cargarGastos();
      cargarCaja();
    } catch (err) {
      setGastoError(err.response?.data?.detail || "No se pudo registrar el gasto");
    }
  };

  const eliminarGasto = async (id) => {
    if (!window.confirm("¿Eliminar este gasto?")) return;
    try {
      await api.delete(`${ENDPOINTS.gastos}/${id}`);
      mostrarToast("Gasto eliminado");
      cargarGastos();
      cargarCaja();
    } catch {
      mostrarToast("Error al eliminar el gasto", "error");
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-white">Caja Diaria</h1>
        <p className="text-sm text-gray-400">Cierre del día con cálculo de bruto y neto</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-ink-card border border-line rounded-2xl px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => irDia(-1)}
            className="w-9 h-9 rounded-xl bg-ink border border-line text-gray-400 hover:text-gold hover:border-gold/40 transition-colors flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={fecha}
            onChange={(e) => cambiarFecha(e.target.value)}
            className="bg-ink border border-line text-white text-sm font-semibold rounded-xl px-3.5 py-2 focus:outline-none focus:border-gold [color-scheme:dark]"
          />
          <button
            onClick={() => irDia(1)}
            className="w-9 h-9 rounded-xl bg-ink border border-line text-gray-400 hover:text-gold hover:border-gold/40 transition-colors flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => cambiarFecha(fechaHoyLocal())}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-ink border border-line text-gray-300 hover:text-white hover:border-gold/40 transition-colors"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
              cerrada
                ? "bg-red-500/10 text-red-400 border border-red-500/25"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {cerrada ? "Caja cerrada" : "Caja abierta"}
          </span>

          <button
            onClick={abrirHistorial}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-ink border border-line text-gray-300 hover:text-white transition-colors"
          >
            <List className="w-3.5 h-3.5" /> Historial
          </button>

          <button
            onClick={() => setModalGastoAbierto(true)}
            disabled={cerrada}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-ink border border-line text-gray-300 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Agregar gasto
          </button>

          <button
            onClick={() => {
              if (resumen.total_turnos === 0) return mostrarToast("No hay servicios completados", "warning");
              setObservacionesCierre("");
              setModalCerrarAbierto(true);
            }}
            disabled={cerrada}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-400 to-emerald-600 text-ink hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Lock className="w-3.5 h-3.5" /> Cerrar caja
          </button>
        </div>
      </div>

      {/* Banner de cierre */}
      {cerrada && cierre && (
        <div className="flex items-center justify-between gap-4 bg-red-500/5 border border-red-500/20 rounded-2xl px-5 py-4">
          <div>
            <p className="text-sm text-gray-200">
              Cerrada por <strong className="text-white">{cierre.nombre_usuario}</strong> · Neto:{" "}
              <strong className="text-gold">{formatCOP(cierre.total_ingresos)}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(cierre.fecha_cierre).toLocaleString("es-CO")}
              {cierre.observaciones ? ` · ${cierre.observaciones}` : ""}
            </p>
          </div>
          <button
            onClick={reabrirCaja}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-ink border border-line text-gray-300 hover:text-white transition-colors whitespace-nowrap"
          >
            <LockOpen className="w-3.5 h-3.5" /> Reabrir
          </button>
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr] gap-4">
        {/* Totales */}
        <div className="bg-gradient-to-br from-gold/5 to-transparent border border-gold/20 rounded-2xl p-6">
          <div className="flex justify-between items-center py-2.5">
            <span className="text-sm text-gray-400">Bruto del día</span>
            <span className="text-lg font-bold text-white">{formatCOP(totalBruto)}</span>
          </div>
          <div className="flex justify-between items-center py-2.5">
            <span className="text-sm text-gray-400">Egresos en el día</span>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 bg-ink border border-red-500/25 rounded-xl max-w-[180px] ${
                cerrada ? "opacity-50" : ""
              }`}
            >
              <span className="text-gray-500 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="100"
                disabled={cerrada}
                value={descuento || ""}
                onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="bg-transparent border-none outline-none text-red-400 font-bold text-right w-full"
              />
            </div>
          </div>
          <div className="flex justify-between items-center py-3.5 mt-1.5 border-t border-line">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold/90">Servicio</span>
            <span className="text-3xl font-bold bg-gradient-to-br from-yellow-200 to-gold bg-clip-text text-transparent">
              {formatCOP(totalNeto)}
            </span>
          </div>

          {totalPropinas > 0 && (
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gold flex items-center gap-1.5">
                <Gem className="w-3.5 h-3.5" /> Propinas
              </span>
              <span className="text-sm font-bold text-gold">{formatCOP(totalPropinas)}</span>
            </div>
          )}

          {totalProductos > 0 && (
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" /> Productos vendidos
              </span>
              <span className="text-sm font-bold text-emerald-400">{formatCOP(totalProductos)}</span>
            </div>
          )}

          {(totalPropinas > 0 || totalProductos > 0) && (
            <div className="flex justify-between items-center pt-3 mt-2.5 border-t border-dashed border-gold/25">
              <span className="text-xs font-bold uppercase tracking-wider text-gold">Caja total del día</span>
              <span className="text-xl font-extrabold bg-gradient-to-br from-yellow-200 to-gold bg-clip-text text-transparent">
                {formatCOP(totalCajaGeneral)}
              </span>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">{resumen.total_turnos || 0} servicios completados</p>
        </div>

        {/* Por método de pago */}
        <div className="bg-ink-card border border-line rounded-2xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3.5">
            Por método de pago
          </h3>
          {(dataCaja?.porMetodo || []).length === 0 ? (
            <p className="text-xs text-gray-500">Sin datos</p>
          ) : (
            dataCaja.porMetodo.map((m, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-line last:border-0 text-sm">
                <span className="text-white font-medium">
                  {m.metodo} <span className="text-gray-500 text-xs ml-1">({m.cantidad})</span>
                </span>
                <span className="text-gold font-bold">{formatCOP(m.total)}</span>
              </div>
            ))
          )}
        </div>

        {/* Por barbero */}
        <div className="bg-ink-card border border-line rounded-2xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3.5">Por barbero</h3>
          {(dataCaja?.porBarbero || []).length === 0 ? (
            <p className="text-xs text-gray-500">Solo tu barbería</p>
          ) : (
            dataCaja.porBarbero.map((b, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-line last:border-0 text-sm">
                <span className="text-white font-medium">
                  {b.barbero} <span className="text-gray-500 text-xs ml-1">({b.cantidad})</span>
                </span>
                <span className="text-gold font-bold">{formatCOP(b.total)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tabla de detalle */}
      <div className="bg-ink-card border border-line rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-line">
          <h3 className="text-white font-bold">Detalle de servicios</h3>
          <p className="text-xs text-gray-500 mt-1">
            {cerrada ? "⚠️ Caja cerrada · No se pueden modificar métodos de pago" : "Tocá un servicio para asignar método de pago"}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.02]">
                {["Hora", "Cliente", "Barbero", "Servicio", "Método", "Total"].map((h) => (
                  <th
                    key={h}
                    className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-line ${
                      h === "Total" ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(dataCaja?.detalle || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <p className="text-white font-semibold text-sm mb-1">Sin servicios completados</p>
                    <p className="text-xs text-gray-500">
                      Los servicios aparecen acá cuando marcás un turno como "Completado"
                    </p>
                  </td>
                </tr>
              ) : (
                dataCaja.detalle.map((t) => (
                  <tr
                    key={t.id_turno}
                    onClick={() =>
                      !cerrada &&
                      setModalPago({ idTurno: t.id_turno, cliente: t.cliente, precio: t.precio })
                    }
                    className={`border-b border-line last:border-0 ${
                      cerrada ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:bg-gold/[0.03]"
                    }`}
                  >
                    <td className="px-6 py-3.5 text-gold font-mono text-xs font-bold">
                      {formatHora12(t.hora_inicio)}
                    </td>
                    <td className="px-6 py-3.5 text-white font-medium text-sm">{t.cliente}</td>
                    <td className="px-6 py-3.5 text-gray-400 text-sm">{t.barbero}</td>
                    <td className="px-6 py-3.5 text-gray-300 text-sm">{t.servicio}</td>
                    <td className="px-6 py-3.5">
                      {t.metodo_pago ? (
                        <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[11px] font-bold">
                          {t.metodo_pago}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right text-gold font-bold">{formatCOP(t.precio)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MODAL: Método de pago ===== */}
      {modalPago && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setModalPago(null)}
        >
          <div
            className="bg-ink-card border border-line rounded-2xl w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <h3 className="text-white font-semibold">Método de pago</h3>
              <button onClick={() => setModalPago(null)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-4">
                {modalPago.cliente} · {formatCOP(modalPago.precio)}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {METODOS_PAGO.map((m) => (
                  <button
                    key={m.valor}
                    onClick={() => guardarMetodoPago(m.valor)}
                    className="p-4 rounded-xl bg-ink border border-line text-gray-200 text-sm font-semibold hover:border-gold/40 hover:text-gold hover:-translate-y-0.5 transition-all"
                  >
                    {m.emoji} {m.valor}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: Cerrar caja ===== */}
      {modalCerrarAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setModalCerrarAbierto(false)}
        >
          <div
            className="bg-ink-card border border-line rounded-2xl w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <h3 className="text-white font-semibold">Cerrar caja del día</h3>
              <button onClick={() => setModalCerrarAbierto(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-4">
                Estás por cerrar la caja del{" "}
                <strong className="text-white">
                  {new Date(fecha).toLocaleDateString("es-CO", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </strong>
                . Después no podrás modificar métodos de pago ni descuentos de ese día.
              </p>

              <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Bruto</span>
                  <span className="text-white font-semibold">{formatCOP(totalBruto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Egresos</span>
                  <span className="text-red-400 font-semibold">{formatCOP(descuento)}</span>
                </div>
                {totalPropinas > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gold">Propinas</span>
                    <span className="text-gold font-bold">{formatCOP(totalPropinas)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2.5 border-t border-gold/15">
                  <span className="text-[11px] uppercase tracking-wider text-gold/90 font-semibold">
                    Neto a cerrar
                  </span>
                  <span className="text-xl font-bold bg-gradient-to-br from-yellow-200 to-gold bg-clip-text text-transparent">
                    {formatCOP(totalNeto)}
                  </span>
                </div>
                <p className="text-center text-xs text-gray-500 pt-1">
                  {resumen.total_turnos || 0} servicios
                </p>
              </div>

              <label className="text-xs font-semibold text-gray-300 mb-1.5 block">
                Observaciones (opcional)
              </label>
              <textarea
                rows={3}
                value={observacionesCierre}
                onChange={(e) => setObservacionesCierre(e.target.value)}
                placeholder="Notas del cierre..."
                className="w-full bg-ink border border-line rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold"
              />
            </div>
            <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-line">
              <button
                onClick={() => setModalCerrarAbierto(false)}
                className="px-4 py-2 rounded-full text-sm font-semibold bg-ink border border-line text-gray-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCierre}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-emerald-400 to-emerald-600 text-ink hover:brightness-110 transition-all"
              >
                <Check className="w-4 h-4" /> Confirmar cierre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: Historial ===== */}
      {modalHistorialAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setModalHistorialAbierto(false)}
        >
          <div
            className="bg-ink-card border border-line rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <h3 className="text-white font-semibold">Historial de cierres</h3>
              <button onClick={() => setModalHistorialAbierto(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pt-4 flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={histDesde}
                max={histHasta || undefined}
                onChange={(e) => {
                  setHistDesde(e.target.value);
                  cargarHistorial(e.target.value, histHasta);
                }}
                className="bg-ink border border-line text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-gold [color-scheme:dark]"
              />
              <span className="text-gray-500 text-xs">hasta</span>
              <input
                type="date"
                value={histHasta}
                min={histDesde || undefined}
                onChange={(e) => {
                  setHistHasta(e.target.value);
                  cargarHistorial(histDesde, e.target.value);
                }}
                className="bg-ink border border-line text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-gold [color-scheme:dark]"
              />
              {(histDesde || histHasta) && (
                <button
                  onClick={() => {
                    setHistDesde("");
                    setHistHasta("");
                    cargarHistorial("", "");
                  }}
                  className="text-xs text-gray-500 hover:text-white underline"
                >
                  Limpiar
                </button>
              )}
            </div>
            <div className="p-6 overflow-y-auto space-y-2">
              {historial.length === 0 ? (
                <p className="text-center text-gray-500 py-10 text-sm">Sin cierres registrados</p>
              ) : (
                historial.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      cambiarFecha(c.fecha.toString().split("T")[0]);
                      setModalHistorialAbierto(false);
                    }}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl bg-ink border border-line hover:border-gold/25 hover:translate-x-1 transition-all cursor-pointer"
                  >
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {new Date(c.fecha).toLocaleDateString("es-CO")}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.total_turnos} servicios</p>
                    </div>
                    <p className="text-xs text-gray-500">Por {c.nombre_usuario}</p>
                    <p className="text-gold font-bold text-sm">{formatCOP(c.total_ingresos)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: Nuevo gasto ===== */}
      {modalGastoAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setModalGastoAbierto(false)}
        >
          <div
            className="bg-ink-card border border-line rounded-2xl w-full max-w-md shadow-xl p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <div className="text-3xl mb-2">💸</div>
              <h3 className="text-white font-bold text-lg">Registrar gasto / egreso</h3>
              <p className="text-xs text-gray-500 mt-1.5">Se descontará del total neto del día.</p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-300 mb-1.5 block">Categoría *</label>
                <select
                  value={gastoForm.categoria}
                  onChange={(e) => setGastoForm((f) => ({ ...f, categoria: e.target.value }))}
                  className="w-full bg-ink border border-line rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gold"
                >
                  <option value="">Seleccionar...</option>
                  {CATEGORIAS_GASTO.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 mb-1.5 block">Monto (COP) *</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={gastoForm.monto}
                  onChange={(e) => setGastoForm((f) => ({ ...f, monto: e.target.value }))}
                  className="w-full bg-ink border border-line rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 mb-1.5 block">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pago de luz mes de junio"
                  value={gastoForm.descripcion}
                  onChange={(e) => setGastoForm((f) => ({ ...f, descripcion: e.target.value }))}
                  className="w-full bg-ink border border-line rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gold"
                />
              </div>

              {gastoError && (
                <div className="text-red-400 text-xs px-3 py-2 bg-red-500/10 rounded-lg">{gastoError}</div>
              )}
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => setModalGastoAbierto(false)}
                className="flex-1 py-3 rounded-xl bg-ink border border-line text-white text-sm font-semibold hover:border-gold/40 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarGasto}
                className="flex-1 py-3 rounded-xl bg-gold text-ink text-sm font-bold hover:bg-gold-soft transition-colors"
              >
                Guardar gasto
              </button>
            </div>

            {gastosDia.length > 0 && (
              <div className="mt-6 pt-5 border-t border-line space-y-2">
                <p className="text-xs text-gray-500 mb-2">
                  {gastosDia.length} gasto(s) · Total:{" "}
                  <span className="text-red-400 font-bold">{formatCOP(totalGastos)}</span>
                </p>
                {gastosDia.map((g) => (
                  <div
                    key={g.id_gasto}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/15"
                  >
                    <div>
                      <p className="text-white text-sm font-semibold">{g.categoria}</p>
                      {g.descripcion && <p className="text-xs text-gray-500 mt-0.5">{g.descripcion}</p>}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-red-400 font-bold text-sm">{formatCOP(g.monto)}</span>
                      <button
                        onClick={() => eliminarGasto(g.id_gasto)}
                        className="text-gray-500 hover:text-red-400 text-sm"
                        title="Eliminar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} />
    </div>
  );
}
