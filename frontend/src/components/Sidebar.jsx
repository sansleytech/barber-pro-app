import { NavLink } from "react-router-dom";
import logoSidebar from "../assets/img/logo1.png";
import {
  ImagePlus,
  BarChart3,
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Briefcase,
  Clock,
  ShieldCheck,
  Star,
  Cake,
  Bell,
  Package,
  Tags,
  Truck,
  ShoppingBag,
  ShoppingCart,
  Wallet,
  Settings,
  QrCode,
  X,
} from "lucide-react";

// Cada módulo indica qué roles lo pueden ver.
// "todos" = admin, recepcionista y barbero. Si no, se listan los roles.
const secciones = [
  {
    titulo: "PRINCIPAL",
    items: [
      {
        a: "/dashboard",
        texto: "Dashboard",
        icono: LayoutDashboard,
        roles: "todos",
      },
    ],
  },
  {
    titulo: "ADMINISTRACIÓN",
    items: [
      { a: "/turnos", texto: "Turnos", icono: Calendar, roles: "todos" },
      {
        a: "/clientes",
        texto: "Clientes",
        icono: Users,
        roles: ["administrador", "recepcionista"],
      },
      {
        a: "/barberos",
        texto: "Barberos",
        icono: Scissors,
        roles: ["administrador"],
      },
      {
        a: "/servicios",
        texto: "Servicios",
        icono: Briefcase,
        roles: ["administrador", "recepcionista"],
      },
      {
        a: "/solicitudes",
        texto: "Solicitudes",
        icono: Calendar,
        roles: ["administrador", "recepcionista"],
      },
      {
        a: "/horarios",
        texto: "Horarios",
        icono: Clock,
        roles: ["administrador"],
      },
      {
        a: "/usuarios",
        texto: "Usuarios",
        icono: ShieldCheck,
        roles: ["administrador"],
      },
      {
        a: "/valoraciones",
        texto: "Valoraciones",
        icono: Star,
        roles: "todos",
      },

      {
        a: "/reportes",
        texto: "Reportes",
        icono: BarChart3,
        roles: ["administrador"],
      },
      {
        a: "/galeria",
        texto: "Galería",
        icono: ImagePlus,
        roles: ["administrador"],
      },

      {
        a: "/acontecimientos",
        texto: "Acontecimientos",
        icono: Cake,
        roles: ["administrador", "recepcionista"],
      },
      {
        a: "/notificaciones",
        texto: "Notificaciones",
        icono: Bell,
        roles: "todos",
      },
    ],
  },
  {
    titulo: "INVENTARIO",
    items: [
      {
        a: "/productos",
        texto: "Productos",
        icono: Package,
        roles: ["administrador"],
      },
      {
        a: "/categorias",
        texto: "Categorías",
        icono: Tags,
        roles: ["administrador"],
      },
      {
        a: "/proveedores",
        texto: "Proveedores",
        icono: Truck,
        roles: ["administrador"],
      },
      {
        a: "/compras",
        texto: "Compras",
        icono: ShoppingBag,
        roles: ["administrador"],
      },
    ],
  },
  {
    titulo: "VENTAS Y CAJA",
    items: [
      {
        a: "/ventas",
        texto: "Ventas",
        icono: ShoppingCart,
        roles: ["administrador", "recepcionista"],
      },
      { a: "/caja", texto: "Caja", icono: Wallet, roles: ["administrador"] },
    ],
  },
  {
    titulo: "SISTEMA",
    items: [
      {
        a: "/configuracion",
        texto: "Configuración",
        icono: Settings,
        roles: ["administrador"],
      },
      {
        a: "/qr",
        texto: "Códigos QR",
        icono: QrCode,
        roles: ["administrador"],
      },
    ],
  },
];

function puedeVer(item, rol) {
  if (item.roles === "todos") return true;
  return item.roles.includes(rol);
}

function Sidebar({ abierta, cerrar, rol }) {
  return (
    <>
      {abierta && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={cerrar}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-ink-soft border-r border-line z-40 flex flex-col transform transition-transform duration-300 md:translate-x-0 ${
          abierta ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-line shrink-0">
          <div className="flex items-center gap-2">
            <img
              src={logoSidebar}
              alt="Logo"
              className="w-9 h-9 rounded-full object-cover"
            />
            <span className="text-lg font-bold text-white">
              Barber <span className="text-gold">Pro</span>
            </span>
          </div>
          <button
            onClick={cerrar}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegación con scroll */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {secciones.map((seccion) => {
            const visibles = seccion.items.filter((it) => puedeVer(it, rol));
            if (visibles.length === 0) return null;
            return (
              <div key={seccion.titulo}>
                <p className="px-3 mb-2 text-xs font-semibold text-gray-600 tracking-wider">
                  {seccion.titulo}
                </p>
                <div className="space-y-1">
                  {visibles.map(({ a, texto, icono: Icono }) => (
                    <NavLink
                      key={a}
                      to={a}
                      onClick={cerrar}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-gold/10 text-gold"
                            : "text-gray-400 hover:text-white hover:bg-ink-card"
                        }`
                      }
                    >
                      <Icono className="w-5 h-5 shrink-0" />
                      {texto}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
