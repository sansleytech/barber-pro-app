import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Calendar, Clock, User, Pencil, Trash2 } from "lucide-react";
import api from "../api/cliente";
import Tabla from "../components/Tabla";

function Turnos() {
    const [turnos, setTurnos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [barberos, setBarberos] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("todos");
    const navigate = useNavigate();

    const cargarDatos = async () => {
        setCargando(true);
        setError("");
        try {
            const [resT, resC, resB, resS] = await Promise.all([
                api.get("/turnos"),
                api.get("/clientes"),
                api.get("/barberos"),
                api.get("/servicios"),
            ]);
            setTurnos(resT.data);
            setClientes(resC.data);
            setBarberos(resB.data);
            setServicios(resS.data);
        } catch (err) {
            setError("No se pudieron cargar los turnos");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const nombreCliente = (id) => {
        const c = clientes.find((x) => x.id_cliente === id);
        return c ? `${c.primer_nombre} ${c.apellidos}` : "Cliente";
    };
    const nombreBarbero = (id) => {
        const b = barberos.find((x) => x.id_barbero === id);
        return b ? `${b.nombre} ${b.apellido}` : "Barbero";
    };
    const nombresServicios = (lista) => {
        if (!lista || lista.length === 0) return "—";
        return lista
            .map((item) => {
                const s = servicios.find((x) => x.id_servicio === item.id_servicio);
                return s ? s.nombre : "Servicio";
            })
            .join(", ");
    };

    const cambiarEstado = async (idTurno, nuevoEstado) => {
        try {
            await api.patch(`/turnos/${idTurno}/estado`, { estado: nuevoEstado });
            cargarDatos();
        } catch (err) {
            alert(err.response?.data?.detail || "No se pudo cambiar el estado");
        }
    };

    const eliminarTurno = async (idTurno) => {
        if (!confirm("¿Seguro que querés cancelar este turno?")) return;
        try {
            await api.delete(`/turnos/${idTurno}`);
            cargarDatos();
        } catch (err) {
            alert(err.response?.data?.detail || "No se pudo cancelar el turno");
        }
    };

    const estiloEstado = (estado) => {
        const estilos = {
            pendiente: "border-amber-500/40 text-amber-400",
            confirmado: "border-blue-500/40 text-blue-400",
            en_proceso: "border-purple-500/40 text-purple-400",
            completado: "border-emerald-500/40 text-emerald-400",
            cancelado: "border-red-500/40 text-red-400",
            no_asistio: "border-gray-500/40 text-gray-400",
        };
        return estilos[estado] || "border-gray-500/40 text-gray-400";
    };

    const textoEstado = (estado) => {
        const textos = {
            pendiente: "Pendiente",
            confirmado: "Confirmado",
            en_proceso: "En proceso",
            completado: "Completado",
            cancelado: "Cancelado",
            no_asistio: "No asistió",
        };
        return textos[estado] || estado;
    };

    const formatoPrecio = (valor) =>
        new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(valor || 0);

    // "14:30:00" -> "2:30 p.m."
    const formatoHora = (hora) => {
        if (!hora) return "—";
        const [h, m] = hora.split(":").map(Number);
        const sufijo = h >= 12 ? "p.m." : "a.m.";
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
    };

    const filtrados = turnos.filter((t) => {
        const texto = `${nombreCliente(t.id_cliente)} ${nombreBarbero(t.id_barbero)}`.toLowerCase();
        const coincideBusqueda = texto.includes(busqueda.toLowerCase());
        const coincideEstado = estadoFiltro === "todos" || t.estado === estadoFiltro;
        return coincideBusqueda && coincideEstado;
    });

    const estadosPosibles = ["pendiente", "confirmado", "en_proceso", "completado", "cancelado", "no_asistio"];

    const columnas = [
        {
            campo: "fecha",
            titulo: "Fecha y hora",
            render: (t) => (
                <div>
                    <div className="flex items-center gap-1.5 text-white font-medium">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        {t.fecha}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatoHora(t.hora_inicio)} - {formatoHora(t.hora_fin)}
                    </div>
                </div>
            ),
        },
        {
            campo: "id_cliente",
            titulo: "Cliente",
            render: (t) => (
                <span className="inline-flex items-center gap-1.5 text-gray-200">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                    {nombreCliente(t.id_cliente)}
                </span>
            ),
        },
        {
            campo: "id_barbero",
            titulo: "Barbero",
            oculta: "hidden md:table-cell",
            render: (t) => nombreBarbero(t.id_barbero),
        },
        {
            campo: "servicios",
            titulo: "Servicios",
            ordenable: false,
            oculta: "hidden lg:table-cell",
            render: (t) => <span className="text-gray-400 text-sm">{nombresServicios(t.servicios)}</span>,
        },
        {
            campo: "precio_total",
            titulo: "Total",
            render: (t) => <span className="text-gold font-medium">{formatoPrecio(t.precio_total)}</span>,
        },
        {
            campo: "estado",
            titulo: "Estado",
            render: (t) => (
                <select
                    value={t.estado}
                    onChange={(e) => cambiarEstado(t.id_turno, e.target.value)}
                    className={`bg-ink border rounded-lg px-2.5 py-1.5 text-sm font-medium focus:outline-none cursor-pointer ${estiloEstado(t.estado)}`}
                >
                    {estadosPosibles.map((est) => (
                        <option key={est} value={est} className="bg-ink text-white">
                            {textoEstado(est)}
                        </option>
                    ))}
                </select>
            ),
        },
        {
            campo: "acciones",
            titulo: "Acciones",
            ordenable: false,
            alinear: "right",
            render: (t) => (
                <div className="flex items-center justify-end gap-1.5">
                    <button
                        onClick={() => navigate(`/turnos/editar/${t.id_turno}`)}
                        className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => eliminarTurno(t.id_turno)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Cancelar turno"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    const estadosFiltro = ["todos", ...estadosPosibles];

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Turnos</h1>
                    <p className="text-gray-400">Gestioná la agenda de tu barbería</p>
                </div>
                <button
                    onClick={() => navigate("/turnos/nuevo")}
                    className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo turno
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-5">
                {estadosFiltro.map((e) => (
                    <button
                        key={e}
                        onClick={() => setEstadoFiltro(e)}
                        className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${estadoFiltro === e ? "bg-gold text-ink" : "bg-ink-card border border-line text-gray-300 hover:text-white"
                            }`}
                    >
                        {e === "todos" ? "Todos" : textoEstado(e)}
                    </button>
                ))}
            </div>

            <div className="relative mb-6 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por cliente o barbero..."
                    className="w-full bg-ink-card border border-line rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
                />
            </div>

            {cargando ? (
                <div className="text-center py-16 text-gray-500">Cargando turnos...</div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">{error}</div>
            ) : (
                <Tabla
                    columnas={columnas}
                    datos={filtrados}
                    vacioTexto={busqueda || estadoFiltro !== "todos" ? "No se encontraron turnos" : "Todavía no hay turnos"}
                />
            )}
        </div>
    );
}

export default Turnos;