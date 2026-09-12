import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Building2, CreditCard, Lock, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
            <div className="w-20 h-20 rounded-2xl bg-yellow-400 flex items-center justify-center mb-8">
                <span className="text-3xl">✂️</span>
            </div>

const ITEMS = [
  { a: "/superadmin", texto: "Resumen", icono: LayoutDashboard, exacto: true },
  { a: "/superadmin/barberias", texto: "Barberías", icono: Building2 },
  { a: "/superadmin/planes", texto: "Planes", icono: CreditCard },
  { a: "/superadmin/permisos", texto: "Permisos", icono: Lock },
];

function iniciales(nombre) {
  return (nombre || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function SuperadminLayout() {
  const { usuario, logout } = useAuth();
  const [abierta, setAbierta] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink">
      {abierta && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setAbierta(false)} />}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-ink-soft border-r border-line z-40 flex flex-col transform transition-transform duration-300 md:translate-x-0 ${
          abierta ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-line shrink-0">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Barber Pro" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <span className="text-sm font-bold text-white block leading-tight">Barber Pro</span>
              <span className="text-[10px] text-gold font-mono tracking-wider uppercase leading-tight">Superadmin</span>
            </div>
          </div>
          <button onClick={() => setAbierta(false)} className="md:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {ITEMS.map(({ a, texto, icono: Icono, exacto }) => (
            <NavLink
              key={a}
              to={a}
              end={exacto}
              onClick={() => setAbierta(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-gold/10 text-gold" : "text-gray-400 hover:text-white hover:bg-ink-card"
                }`
              }
            >
              <Icono className="w-5 h-5 shrink-0" />
              {texto}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center text-ink font-bold text-xs shrink-0">
            {iniciales(usuario?.nombre_usuario)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{usuario?.nombre_usuario}</p>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-red-400 transition-colors" title="Salir">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <div className="md:ml-64 min-h-screen">
        <header className="h-16 border-b border-line bg-ink-soft/50 backdrop-blur sticky top-0 z-20 flex items-center px-4 md:hidden">
          <button onClick={() => setAbierta(true)} className="text-gray-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </header>
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default SuperadminLayout;