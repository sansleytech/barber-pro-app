import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Search, Bell, LogOut, X, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/cliente";
import Sidebar from "./Sidebar";

function iconoTipo(tipo) {
    if (tipo === "alerta") return "🔴";
    if (tipo === "recordatorio") return "⏰";
    return "🔵";
}

function tiempoRelativo(fechaISO) {
    if (!fechaISO) return "";
    const ahora = new Date();
    const fecha = new Date(fechaISO);
    const minutos = Math.floor((ahora - fecha) / 60000);
    if (minutos < 1) return "ahora";
    if (minutos < 60) return `hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    return `hace ${dias} día${dias !== 1 ? "s" : ""}`;
}

function Layout() {
    const [barraAbierta, setBarraAbierta] = useState(false);
    const [confirmarSalida, setConfirmarSalida] = useState(false);
    const [panelNotifAbierto, setPanelNotifAbierto] = useState(false);
    const [notificaciones, setNotificaciones] = useState([]);
    const [contadorNoLeidas, setContadorNoLeidas] = useState(0);
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();

    const ahora = new Date();
    const fecha = ahora.toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    const inicial = (usuario?.nombre_usuario || "?").charAt(0).toUpperCase();

    const cargarContador = useCallback(async () => {
        try {
            const res = await api.get("/notificaciones/contador");
            setContadorNoLeidas(res.data.cantidad);
        } catch {
            // silencioso: si falla, simplemente no mostramos el número
        }
    }, []);

    useEffect(() => {
        cargarContador();
        const intervalo = setInterval(cargarContador, 60000); // se actualiza solo cada minuto
        return () => clearInterval(intervalo);
    }, [cargarContador]);

    const abrirPanelNotif = async () => {
        setPanelNotifAbierto((v) => !v);
        if (!panelNotifAbierto) {
            try {
                const res = await api.get("/notificaciones/mias");
                setNotificaciones(res.data);
            } catch {
                setNotificaciones([]);
            }
        }
    };

    const marcarTodasLeidas = async () => {
        try {
            await api.patch("/notificaciones/marcar-todas-leidas");
            setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
            cargarContador();
        } catch {
            // silencioso
        }
    };

    const clickNotificacion = async (n) => {
        // Las "virtuales" (cumpleaños, plan por vencer) tienen id de texto, no numérico —
        // no se marcan como leídas en la base, solo navegamos.
        if (typeof n.id_notificacion === "number" && !n.leida) {
            try {
                await api.patch(`/notificaciones/${n.id_notificacion}/leida`);
                cargarContador();
            } catch {
                // silencioso
            }
        }
        setPanelNotifAbierto(false);
        if (n.enlace) navigate(n.enlace);
    };

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

                    <div className="relative ml-auto lg:ml-4">
                        <button
                            onClick={abrirPanelNotif}
                            className="text-gray-400 hover:text-white relative"
                        >
                            <Bell className="w-5 h-5" />
                            {contadorNoLeidas > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                    {contadorNoLeidas > 9 ? "9+" : contadorNoLeidas}
                                </span>
                            )}
                        </button>

                        {panelNotifAbierto && (
                            <>
                                <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setPanelNotifAbierto(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-ink-card border border-line rounded-2xl shadow-xl z-40 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                                        <h3 className="text-white font-semibold text-sm">Notificaciones</h3>
                                        {notificaciones.some((n) => !n.leida) && (
                                            <button
                                                onClick={marcarTodasLeidas}
                                                className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-soft transition-colors"
                                            >
                                                <Check className="w-3.5 h-3.5" /> Marcar todas
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notificaciones.length === 0 ? (
                                            <p className="text-center text-gray-500 text-sm py-10">
                                                No tenés notificaciones
                                            </p>
                                        ) : (
                                            notificaciones.map((n) => (
                                                <button
                                                    key={n.id_notificacion}
                                                    onClick={() => clickNotificacion(n)}
                                                    className={`w-full text-left flex gap-3 px-4 py-3 border-b border-line last:border-0 hover:bg-ink transition-colors ${
                                                        !n.leida ? "bg-gold/[0.03]" : ""
                                                    }`}
                                                >
                                                    <span className="text-base flex-shrink-0">{iconoTipo(n.tipo)}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium ${!n.leida ? "text-white" : "text-gray-300"}`}>
                                                            {n.titulo}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.mensaje}</p>
                                                        {n.fecha_creacion && (
                                                            <p className="text-[11px] text-gray-600 mt-1">{tiempoRelativo(n.fecha_creacion)}</p>
                                                        )}
                                                    </div>
                                                    {!n.leida && (
                                                        <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0 mt-1.5" />
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

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