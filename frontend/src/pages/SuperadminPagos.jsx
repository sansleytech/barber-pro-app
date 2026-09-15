import { useState, useEffect } from "react";
import { Receipt, Search, TrendingUp, XCircle } from "lucide-react";
import api from "../api/cliente";

function formatoPrecio(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(valor || 0);
}

const ESTADO_COLOR = {
  aprobado: "bg-emerald-500/10 text-emerald-400",
  rechazado: "bg-red-500/10 text-red-400",
  pendiente: "bg-amber-500/10 text-amber-400",
  error: "bg-red-500/10 text-red-400"
};

function SuperadminPagos() {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    api
      .get("/superadmin/pagos")
      .then(r => setPagos(r.data))
      .finally(() => setCargando(false));
  }, []);

  const pagosFiltrados = pagos.filter(
    p =>
      !busqueda ||
      p.nombre_barberia.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.referencia.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalAprobado = pagos
    .filter(p => p.estado === "aprobado")
    .reduce((acc, p) => acc + p.monto, 0);
  const cantidadRechazados = pagos.filter(
    p => p.estado === "rechazado" || p.estado === "error"
  ).length;

  if (cargando)
    return <div className="text-center py-20 text-gray-500">Cargando...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          Pagos de la plataforma
        </h1>
        <p className="text-gray-500 text-sm">
          Últimos {pagos.length} pagos de todas las barberías
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-ink-card border border-line rounded-2xl p-5">
          <TrendingUp className="w-5 h-5 text-emerald-400 mb-2" />
          <div className="text-2xl font-bold text-white">
            {formatoPrecio(totalAprobado)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Total aprobado (visible)
          </div>
        </div>
        <div className="bg-ink-card border border-line rounded-2xl p-5">
          <Receipt className="w-5 h-5 text-gold mb-2" />
          <div className="text-2xl font-bold text-white">
            {pagos.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Pagos totales</div>
        </div>
        <div className="bg-ink-card border border-line rounded-2xl p-5">
          <XCircle className="w-5 h-5 text-red-400 mb-2" />
          <div className="text-2xl font-bold text-white">
            {cantidadRechazados}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Rechazados / con error
          </div>
        </div>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por barbería o referencia..."
          className="w-full bg-ink-card border border-line rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold transition-colors"
        />
      </div>

      <div className="bg-ink-card border border-line rounded-2xl overflow-hidden">
        <div className="divide-y divide-line">
          {pagosFiltrados.length === 0
            ? <div className="text-center py-16 text-gray-500 text-sm">
                No hay pagos que coincidan.
              </div>
            : pagosFiltrados.map(p =>
                <div
                  key={p.id_pago}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                      {p.nombre_barberia}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {p.referencia} · {p.metodo_pago || "sin método"} ·{" "}
                      {new Date(p.fecha_creacion).toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ESTADO_COLOR[
                      p.estado
                    ] || "bg-white/5 text-gray-400"}`}
                  >
                    {p.estado}
                  </span>
                  <span className="text-white font-semibold w-28 text-right flex-shrink-0">
                    {formatoPrecio(p.monto)}
                  </span>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}

export default SuperadminPagos;
