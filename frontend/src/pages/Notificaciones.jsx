import { useState, useEffect } from "react";
import { Plus, X, Save, Bell, Info, AlertTriangle, Clock, Check, CheckCheck } from "lucide-react";
import api from "../api/cliente";
import { useAuth } from "../context/AuthContext";

const TIPOS = [
    { valor: "info", label: "Información", icono: Info, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
    { valor: "alerta", label: "Alerta", icono: AlertTriangle, color: "text-red-400 bg-red-500/10 border-red-500/30" },
    { valor: "recordatorio", label: "Recordatorio", icono: Clock, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
];

function Notificaciones() {
    const { usuario } = useAuth();
    const esAdmin = usuario?.rol === "administrador" || usuario?.rol === "super_admin";

    const [notificaciones, setNotificaciones] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [panelAbierto, setPanelAbierto] = useState(false);

    const [form, setForm] = useState({ titulo: "", mensaje: "", tipo: "info", id_usuario: "" });
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState("");

    const cargarDatos = async () => {
        setCargando(true);
        setError("");
        try {
            const res = await api.get("/notificaciones/mias");
            setNotificaciones(res.data);
            if (esAdmin) {
                try {
                    const resU = await api.get("/usuarios");
                    setUsuarios(resU.data);
                } catch {
                    setUsuarios([]);
                }
            }
        } catch (err) {
            setError("No se pudieron cargar las notificaciones");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const tipoInfo = (valor) => TIPOS.find((t) => t.valor === valor) || TIPOS[0];

    const formatoFecha = (fecha) => {
        if (!fecha) return "—";
        return new Date(fecha).toLocaleString("es-CO", {
            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
        });
    };

    const marcarLeida = async (id) => {
        try {
            await api.patch(`/notificaciones/${id}/leida`);
            setNotificaciones((prev) =>
                prev.map((n) => (n.id_notificacion === id ? { ...n, leida: true } : n))
            );
        } catch {
            setError("No se pudo marcar como leída");
        }
    };

    const marcarTodasLeidas = async () => {
        const noLeidas = notificaciones.filter((n) => !n.leida);
        for (const n of noLeidas) {
            try {
                await api.patch(`/notificaciones/${n.id_notificacion}/leida`);
            } catch {
                // seguimos con las demás
            }
        }
        cargarDatos();
    };

    const abrirPanel = () => {
        setForm({ titulo: "", mensaje: "", tipo: "info", id_usuario: "" });
        setErrorForm("");
        setPanelAbierto(true);
    };

    const registrar = async (e) => {
        e.preventDefault();
        setErrorForm("");
        if (!form.titulo.trim() || !form.mensaje.trim()) {
            setErrorForm("Completá título y mensaje");
            return;
        }
        setGuardando(true);
        try {
            await api.post("/notificaciones", {
                titulo: form.titulo,
                mensaje: form.mensaje,
                tipo: form.tipo,
                id_usuario: form.id_usuario ? Number(form.id_usuario) : null,
            });
            setPanelAbierto(false);
            cargarDatos();
        } catch (err) {
            setErrorForm(
                err.response?.data?.detail && typeof err.response.data.detail === "string"
                    ? err.response.data.detail
                    : "No se pudo crear la notificación"
            );
        } finally {
            setGuardando(false);
        }
    };

    const noLeidas = notificaciones.filter((n) => !n.leida).length;

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Notificaciones</h1>
                    <p className="text-gray-400">
                        {noLeidas > 0 ? `Tenés ${noLeidas} sin leer` : "Estás al día"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {noLeidas > 0 && (
                        <button
                            onClick={marcarTodasLeidas}
                            className="inline-flex items-center gap-2 bg-ink-card border border-line text-gray-300 hover:text-white rounded-lg px-4 py-2.5 transition-colors"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Marcar todas
                        </button>
                    )}
                    {esAdmin && (
                        <button
                            onClick={abrirPanel}
                            className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Nueva
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6">{error}</div>
            )}

            {cargando ? (
                <div className="text-center py-16 text-gray-500">Cargando notificaciones...</div>
            ) : notificaciones.length === 0 ? (
                <div className="bg-ink-card border border-line rounded-2xl p-12 text-center">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400">No tenés notificaciones</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notificaciones.map((n) => {
                        const info = tipoInfo(n.tipo);
                        const Icono = info.icono;
                        return (
                            <div
                                key={n.id_notificacion}
                                className={`rounded-2xl border p-5 transition-colors ${n.leida ? "bg-ink-card/50 border-line" : "bg-ink-card border-gold/30"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${info.color}`}>
                                        <Icono className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`font-medium ${n.leida ? "text-gray-300" : "text-white"}`}>{n.titulo}</span>
                                            {!n.leida && <span className="w-2 h-2 rounded-full bg-gold" />}
                                        </div>
                                        <p className="text-gray-400 text-sm mt-1">{n.mensaje}</p>
                                        <div className="text-xs text-gray-600 mt-2">{formatoFecha(n.fecha_creacion)}</div>
                                    </div>
                                    {!n.leida && (
                                        <button
                                            onClick={() => marcarLeida(n.id_notificacion)}
                                            className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                            title="Marcar como leída"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Panel lateral (solo admin) */}
            {panelAbierto && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setPanelAbierto(false)} />
                    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-ink-card border-l border-line z-50 overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-line">
                            <h2 className="text-xl font-bold text-white">Nueva notificación</h2>
                            <button onClick={() => setPanelAbierto(false)} className="p-2 text-gray-400 hover:text-white hover:bg-ink rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={registrar} className="p-5 space-y-4">
                            {errorForm && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{errorForm}</div>
                            )}

                            <div>
                                <label className="block text-sm text-gray-300 mb-1.5">Título *</label>
                                <input
                                    type="text"
                                    value={form.titulo}
                                    onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                                    placeholder="Ej: Reunión de equipo"
                                    className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-300 mb-1.5">Mensaje *</label>
                                <textarea
                                    value={form.mensaje}
                                    onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
                                    rows={4}
                                    placeholder="Escribí el mensaje..."
                                    className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-300 mb-1.5">Tipo</label>
                                <select
                                    value={form.tipo}
                                    onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                                    className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold"
                                >
                                    {TIPOS.map((t) => (
                                        <option key={t.valor} value={t.valor}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-300 mb-1.5">Destinatario</label>
                                <select
                                    value={form.id_usuario}
                                    onChange={(e) => setForm((f) => ({ ...f, id_usuario: e.target.value }))}
                                    className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold"
                                >
                                    <option value="">Todos los usuarios</option>
                                    {usuarios.map((u) => (
                                        <option key={u.id_usuario} value={u.id_usuario}>
                                            {u.nombre_usuario} ({u.rol})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-600 mt-1">Si no elegís a nadie, la ven todos.</p>
                            </div>

                            <div className="flex items-center gap-3 pt-2 border-t border-line">
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-gold text-ink font-semibold rounded-lg py-3 hover:bg-gold-soft transition-colors disabled:opacity-50"
                                >
                                    <Save className="w-5 h-5" />
                                    {guardando ? "Enviando..." : "Enviar notificación"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPanelAbierto(false)}
                                    className="px-5 border border-line text-gray-300 hover:text-white hover:bg-ink rounded-lg py-3 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}

export default Notificaciones;