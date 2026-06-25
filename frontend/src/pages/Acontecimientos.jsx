import { useState, useEffect } from "react";
import { Plus, X, Save, Cake, Calendar, Gift, Tag, Star, Bell } from "lucide-react";
import api from "../api/cliente";

const TIPOS = [
    { valor: "cumpleanos", label: "Cumpleaños", icono: Cake, color: "text-pink-400 bg-pink-500/10" },
    { valor: "aniversario", label: "Aniversario", icono: Star, color: "text-purple-400 bg-purple-500/10" },
    { valor: "promocion", label: "Promoción", icono: Tag, color: "text-emerald-400 bg-emerald-500/10" },
    { valor: "otro", label: "Otro", icono: Bell, color: "text-blue-400 bg-blue-500/10" },
];

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function Acontecimientos() {
    const [eventos, setEventos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [cumpleanos, setCumpleanos] = useState([]);
    const [mesCumple, setMesCumple] = useState(new Date().getMonth() + 1);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [panelAbierto, setPanelAbierto] = useState(false);

    const hoyStr = new Date().toISOString().slice(0, 10);

    const [form, setForm] = useState({
        titulo: "",
        descripcion: "",
        tipo: "otro",
        fecha: hoyStr,
        id_cliente: "",
    });
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState("");

    const cargarDatos = async () => {
        setCargando(true);
        setError("");
        try {
            const [resE, resC] = await Promise.all([
                api.get("/acontecimientos"),
                api.get("/clientes"),
            ]);
            setEventos(resE.data);
            setClientes(resC.data);
        } catch (err) {
            setError("No se pudieron cargar los acontecimientos");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    // Cargar cumpleaños del mes elegido
    useEffect(() => {
        const cargar = async () => {
            try {
                const res = await api.get(`/acontecimientos/cumpleanos/mes/${mesCumple}`);
                setCumpleanos(res.data);
            } catch {
                setCumpleanos([]);
            }
        };
        cargar();
    }, [mesCumple]);

    const nombreCliente = (id) => {
        if (!id) return null;
        const c = clientes.find((x) => x.id_cliente === id);
        return c ? `${c.primer_nombre} ${c.apellidos}` : "Cliente";
    };

    const formatoFecha = (fecha) => {
        if (!fecha) return "—";
        return new Date(fecha + "T00:00:00").toLocaleDateString("es-CO", {
            day: "2-digit", month: "long", year: "numeric",
        });
    };

    const tipoInfo = (valor) => TIPOS.find((t) => t.valor === valor) || TIPOS[3];

    const abrirPanel = () => {
        setForm({ titulo: "", descripcion: "", tipo: "otro", fecha: hoyStr, id_cliente: "" });
        setErrorForm("");
        setPanelAbierto(true);
    };

    const registrar = async (e) => {
        e.preventDefault();
        setErrorForm("");
        if (!form.titulo.trim()) {
            setErrorForm("Poné un título");
            return;
        }
        setGuardando(true);
        try {
            await api.post("/acontecimientos", {
                titulo: form.titulo,
                descripcion: form.descripcion || null,
                tipo: form.tipo,
                fecha: form.fecha,
                id_cliente: form.id_cliente ? Number(form.id_cliente) : null,
            });
            setPanelAbierto(false);
            cargarDatos();
        } catch (err) {
            setErrorForm(
                err.response?.data?.detail && typeof err.response.data.detail === "string"
                    ? err.response.data.detail
                    : "No se pudo crear el acontecimiento"
            );
        } finally {
            setGuardando(false);
        }
    };

    const hoyDia = new Date().getDate();
    const hoyMes = new Date().getMonth() + 1;

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Acontecimientos</h1>
                    <p className="text-gray-400">Fechas especiales, cumpleaños y promociones</p>
                </div>
                <button
                    onClick={abrirPanel}
                    className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo acontecimiento
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6">{error}</div>
            )}

            {/* Cumpleaños del mes */}
            <div className="bg-ink-card border border-line rounded-2xl p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <Cake className="w-5 h-5 text-pink-400" />
                        <h2 className="text-white font-semibold">Cumpleaños de clientes</h2>
                    </div>
                    <select
                        value={mesCumple}
                        onChange={(e) => setMesCumple(Number(e.target.value))}
                        className="bg-ink border border-line rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold"
                    >
                        {MESES.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                </div>

                {cumpleanos.length === 0 ? (
                    <p className="text-gray-500 text-sm">No hay cumpleaños este mes</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {cumpleanos
                            .sort((a, b) => a.dia - b.dia)
                            .map((c) => {
                                const esHoy = c.dia === hoyDia && c.mes === hoyMes;
                                return (
                                    <div
                                        key={c.id_cliente}
                                        className={`flex items-center gap-3 rounded-xl p-3 border ${esHoy ? "bg-pink-500/10 border-pink-500/40" : "bg-ink border-line"
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${esHoy ? "bg-pink-500/20" : "bg-ink-soft"
                                            }`}>
                                            <Gift className={`w-5 h-5 ${esHoy ? "text-pink-400" : "text-gray-500"}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-white text-sm font-medium truncate">{c.nombre}</div>
                                            <div className="text-xs text-gray-500">
                                                {c.dia} de {MESES[c.mes - 1]}
                                                {esHoy && <span className="text-pink-400 font-medium"> · ¡Hoy!</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* Lista de acontecimientos */}
            <h2 className="text-white font-semibold mb-3">Eventos registrados</h2>
            {cargando ? (
                <div className="text-center py-16 text-gray-500">Cargando...</div>
            ) : eventos.length === 0 ? (
                <div className="bg-ink-card border border-line rounded-2xl p-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400">No hay acontecimientos registrados</p>
                    <p className="text-gray-600 text-sm mt-1">Creá el primero con "Nuevo acontecimiento"</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {eventos.map((ev) => {
                        const info = tipoInfo(ev.tipo);
                        const Icono = info.icono;
                        return (
                            <div key={ev.id_acontecimiento} className="bg-ink-card border border-line rounded-2xl p-5">
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${info.color}`}>
                                        <Icono className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-white font-medium">{ev.titulo}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${info.color}`}>{info.label}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {formatoFecha(ev.fecha)}
                                            {nombreCliente(ev.id_cliente) && <span> · {nombreCliente(ev.id_cliente)}</span>}
                                        </div>
                                        {ev.descripcion && <p className="text-gray-300 text-sm mt-2">{ev.descripcion}</p>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Panel lateral */}
            {panelAbierto && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setPanelAbierto(false)} />
                    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-ink-card border-l border-line z-50 overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-line">
                            <h2 className="text-xl font-bold text-white">Nuevo acontecimiento</h2>
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
                                    placeholder="Ej: Promo día del padre"
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
                                <label className="block text-sm text-gray-300 mb-1.5">Fecha *</label>
                                <input
                                    type="date"
                                    value={form.fecha}
                                    onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                                    className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-300 mb-1.5">Cliente (opcional)</label>
                                <select
                                    value={form.id_cliente}
                                    onChange={(e) => setForm((f) => ({ ...f, id_cliente: e.target.value }))}
                                    className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold"
                                >
                                    <option value="">Sin cliente asociado</option>
                                    {clientes.map((c) => (
                                        <option key={c.id_cliente} value={c.id_cliente}>
                                            {c.primer_nombre} {c.apellidos}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-300 mb-1.5">Descripción</label>
                                <textarea
                                    value={form.descripcion}
                                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                                    rows={4}
                                    placeholder="Detalles (opcional)"
                                    className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2 border-t border-line">
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-gold text-ink font-semibold rounded-lg py-3 hover:bg-gold-soft transition-colors disabled:opacity-50"
                                >
                                    <Save className="w-5 h-5" />
                                    {guardando ? "Guardando..." : "Guardar"}
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

export default Acontecimientos;