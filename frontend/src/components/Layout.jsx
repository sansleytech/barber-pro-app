import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Search, Bell, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

function Layout() {
    const [barraAbierta, setBarraAbierta] = useState(false);
    const { usuario, logout } = useAuth();

    const ahora = new Date();
    const fecha = ahora.toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    const inicial = (usuario?.nombre_usuario || "?").charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-ink">
            <Sidebar
                abierta={barraAbierta}
                cerrar={() => setBarraAbierta(false)}
                rol={usuario?.rol}
            />

            {/* Contenido: corrido a la derecha en desktop para dejar lugar a la barra */}
            <div className="md:ml-64 flex flex-col min-h-screen">
                {/* Encabezado */}
                <header className="h-16 border-b border-line bg-ink-soft/50 backdrop-blur sticky top-0 z-20 flex items-center gap-4 px-4 md:px-6">
                    {/* Botón menú (solo móvil) */}
                    <button
                        onClick={() => setBarraAbierta(true)}
                        className="md:hidden text-gray-400 hover:text-white"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Buscador */}
                    <div className="flex-1 max-w-md hidden sm:block">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="w-full bg-ink-card border border-line rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
                            />
                        </div>
                    </div>

                    {/* Fecha */}
                    <div className="hidden lg:block text-sm text-gray-400 capitalize ml-auto">
                        {fecha}
                    </div>

                    {/* Notificaciones */}
                    <button className="text-gray-400 hover:text-white relative ml-auto lg:ml-4">
                        <Bell className="w-5 h-5" />
                    </button>

                    {/* Avatar + salir */}

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm text-white font-medium leading-tight">
                                {usuario?.nombre_usuario}
                            </span>
                            <span className="text-xs text-gray-500 capitalize leading-tight">
                                {usuario?.rol}
                            </span>
                        </div>

                        <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center text-ink font-bold">
                            {inicial}
                        </div>

                        <button
                            onClick={logout}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                            title="Salir"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Área de contenido: acá router inserta cada vista */}
                <main className="flex-1 p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default Layout;
