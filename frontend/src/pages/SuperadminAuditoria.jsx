import { useState, useEffect } from "react";
import { ScrollText, Search } from "lucide-react";
import api from "../api/cliente";

const COLOR_ACCION = {
  cambiar_estado_barberia: "bg-amber-500/10 text-amber-400",
  eliminar_barberia: "bg-red-500/10 text-red-400",
  eliminar_usuario: "bg-red-500/10 text-red-400",
  actualizar_plan: "bg-blue-500/10 text-blue-400"
};

function SuperadminAuditoria() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    api
      .get("/superadmin/auditoria")
      .then(r => setRegistros(r.data))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = registros.filter(
    r =>
      !busqueda ||
      r.nombre_usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.accion.toLowerCase().includes(busqueda.toLowerCase()) ||
      (r.detalle || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando)
    return <div className="text-center py-20 text-gray-500">Cargando...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          Historial de auditoría
        </h1>
        <p className="text-gray-500 text-sm">
          Últimas {registros.length} acciones sensibles registradas
        </p>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por usuario, acción o detalle..."
          className="w-full bg-ink-card border border-line rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold transition-colors"
        />
      </div>

      <div className="bg-ink-card border border-line rounded-2xl overflow-hidden">
        <div className="divide-y divide-line">
          {filtrados.length === 0
            ? <div className="text-center py-16">
                <ScrollText className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                <p className="text-gray-500 text-sm">
                  No hay registros que coincidan.
                </p>
              </div>
            : filtrados.map(r =>
                <div
                  key={r.id_registro}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ScrollText className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium text-sm">
                        {r.nombre_usuario}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${COLOR_ACCION[
                          r.accion
                        ] || "bg-white/5 text-gray-400"}`}
                      >
                        {r.accion.replace(/_/g, " ")}
                      </span>
                    </div>
                    {r.detalle &&
                      <p className="text-gray-400 text-sm mt-1">
                        {r.detalle}
                      </p>}
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                    {new Date(r.fecha).toLocaleString("es-CO", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}

export default SuperadminAuditoria;
