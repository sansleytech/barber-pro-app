import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Scissors } from "lucide-react";
import api from "../api/cliente";
import { useAuth } from "../context/AuthContext";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function fechaAISO(fecha) {
    return fecha.getFullYear() + "-" + String(fecha.getMonth() + 1).padStart(2, "0") + "-" + String(fecha.getDate()).padStart(2, "0");
}

function Calendario() {
    const { usuario } = useAuth();

    const [turnos, setTurnos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [cargando, setCargando] = useState(true);

    const [mesActual, setMesActual] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [diaSeleccionado, setDiaSeleccionado] = useState(new Date().getDate());

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        try {
            const idBarbero = usuario?.rol === "barbero" ? usuario.id_barbero : null;
            const [resT, resC, resS] = await Promise.all([
                api.get("/turnos"),
                api.get("/clientes"),
                api.get("/servicios"),
            ]);
            const todos = idBarbero ? resT.data.filter((t) => t.id_barbero === idBarbero) : resT.data;
            setTurnos(todos);
            setClientes(resC.data);
            setServicios(resS.data);
        } finally {
            setCargando(false);
        }
    }, [usuario]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const nombreCliente = (id) => {
        const c = clientes.find((x) => x.id_cliente === id);
        return c ? `${c.primer_nombre} ${c.apellidos}` : "Cliente";
    };
    const nombresServicios = (lista) => {
        if (!lista || lista.length === 0) return "—";
        return lista.map((item) => servicios.find((s) => s.id_servicio === item.id_servicio)?.nombre || "Servicio").join(", ");
    };
    const formatoHora = (hora) => {
        if (!hora) return "—";
        const [h, m] = hora.split(":").map(Number);
        const sufijo = h >= 12 ? "p.m." : "a.m.";
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
    };

    const turnosPorFecha = {};
    turnos.forEach((t) => {
        if (!turnosPorFecha[t.fecha]) turnosPorFecha[t.fecha] = { total: 0, completados: 0, cancelados: 0, pendientes: 0 };
        turnosPorFecha[t.fecha].total++;
        if (t.estado === "completado") turnosPorFecha[t.fecha].completados++;
        else if (t.estado === "cancelado" || t.estado === "no_asistio") turnosPorFecha[t.fecha].cancelados++;
        else turnosPorFecha[t.fecha].pendientes++;
    });

    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    const primerDiaSemana = (new Date(año, mes, 1).getDay() + 6) % 7;
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    const diasMesAnterior = new Date(año, mes, 0).getDate();

    const celdas = [];
    for (let i = 0; i < primerDiaSemana; i++) {
        celdas.push({ dia: diasMesAnterior - primerDiaSemana + i + 1, otroMes: true });
    }
    for (let d = 1; d <= diasEnMes; d++) {
        celdas.push({ dia: d, otroMes: false });
    }
    while (celdas.length < 42) {
        celdas.push({ dia: celdas.length - diasEnMes - primerDiaSemana + 1, otroMes: true });
    }

    const hoy = new Date();
    const esHoy = (dia, otroMes) => !otroMes && dia === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear();

    const irMes = (delta) => {
        setMesActual(new Date(año, mes + delta, 1));
        setDiaSeleccionado(null);
    };

    const irHoy = () => {
        const d = new Date();
        setMesActual(new Date(d.getFullYear(), d.getMonth(), 1));
        setDiaSeleccionado(d.getDate());
    };

    const fechaISOSeleccionada = diaSeleccionado ? fechaAISO(new Date(año, mes, diaSeleccionado)) : null;
    const turnosDelDia = fechaISOSeleccionada
        ? turnos.filter((t) => t.fecha === fechaISOSeleccionada).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
        : [];

    const estiloEstado = (estado) => {
        const estilos = {
            pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/25",
            confirmado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
            en_proceso: "bg-purple-500/15 text-purple-400 border-purple-500/25",
            completado: "bg-gold/15 text-gold border-gold/25",
            cancelado: "bg-red-500/15 text-red-400 border-red-500/25",
            no_asistio: "bg-gray-500/15 text-gray-400 border-gray-500/25",
        };
        return estilos[estado] || estilos.pendiente;
    };

    if (cargando) {
        return <div className="text-center py-20 text-gray-500">Cargando calendario...</div>;
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-1">Calendario</h1>
                <p className="text-gray-400">Vista mensual de turnos</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
                <div className="bg-ink-card border border-line rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3.5">
                            <button
                                onClick={() => irMes(-1)}
                                className="w-9 h-9 rounded-xl bg-ink border border-line text-gray-400 hover:text-gold hover:border-gold/40 transition-colors flex items-center justify-center"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xl font-bold text-white min-w-[180px] text-center">
                                {MESES[mes]} {año}
                            </span>
                            <button
                                onClick={() => irMes(1)}
                                className="w-9 h-9 rounded-xl bg-ink border border-line text-gray-400 hover:text-gold hover:border-gold/40 transition-colors flex items-center justify-center"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={irHoy}
                            className="px-4 py-2 rounded-full text-xs font-semibold bg-ink border border-line text-gray-300 hover:text-white hover:border-gold/40 transition-colors"
                        >
                            Hoy
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 mb-2">
                        {DIAS_SEMANA.map((d) => (
                            <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 py-2">
                                {d}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                        {celdas.map((c, i) => {
                            const info = !c.otroMes ? turnosPorFecha[fechaAISO(new Date(año, mes, c.dia))] : null;
                            const seleccionado = !c.otroMes && diaSeleccionado === c.dia;
                            const hoyCelda = esHoy(c.dia, c.otroMes);
                            return (
                                <button
                                    key={i}
                                    disabled={c.otroMes}
                                    onClick={() => setDiaSeleccionado(c.dia)}
                                    className={`relative flex flex-col gap-1 min-h-[104px] p-2.5 rounded-xl border text-left transition-all ${c.otroMes
                                            ? "opacity-25 border-transparent cursor-default"
                                            : seleccionado
                                                ? "bg-gold/20 border-gold shadow-[0_0_0_2px_rgba(212,175,55,0.3)]"
                                                : hoyCelda
                                                    ? "bg-gold/10 border-gold/40 hover:border-gold/60"
                                                    : "bg-ink border-line hover:border-gold/30 hover:bg-ink/60"
                                        }`}
                                >
                                    <span className={`text-sm font-semibold ${hoyCelda ? "text-gold" : "text-gray-200"}`}>{c.dia}</span>
                                    {info && info.total > 0 && (
                                        <span className="absolute top-2 right-2 bg-gradient-to-br from-yellow-300 to-gold text-ink text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {info.total}
                                        </span>
                                    )}
                                    <div className="flex flex-col gap-0.5 mt-auto">
                                        {info?.completados > 0 && (
                                            <span className="text-[9px] font-semibold leading-tight px-1.5 py-0.5 rounded bg-gold/15 text-gold">
                                                {info.completados} completado{info.completados !== 1 ? "s" : ""}
                                            </span>
                                        )}
                                        {info?.pendientes > 0 && (
                                            <span className="text-[9px] font-semibold leading-tight px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                                                {info.pendientes} pendiente{info.pendientes !== 1 ? "s" : ""}
                                            </span>
                                        )}
                                        {info?.cancelados > 0 && (
                                            <span className="text-[9px] font-semibold leading-tight px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">
                                                {info.cancelados} cancelado{info.cancelados !== 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-ink-card border border-line rounded-3xl p-6">
                    <h3 className="text-white font-bold text-lg mb-1">
                        {diaSeleccionado ? `${diaSeleccionado} de ${MESES[mes]}` : "Seleccioná un día"}
                    </h3>
                    <p className="text-gray-500 text-xs mb-5">
                        {diaSeleccionado ? `${turnosDelDia.length} ${turnosDelDia.length === 1 ? "turno" : "turnos"}` : "Hacé clic en un día del calendario"}
                    </p>

                    {!diaSeleccionado || turnosDelDia.length === 0 ? (
                        <div className="text-center py-14">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                                <CalendarIcon className="w-7 h-7" />
                            </div>
                            <h4 className="text-white font-semibold text-sm mb-1">
                                {diaSeleccionado ? "Sin turnos" : "Sin selección"}
                            </h4>
                            <p className="text-gray-500 text-xs">
                                {diaSeleccionado ? "No hay turnos para este día" : "Hacé clic en un día para ver los turnos"}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto">
                            {turnosDelDia.map((t, idx) => (
                                <div
                                    key={t.id_turno}
                                    className="flex items-center gap-3.5 p-3.5 bg-ink border border-line rounded-2xl hover:border-gold/25 hover:translate-x-0.5 transition-all"
                                    style={{ animation: `deslizarArriba 0.3s ease-out ${idx * 0.03}s backwards` }}
                                >
                                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gold/10 border border-gold/20 flex flex-col items-center justify-center text-center">
                                        <span className="text-gold font-bold text-xs leading-tight">{formatoHora(t.hora_inicio)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-semibold text-sm mb-1">{nombreCliente(t.id_cliente)}</div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
                                            <Scissors className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{nombresServicios(t.servicios)}</span>
                                        </div>
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${estiloEstado(t.estado)}`}>
                                            {t.estado.replace("_", " ")}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Calendario;