import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000" });

const IconCheck = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}>
    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function formatoPrecio(valor) {
  const n = Number(valor);
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

// Descripción breve y puntos a destacar por plan. Si en algún momento se crea
// un plan con otro nombre, cae al armado genérico basado en los flags del backend.
const INFO_PLANES = {
  Básico: {
    descripcion: "Para empezar a organizar tu barbería, vos solo.",
    puntos: ["1 barbero", "Turnos y clientes", "Caja", "Reportes básicos", "Configuración de tu barbería"],
  },
  Estándar: {
    descripcion: "Ideal cuando ya sos un equipo chico.",
    puntos: ["Hasta 3 barberos", "Turnos, clientes y caja", "Reportes", "Código QR para tu barbería", "Configuración de tu barbería"],
  },
  Pro: {
    descripcion: "Todo lo que necesitás para crecer en serio.",
    puntos: [
      "Hasta 6 barberos",
      "Turnos, clientes y caja",
      "Reportes avanzados",
      "Código QR",
      "Notificaciones automáticas",
      "Inventario y ventas",
      "Acontecimientos y recordatorios",
    ],
  },
  Premium: {
    descripcion: "Para cadenas de barberías con varias sedes.",
    puntos: [
      "Barberos ilimitados",
      "Sedes ilimitadas",
      "Cada sede con su propio subdominio",
      "Panel comparativo entre sedes",
      "Todo lo del Pro, sin límites",
      "Descuento por permanencia",
    ],
  },
};

function Planes() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/planes")
      .then((res) => {
        setPlanes(res.data.filter((p) => p.nombre !== "Trial"));
      })
      .catch(() => setError("No se pudieron cargar los planes."))
      .finally(() => setCargando(false));
  }, []);

  const elegirPlan = (idPlan) => {
    if (usuario) {
      navigate(`/pagar?plan=${idPlan}`);
    } else {
      navigate(`/registro?plan=${idPlan}`);
    }
  };

  // Fallback genérico por si aparece un plan con un nombre que no está en INFO_PLANES.
  const puntosGenericos = (plan) => [
    plan.max_barberos ? `Hasta ${plan.max_barberos} barbero${plan.max_barberos > 1 ? "s" : ""}` : "Barberos ilimitados",
    "Turnos y clientes",
    "Caja",
    ...(plan.permite_inventario ? ["Inventario y ventas"] : []),
    ...(plan.permite_whatsapp ? ["Notificaciones automáticas"] : []),
    ...(plan.permite_reportes ? ["Reportes"] : []),
    ...(plan.permite_qr ? ["Códigos QR"] : []),
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
            const info = INFO_PLANES[plan.nombre];
            const descripcion = info?.descripcion || plan.descripcion;
            const puntos = info?.puntos || puntosGenericos(plan);

            return (
              <div
                key={plan.id_plan}
                className={`relative flex flex-col rounded-2xl p-6 border ${destacado ? "border-yellow-400 bg-neutral-900" : "border-white/10 bg-neutral-900/50"
                  }`}
              >
                {destacado && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-neutral-950 text-xs font-bold px-3 py-1 rounded-full">
                    Recomendado
                  </span>
                )}

                <h3 className="text-lg font-bold text-white mb-1">{plan.nombre}</h3>
                {descripcion && <p className="text-gray-500 text-xs mb-4">{descripcion}</p>}

                <div className="mb-6">
                  {plan.precio_anterior && Number(plan.precio_anterior) > Number(plan.precio_mensual) && (
                    <div className="text-gray-500 text-sm line-through mb-0.5">{formatoPrecio(plan.precio_anterior)}</div>
                  )}
                  <span className="text-3xl font-bold text-white">{formatoPrecio(plan.precio_mensual)}</span>
                  <span className="text-gray-500 text-sm"> /mes</span>
                </div>

                <ul className="flex-1 space-y-2.5 mb-6">
                  {puntos.map((label) => (
                    <li key={label} className="flex items-center gap-2 text-sm">
                      <IconCheck className="w-4 h-4 text-yellow-400 shrink-0" />
                      <span className="text-gray-300">{label}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => elegirPlan(plan.id_plan)}
                  className={`w-full font-semibold rounded-lg py-3 transition-colors ${destacado
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