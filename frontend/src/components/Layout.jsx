import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Search, Bell, LogOut, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

function Layout() {
    const [barraAbierta, setBarraAbierta] = useState(false);
    const [confirmarSalida, setConfirmarSalida] = useState(false);
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

            <div className="md:ml-64 flex flex-col min-h-screen">
                <header className="h-16 border-b border-line bg-ink-soft/50 backdrop-blur sticky top-0 z-20 flex items-center gap-4 px-4 md:px-6">
                    <button
                        onClick={() => setBarraAbierta(true)}
                        className="md:hidden text-gray-400 hover:text-white"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

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

                    <div className="hidden lg:block text-sm text-gray-400 capitalize ml-auto">
                        {fecha}
                    </div>

                    <button className="text-gray-400 hover:text-white relative ml-auto lg:ml-4">
                        <Bell className="w-5 h-5" />
                    </button>

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
                            onClick={() => setConfirmarSalida(true)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                            title="Salir"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6">
                    <Outlet />
                </main>
            </div>

            {/* Modal de confirmación de cierre de sesión */}
            {confirmarSalida && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                    onClick={() => setConfirmarSalida(false)}
                >
                    <div
                        className="bg-ink-card border border-line rounded-xl shadow-xl w-full max-w-sm p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setConfirmarSalida(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                            <LogOut className="w-6 h-6 text-red-400" />
                        </div>

                        <h3 className="text-white font-semibold text-lg mb-1">
                            ¿Cerrar sesión?
                        </h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Tendrás que iniciar sesión de nuevo para volver a acceder.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmarSalida(false)}
                                className="flex-1 py-2 rounded-lg border border-line text-gray-300 hover:bg-ink-soft transition-colors text-sm font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={logout}
                                className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium"
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Layout;