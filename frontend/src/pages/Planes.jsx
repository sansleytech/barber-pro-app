import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000" });

const IconCheck = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}>
    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconX = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}>
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function formatoPrecio(valor) {
  const n = Number(valor);
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function Planes() {
  const navigate = useNavigate();
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/planes")
      .then((res) => {
        // El Trial no se "elige" acá, se asigna solo al registrarse.
        setPlanes(res.data.filter((p) => p.nombre !== "Trial"));
      })
      .catch(() => setError("No se pudieron cargar los planes."))
      .finally(() => setCargando(false));
  }, []);

  const elegirPlan = (idPlan) => {
    // Elegir un plan lleva a registrarse, con el plan como referencia.
    // Cuando conectemos la pasarela real, ese id_plan se usa para iniciar el cobro.
    navigate(`/registro?plan=${idPlan}`);
  };

  const caracteristicas = (plan) => [
    { label: plan.max_barberos ? `Hasta ${plan.max_barberos} barbero${plan.max_barberos > 1 ? "s" : ""}` : "Barberos ilimitados", ok: true },
    { label: "Turnos y clientes", ok: true },
    { label: "Caja", ok: true },
    { label: "Inventario y ventas", ok: plan.permite_inventario },
    { label: "Notificaciones automáticas", ok: plan.permite_whatsapp },
    { label: "Reportes", ok: plan.permite_reportes },
    { label: "Códigos QR", ok: plan.permite_qr },
  ];

  if (cargando) {
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-gray-400">Cargando planes…</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Elegí tu plan</h1>
          <p className="text-gray-400">Cambiá de plan cuando quieras, sin contratos forzosos.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-8 max-w-md mx-auto text-center">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {planes.map((plan) => {
            const destacado = plan.nombre === "Pro";
            return (
              <div
                key={plan.id_plan}
                className={`relative flex flex-col rounded-2xl p-6 border ${
                  destacado ? "border-yellow-400 bg-neutral-900" : "border-white/10 bg-neutral-900/50"
                }`}
              >
                {destacado && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-neutral-950 text-xs font-bold px-3 py-1 rounded-full">
                    Recomendado
                  </span>
                )}

                <h3 className="text-lg font-bold text-white mb-1">{plan.nombre}</h3>
                {plan.descripcion && <p className="text-gray-500 text-xs mb-4">{plan.descripcion}</p>}

                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">{formatoPrecio(plan.precio_mensual)}</span>
                  <span className="text-gray-500 text-sm"> /mes</span>
                </div>

                <ul className="flex-1 space-y-2.5 mb-6">
                  {caracteristicas(plan).map((c) => (
                    <li key={c.label} className="flex items-center gap-2 text-sm">
                      {c.ok ? (
                        <IconCheck className="w-4 h-4 text-yellow-400 shrink-0" />
                      ) : (
                        <IconX className="w-4 h-4 text-gray-600 shrink-0" />
                      )}
                      <span className={c.ok ? "text-gray-300" : "text-gray-600"}>{c.label}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => elegirPlan(plan.id_plan)}
                  className={`w-full font-semibold rounded-lg py-3 transition-colors ${
                    destacado
                      ? "bg-yellow-400 text-neutral-950 hover:bg-yellow-300"
                      : "border border-white/15 text-white hover:border-white/30"
                  }`}
                >
                  Elegir este plan
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Planes;