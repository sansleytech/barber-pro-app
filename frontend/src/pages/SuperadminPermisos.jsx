import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Calendar, Bell, Users, Scissors, Briefcase, Clock,
  ShieldCheck, Star, BarChart3, ImagePlus, Cake, Package, Tags, Truck,
  ShoppingBag, ShoppingCart, Wallet, Settings, QrCode, Search,
} from "lucide-react";
import api from "../api/cliente";
import { useUI } from "../context/UIContext";

const ROLES = [
  { clave: "administrador", label: "Admin" },
  { clave: "recepcionista", label: "Recepción" },
  { clave: "barbero", label: "Barbero" },
];

// Metadatos visuales: nombre legible, ícono y grupo para cada ruta.
// Si aparece una ruta nueva en la base que no está acá, se muestra igual
// con valores por defecto (grupo "Otros"), así nunca se pierde nada.
const INFO_RUTAS = {
  "/dashboard": { label: "Dashboard", icono: LayoutDashboard, grupo: "Principal" },
  "/mi-dia": { label: "Mi día", icono: LayoutDashboard, grupo: "Principal" },
  "/calendario": { label: "Calendario", icono: Calendar, grupo: "Principal" },
  "/recordatorios": { label: "Recordatorios", icono: Bell, grupo: "Principal" },
  "/turnos": { label: "Turnos", icono: Calendar, grupo: "Administración" },
  "/clientes": { label: "Clientes", icono: Users, grupo: "Administración" },
  "/barberos": { label: "Barberos", icono: Scissors, grupo: "Administración" },
  "/servicios": { label: "Servicios", icono: Briefcase, grupo: "Administración" },
  "/solicitudes": { label: "Solicitudes", icono: Calendar, grupo: "Administración" },
  "/horarios": { label: "Horarios", icono: Clock, grupo: "Administración" },
  "/usuarios": { label: "Usuarios", icono: ShieldCheck, grupo: "Administración" },
  "/valoraciones": { label: "Valoraciones", icono: Star, grupo: "Administración" },
  "/reportes": { label: "Reportes", icono: BarChart3, grupo: "Administración" },
  "/galeria": { label: "Galería", icono: ImagePlus, grupo: "Administración" },
  "/acontecimientos": { label: "Acontecimientos", icono: Cake, grupo: "Administración" },
  "/notificaciones": { label: "Notificaciones", icono: Bell, grupo: "Administración" },
  "/productos": { label: "Productos", icono: Package, grupo: "Inventario" },
  "/categorias": { label: "Categorías", icono: Tags, grupo: "Inventario" },
  "/proveedores": { label: "Proveedores", icono: Truck, grupo: "Inventario" },
  "/compras": { label: "Compras", icono: ShoppingBag, grupo: "Inventario" },
  "/ventas": { label: "Ventas", icono: ShoppingCart, grupo: "Ventas y caja" },
  "/caja": { label: "Caja", icono: Wallet, grupo: "Ventas y caja" },
  "/configuracion": { label: "Configuración", icono: Settings, grupo: "Sistema" },
  "/qr": { label: "Códigos QR", icono: QrCode, grupo: "Sistema" },
};

const ORDEN_GRUPOS = ["Principal", "Administración", "Inventario", "Ventas y caja", "Sistema", "Otros"];

function infoDe(ruta) {
  return INFO_RUTAS[ruta] || { label: ruta, icono: ShieldCheck, grupo: "Otros" };
}

// Interruptor tipo iOS, más claro visualmente que un checkbox cuadrado.
function Interruptor({ activo, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-10 h-5.5 h-[22px] rounded-full transition-colors disabled:opacity-40 ${
        activo ? "bg-gold" : "bg-white/10"
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
          activo ? "translate-x-[18px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SuperadminPermisos() {
  const { avisar } = useUI();
  const [permisos, setPermisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const cargar = () => {
    api.get("/superadmin/permisos").then((r) => setPermisos(r.data)).finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const toggle = async (permiso, rolClave) => {
    const nuevoValor = !permiso[rolClave];
    setGuardandoId(permiso.id_permiso);
    setPermisos((prev) =>
      prev.map((p) => (p.id_permiso === permiso.id_permiso ? { ...p, [rolClave]: nuevoValor } : p))
    );
    try {
      await api.patch(`/superadmin/permisos/${permiso.id_permiso}`, {
        administrador: rolClave === "administrador" ? nuevoValor : permiso.administrador,
        recepcionista: rolClave === "recepcionista" ? nuevoValor : permiso.recepcionista,
        barbero: rolClave === "barbero" ? nuevoValor : permiso.barbero,
      });
    } catch (err) {
      setPermisos((prev) =>
        prev.map((p) => (p.id_permiso === permiso.id_permiso ? { ...p, [rolClave]: !nuevoValor } : p))
      );
      avisar(err.response?.data?.detail || "No se pudo guardar el cambio", "error");
    } finally {
      setGuardandoId(null);
    }
  };

  const grupos = useMemo(() => {
    const filtrados = permisos.filter((p) => {
      const info = infoDe(p.ruta);
      return !busqueda || info.label.toLowerCase().includes(busqueda.toLowerCase());
    });

    const mapa = {};
    for (const p of filtrados) {
      const info = infoDe(p.ruta);
      if (!mapa[info.grupo]) mapa[info.grupo] = [];
      mapa[info.grupo].push({ ...p, ...info });
    }
    return ORDEN_GRUPOS.filter((g) => mapa[g]?.length).map((g) => ({ nombre: g, items: mapa[g] }));
  }, [permisos, busqueda]);

  if (cargando) return <div className="text-center py-20 text-gray-500">Cargando...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Permisos por rol</h1>
          <p className="text-gray-500 text-sm">
            Definí qué secciones puede ver cada rol. Los cambios se aplican de inmediato en toda la plataforma.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar sección..."
            className="bg-ink-card border border-line rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-gold transition-colors w-full sm:w-64"
          />
        </div>
      </div>

      <div className="space-y-6">
        {grupos.map((grupo) => (
          <div key={grupo.nombre} className="bg-ink-card border border-line rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-line bg-ink/30">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{grupo.nombre}</h3>
              <div className="hidden sm:flex gap-6">
                {ROLES.map((r) => (
                  <span key={r.clave} className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 text-center">
                    {r.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="divide-y divide-line">
              {grupo.items.map((p) => {
                const Icono = p.icono;
                return (
                  <div key={p.id_permiso} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-ink/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Icono className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-200 font-medium truncate">{p.label}</span>
                    </div>

                    <div className="flex gap-6 sm:gap-6 flex-wrap justify-end">
                      {ROLES.map((r) => (
                        <div key={r.clave} className="flex flex-col items-center gap-1 w-16">
                          <span className="text-[10px] text-gray-600 uppercase tracking-wide sm:hidden">{r.label}</span>
                          <Interruptor
                            activo={p[r.clave]}
                            disabled={guardandoId === p.id_permiso}
                            onClick={() => toggle(p, r.clave)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {grupos.length === 0 && (
          <div className="text-center py-16 bg-ink-card border border-line rounded-2xl">
            <p className="text-gray-500 text-sm">No hay secciones que coincidan con la búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SuperadminPermisos;