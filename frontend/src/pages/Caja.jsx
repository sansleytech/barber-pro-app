import { useState, useEffect } from "react";
import {
    Wallet, Scissors, ShoppingBag, Plus, Lock, LockOpen, ChevronLeft, ChevronRight,
    TrendingDown, Tag, Check, X, History, FileDown, Sheet,
} from "lucide-react";

import api from "../api/cliente";

const Caja = () => {
    const hoyStr = new Date().toISOString().slice(0, 10);

    const [fecha, setFecha] = useState(hoyStr);
    const [turnos, setTurnos] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [gastos, setGastos] = useState([]);
    const [descuentos, setDescuentos] = useState([]);
    const [cierres, setCierres] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [barberos, setBarberos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [verHistorial, setVerHistorial] = useState(false);

    const [gasto, setGasto] = useState({ concepto: "", monto: "", categoria: "" });
    const [descuento, setDescuento] = useState({ concepto: "", monto: "" });
    const [guardandoG, setGuardandoG] = useState(false);
    const [guardandoD, setGuardandoD] = useState(false);
    const [cerrando, setCerrando] = useState(false);

    const cargarTodo = async () => {
        setCargando(true);
        setError("");
        try {
            const [resT, resV, resG, resD, resC, resCl, resB] = await Promise.all([
                api.get("/turnos"),
                api.get("/ventas"),
                api.get("/caja/gastos"),
                api.get("/caja/descuentos"),
                api.get("/caja/cierres"),
                api.get("/clientes"),
                api.get("/barberos"),
            ]);
            setTurnos(resT.data);
            setVentas(resV.data);
            setGastos(resG.data);
            setDescuentos(resD.data);
            setCierres(resC.data);
            setClientes(resCl.data);
            setBarberos(resB.data);
        } catch (err) {
            setError("No se pudieron cargar los datos de caja");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarTodo();
    }, []);

    const formatoPrecio = (valor) =>
        new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(valor || 0);

    const formatoFecha = (f) => {
        if (!f) return "—";
        return new Date(f + "T00:00:00").toLocaleDateString("es-CO", {
            weekday: "long", day: "2-digit", month: "long", year: "numeric",
        });
    };

    const soloNumeros = (valor) => valor.replace(/[^0-9]/g, "");
    const soloFecha = (f) => (f || "").slice(0, 10);

    const nombreCliente = (id) => {
        const c = clientes.find((x) => x.id_cliente === id);
        return c ? `${c.primer_nombre} ${c.apellidos}` : "Cliente";
    };
    const nombreBarbero = (id) => {
        const b = barberos.find((x) => x.id_barbero === id);
        return b ? `${b.nombre} ${b.apellido}` : "Barbero";
    };

    const formatoHora = (hora) => {
        if (!hora) return "—";
        const [h, m] = hora.split(":").map(Number);
        const suf = h >= 12 ? "p.m." : "a.m.";
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${h12}:${String(m).padStart(2, "0")} ${suf}`;
    };

    // ----- Datos del día seleccionado -----
    const turnosDia = turnos.filter((t) => t.fecha === fecha && t.estado === "completado");
    const ventasDia = ventas.filter((v) => soloFecha(v.fecha_venta) === fecha);
    const gastosDia = gastos.filter((g) => g.fecha === fecha);
    const descuentosDia = descuentos.filter((d) => d.fecha === fecha);

    const ingresosTurnos = turnosDia.reduce((acc, t) => acc + Number(t.precio_total), 0);
    const totalPropinas = turnosDia.reduce((acc, t) => acc + Number(t.propina || 0), 0);
    const ingresosVentas = ventasDia.reduce((acc, v) => acc + Number(v.total), 0);
    const totalGastos = gastosDia.reduce((acc, g) => acc + Number(g.monto), 0);
    const totalDescuentos = descuentosDia.reduce((acc, d) => acc + Number(d.monto), 0);

    const bruto = ingresosTurnos + ingresosVentas + totalPropinas;
    const cajaTotal = bruto - totalGastos - totalDescuentos;
    const unidadesVendidas = ventasDia.reduce((acc, v) => acc + v.items.reduce((a, it) => a + it.cantidad, 0), 0);

    // ¿Ya está cerrada esta fecha?
    const cierreDia = cierres.find((c) => c.fecha === fecha);
    const cerrada = Boolean(cierreDia);

    // Desglose por método de pago (de las ventas del día)
    const porMetodo = {};
    ventasDia.forEach((v) => {
        const m = v.metodo_pago || "sin definir";
        porMetodo[m] = (porMetodo[m] || 0) + Number(v.total);
    });

    // Desglose por barbero (de los turnos del día)
    const porBarbero = {};
    turnosDia.forEach((t) => {
        const nombre = nombreBarbero(t.id_barbero);
        porBarbero[nombre] = (porBarbero[nombre] || 0) + Number(t.precio_total);
    });

    // Navegación de fecha
    const cambiarDia = (dias) => {
        const d = new Date(fecha + "T00:00:00");
        d.setDate(d.getDate() + dias);
        setFecha(d.toISOString().slice(0, 10));
    };

    // ----- Acciones -----
    const agregarGasto = async (e) => {
        e.preventDefault();
        if (!gasto.concepto || !gasto.monto) return;
        setGuardandoG(true);
        try {
            await api.post("/caja/gastos", {
                concepto: gasto.concepto,
                monto: Number(gasto.monto),
                fecha: fecha,
                categoria: gasto.categoria || null,
            });
            setGasto({ concepto: "", monto: "", categoria: "" });
            cargarTodo();
        } catch {
            setError("No se pudo agregar el gasto");
        } finally {
            setGuardandoG(false);
        }
    };

    const agregarDescuento = async (e) => {
        e.preventDefault();
        if (!descuento.concepto || !descuento.monto) return;
        setGuardandoD(true);
        try {
            await api.post("/caja/descuentos", {
                concepto: descuento.concepto,
                monto: Number(descuento.monto),
                fecha: fecha,
            });
            setDescuento({ concepto: "", monto: "" });
            cargarTodo();
        } catch {
            setError("No se pudo agregar el descuento");
        } finally {
            setGuardandoD(false);
        }
    };

    const cerrarCaja = async () => {
        if (!confirm(`¿Cerrar la caja del ${formatoFecha(fecha)}? Vas a poder reabrirla si hace falta.`)) return;
        setCerrando(true);
        setMensaje("");
        setError("");
        try {
            await api.post("/caja/cierres", { fecha: fecha, observaciones: null });
            setMensaje("Caja cerrada correctamente");
            cargarTodo();
        } catch (err) {
            setError(err.response?.data?.detail || "No se pudo cerrar la caja");
        } finally {
            setCerrando(false);
        }
    };

    const reabrirCaja = async () => {
        if (!confirm(`¿Reabrir la caja del ${formatoFecha(fecha)}? Vas a poder editar y cerrar de nuevo.`)) return;
        setCerrando(true);
        setMensaje("");
        setError("");
        try {
            await api.delete(`/caja/cierres/${fecha}`);
            setMensaje("Caja reabierta correctamente");
            cargarTodo();
        } catch (err) {
            setError(err.response?.data?.detail || "No se pudo reabrir la caja");
        } finally {
            setCerrando(false);
        }
    };

    const esHoy = fecha === hoyStr;

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-1">Caja diaria</h1>
                <p className="text-gray-400">Cierre del día con cálculo de bruto y neto</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
            )}
            {mensaje && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-3 mb-4">{mensaje}</div>
            )}

            {/* Barra superior: fecha + acciones */}
            <div className="bg-ink-card border border-line rounded-2xl p-4 mb-6 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => cambiarDia(-1)} className="p-2 text-gray-400 hover:text-white bg-ink rounded-lg transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="bg-ink border border-line rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold"
                    />
                    <button onClick={() => cambiarDia(1)} className="p-2 text-gray-400 hover:text-white bg-ink rounded-lg transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    {!esHoy && (
                        <button onClick={() => setFecha(hoyStr)} className="px-3 py-2 text-sm bg-ink border border-line rounded-lg text-gray-300 hover:text-white transition-colors">
                            Hoy
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${cerrada ? "bg-gray-500/10 text-gray-400" : "bg-emerald-500/10 text-emerald-400"
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${cerrada ? "bg-gray-400" : "bg-emerald-400"}`} />
                        {cerrada ? "Caja cerrada" : "Caja abierta"}
                    </span>

                    <button
                        onClick={() => setVerHistorial(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-ink border border-line rounded-lg text-gray-300 hover:text-white transition-colors"
                    >
                        <History className="w-4 h-4" />
                        Historial
                    </button>

                    {/* Export PDF (sin función todavía) */}
                    <button
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-ink border border-line rounded-lg text-gray-300 hover:text-white transition-colors"
                    >
                        <FileDown className="w-4 h-4" />
                        PDF
                    </button>

                    {/* Export Excel (sin función todavía) */}
                    <button
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-ink border border-line rounded-lg text-gray-300 hover:text-white transition-colors"
                    >
                        <Sheet className="w-4 h-4" />
                        Excel
                    </button>

                    {cerrada ? (
                        <button
                            onClick={reabrirCaja}
                            disabled={cerrando}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-ink border border-gold/40 text-gold font-semibold rounded-lg hover:bg-gold/10 transition-colors disabled:opacity-50"
                        >
                            <LockOpen className="w-4 h-4" />
                            {cerrando ? "Reabriendo..." : "Reabrir caja"}
                        </button>
                    ) : (
                        <button
                            onClick={cerrarCaja}
                            disabled={cerrando}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-gold text-ink font-semibold rounded-lg hover:bg-gold-soft transition-colors disabled:opacity-50"
                        >
                            <Lock className="w-4 h-4" />
                            {cerrando ? "Cerrando..." : "Cerrar caja"}
                        </button>
                    )}
                </div>
            </div>

            {cargando ? (
                <div className="text-center py-16 text-gray-500">Cargando caja...</div>
            ) : (
                <>
                    {/* Paneles principales */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Panel grande: totales */}
                        <div className="lg:col-span-1 bg-ink-card border border-gold/30 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-gray-400 text-sm">Bruto del día</span>
                                <span className="text-white font-bold text-xl">{formatoPrecio(bruto)}</span>
                            </div>
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-line">
                                <span className="text-gray-400 text-sm">Egresos (gastos + desc.)</span>
                                <span className="text-red-400 font-medium">- {formatoPrecio(totalGastos + totalDescuentos)}</span>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-2 text-gold text-sm font-medium">
                                        <Scissors className="w-4 h-4" /> Servicios
                                    </span>
                                    <span className="text-gold font-bold text-lg">{formatoPrecio(ingresosTurnos)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                        <ShoppingBag className="w-4 h-4" /> Productos ({unidadesVendidas} u.)
                                    </span>
                                    <span className="text-emerald-400 font-bold text-lg">{formatoPrecio(ingresosVentas)}</span>
                                </div>
                                {totalPropinas > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-purple-400 text-sm font-medium">Propinas</span>
                                        <span className="text-purple-400 font-medium">{formatoPrecio(totalPropinas)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-line pt-4 flex items-center justify-between">
                                <span className="text-white font-semibold">Caja total del día</span>
                                <span className="text-gold font-bold text-2xl">{formatoPrecio(cajaTotal)}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{turnosDia.length} servicios completados</p>
                        </div>

                        {/* Por método de pago */}
                        <div className="bg-ink-card border border-line rounded-2xl p-6">
                            <h3 className="text-xs font-medium text-gray-400 uppercase mb-4">Por método de pago</h3>
                            {Object.keys(porMetodo).length === 0 ? (
                                <p className="text-gray-500 text-sm">Sin ventas este día</p>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(porMetodo).map(([metodo, monto]) => (
                                        <div key={metodo} className="flex items-center justify-between">
                                            <span className="text-gray-300 text-sm capitalize">{metodo}</span>
                                            <span className="text-gold font-medium">{formatoPrecio(monto)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Por barbero */}
                        <div className="bg-ink-card border border-line rounded-2xl p-6">
                            <h3 className="text-xs font-medium text-gray-400 uppercase mb-4">Por barbero</h3>
                            {Object.keys(porBarbero).length === 0 ? (
                                <p className="text-gray-500 text-sm">Sin servicios este día</p>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(porBarbero).map(([nombre, monto]) => (
                                        <div key={nombre} className="flex items-center justify-between">
                                            <span className="text-gray-300 text-sm">{nombre}</span>
                                            <span className="text-gold font-medium">{formatoPrecio(monto)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Gastos y descuentos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Gastos */}
                        <div className="bg-ink-card border border-line rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingDown className="w-5 h-5 text-red-400" />
                                <h3 className="text-white font-semibold">Gastos del día</h3>
                                <span className="ml-auto text-red-400 font-medium">{formatoPrecio(totalGastos)}</span>
                            </div>

                            {!cerrada && (
                                <form onSubmit={agregarGasto} className="flex flex-col sm:flex-row gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={gasto.concepto}
                                        onChange={(e) => setGasto((g) => ({ ...g, concepto: e.target.value }))}
                                        placeholder="Concepto"
                                        className="flex-1 bg-ink border border-line rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold"
                                    />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={gasto.monto}
                                        onChange={(e) => setGasto((g) => ({ ...g, monto: soloNumeros(e.target.value) }))}
                                        placeholder="Monto"
                                        className="w-28 bg-ink border border-line rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold"
                                    />
                                    <button
                                        type="submit"
                                        disabled={guardandoG}
                                        className="inline-flex items-center justify-center gap-1 bg-gold text-ink font-semibold rounded-lg px-3 py-2 text-sm hover:bg-gold-soft transition-colors disabled:opacity-50"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </form>
                            )}

                            {gastosDia.length === 0 ? (
                                <p className="text-gray-500 text-sm">Sin gastos este día</p>
                            ) : (
                                <div className="space-y-2">
                                    {gastosDia.map((g) => (
                                        <div key={g.id_gasto} className="flex items-center justify-between text-sm bg-ink rounded-lg px-3 py-2">
                                            <span className="text-gray-300">{g.concepto}</span>
                                            <span className="text-red-400">- {formatoPrecio(g.monto)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Descuentos */}
                        <div className="bg-ink-card border border-line rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Tag className="w-5 h-5 text-amber-400" />
                                <h3 className="text-white font-semibold">Descuentos del día</h3>
                                <span className="ml-auto text-amber-400 font-medium">{formatoPrecio(totalDescuentos)}</span>
                            </div>

                            {!cerrada && (
                                <form onSubmit={agregarDescuento} className="flex flex-col sm:flex-row gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={descuento.concepto}
                                        onChange={(e) => setDescuento((d) => ({ ...d, concepto: e.target.value }))}
                                        placeholder="Concepto"
                                        className="flex-1 bg-ink border border-line rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold"
                                    />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={descuento.monto}
                                        onChange={(e) => setDescuento((d) => ({ ...d, monto: soloNumeros(e.target.value) }))}
                                        placeholder="Monto"
                                        className="w-28 bg-ink border border-line rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold"
                                    />
                                    <button
                                        type="submit"
                                        disabled={guardandoD}
                                        className="inline-flex items-center justify-center gap-1 bg-gold text-ink font-semibold rounded-lg px-3 py-2 text-sm hover:bg-gold-soft transition-colors disabled:opacity-50"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </form>
                            )}

                            {descuentosDia.length === 0 ? (
                                <p className="text-gray-500 text-sm">Sin descuentos este día</p>
                            ) : (
                                <div className="space-y-2">
                                    {descuentosDia.map((d) => (
                                        <div key={d.id_descuento} className="flex items-center justify-between text-sm bg-ink rounded-lg px-3 py-2">
                                            <span className="text-gray-300">{d.concepto}</span>
                                            <span className="text-amber-400">- {formatoPrecio(d.monto)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detalle de servicios del día */}
                    <div className="bg-ink-card border border-line rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-4">Detalle de servicios</h3>
                        {turnosDia.length === 0 ? (
                            <p className="text-gray-500 text-sm">No hay servicios completados este día</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 border-b border-line">
                                            <th className="pb-2 font-medium">Hora</th>
                                            <th className="pb-2 font-medium">Cliente</th>
                                            <th className="pb-2 font-medium hidden sm:table-cell">Barbero</th>
                                            <th className="pb-2 font-medium text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {turnosDia.map((t) => (
                                            <tr key={t.id_turno} className="border-b border-line/50">
                                                <td className="py-2.5 text-gold font-medium">{formatoHora(t.hora_inicio)}</td>
                                                <td className="py-2.5 text-white">{nombreCliente(t.id_cliente)}</td>
                                                <td className="py-2.5 text-gray-400 hidden sm:table-cell">{nombreBarbero(t.id_barbero)}</td>
                                                <td className="py-2.5 text-gold font-medium text-right">{formatoPrecio(t.precio_total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modal de historial de cierres */}
            {verHistorial && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setVerHistorial(false)} />
                    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-ink-card border-l border-line z-50 overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-line">
                            <h2 className="text-xl font-bold text-white">Historial de cierres</h2>
                            <button onClick={() => setVerHistorial(false)} className="p-2 text-gray-400 hover:text-white hover:bg-ink rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-3">
                            {cierres.length === 0 ? (
                                <p className="text-gray-500 text-sm">Todavía no hay cierres registrados</p>
                            ) : (
                                cierres.map((c) => (
                                    <div key={c.id_cierre} className="bg-ink border border-line rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-white font-medium capitalize">{formatoFecha(c.fecha)}</span>
                                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                                                <Check className="w-3.5 h-3.5" /> Cerrada
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between"><span className="text-gray-500">Servicios</span><span className="text-gray-300">{formatoPrecio(c.ingresos_turnos)}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-500">Ventas</span><span className="text-gray-300">{formatoPrecio(c.ingresos_ventas)}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-500">Gastos</span><span className="text-red-400">- {formatoPrecio(c.total_gastos)}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-500">Descuentos</span><span className="text-amber-400">- {formatoPrecio(c.total_descuentos)}</span></div>
                                            <div className="flex justify-between pt-1 border-t border-line mt-1"><span className="text-white font-medium">Balance</span><span className="text-gold font-bold">{formatoPrecio(c.balance_final)}</span></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Caja;