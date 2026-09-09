import React from "react";
import { useState, useEffect, useCallback } from "react";
import { Bell, Phone, Calendar, MessageCircle, RefreshCw, Sparkles } from "lucide-react";
import api from "../api/cliente";
import { useAuth } from "../context/AuthContext";

function Recordatorios() {
    const { usuario } = useAuth();

    const [turnos, setTurnos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [barberos, setBarberos] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [cargando, setCargando] = useState(true);

    const [seleccionados, setSeleccionados] = useState(new Set());
    const [verPreview, setVerPreview] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [toast, setToast] = useState("");

    const cargarDatos = useCallback(async () => {
        try {
            const idBarbero = usuario?.rol === "barbero" ? usuario.id_barbero : null;
            const [resT, resC, resB, resS] = await Promise.all([
                api.get("/turnos"),
                api.get("/clientes"),
                api.get("/barberos"),
                api.get("/servicios"),
            ]);
            const todos = idBarbero ? resT.data.filter((t) => t.id_barbero === idBarbero) : resT.data;
            setTurnos(todos);
            setClientes(resC.data);
            setBarberos(resB.data);
            setServicios(resS.data);
        } finally {
            setCargando(false);
        }
    }, [usuario]);

    useEffect(() => {
        cargarDatos();
        const intervalo = setInterval(cargarDatos, 60000);
        return () => clearInterval(intervalo);
    }, [cargarDatos]);

    const clienteDe = (id) => clientes.find((c) => c.id_cliente === id);
    const nombreCliente = (id) => {
        const c = clienteDe(id);
        return c ? `${c.primer_nombre} ${c.apellidos}` : "Cliente";
    };
    const nombreBarbero = (id) => {
        const b = barberos.find((x) => x.id_barbero === id);
        return b ? `${b.nombre} ${b.apellido}` : "Barbero";
    };
    const nombresServicios = (lista) => {
        if (!lista || lista.length === 0) return "—";
        return lista
            .map((item) => servicios.find((s) => s.id_servicio === item.id_servicio)?.nombre || "Servicio")
            .join(", ");
    };

    const formatoPrecio = (valor) =>
        new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(valor || 0);

    const formatoHora = (hora) => {
        if (!hora) return "—";
        const [h, m] = hora.split(":").map(Number);
        const sufijo = h >= 12 ? "p.m." : "a.m.";
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
    };

    const fechaLegible = (fecha) =>
        new Date(`${fecha}T12:00:00`).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });

    const turnosActivos = turnos.filter((t) => {
        if (!["pendiente", "confirmado"].includes(t.estado)) return false;
        const cliente = clienteDe(t.id_cliente);
        const tel = String(cliente?.telefono || "").replace(/\D/g, "");
        return tel.length >= 8;
    });

    const ahora = new Date();
    const proximos = turnosActivos
        .map((t) => {
            const fechaHora = new Date(`${t.fecha}T${t.hora_inicio}`);
            const minutos = Math.round((fechaHora - ahora) / 60000);
            return { ...t, minutosRestantes: minutos };
        })
        .filter((t) => t.minutosRestantes >= 0 && t.minutosRestantes <= 24 * 60)
        .sort((a, b) => a.minutosRestantes - b.minutosRestantes);

    const mensajeTurno = (t) => {
        const cliente = clienteDe(t.id_cliente);
        const primerNombre = cliente?.primer_nombre || "Cliente";
        const fecha = fechaLegible(t.fecha);
        const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);
        const barbero = nombreBarbero(t.id_barbero).split(" ")[0];
        const servicio = nombresServicios(t.servicios);
        const nombreBarberia = usuario?.barberia || "Barbería Pro";
        return "✨ Hola " + primerNombre + ",\n\nTe recordamos tu turno en *" + nombreBarberia + "*:\n\n📅 " + fechaCap + "\n🕐 " + formatoHora(t.hora_inicio) + "\n✂️ " + servicio + "\n💪 Con " + barbero + "\n\n¡Te esperamos!";
    };

    const linkWhatsApp = (t) => {
        const cliente = clienteDe(t.id_cliente);
        let tel = String(cliente?.telefono || "").replace(/\D/g, "");
        if (tel.length === 10) tel = "57" + tel;
        return "https://wa.me/" + tel + "?text=" + encodeURIComponent(mensajeTurno(t));
    };

    const telefonoDe = (t) => clienteDe(t.id_cliente)?.telefono || "";

    const toggleSeleccion = (idTurno) => {
        setSeleccionados((prev) => {
            const nuevo = new Set(prev);
            if (nuevo.has(idTurno)) nuevo.delete(idTurno);
            else nuevo.add(idTurno);
            return nuevo;
        });
    };

    const toggleTodos = () => {
        if (seleccionados.size === turnosActivos.length) {
            setSeleccionados(new Set());
        } else {
            setSeleccionados(new Set(turnosActivos.map((t) => t.id_turno)));
        }
    };

    const mostrarToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 2500);
    };

    const enviarMasivamente = async () => {
        if (seleccionados.size === 0) return;
        const cantidad = seleccionados.size;
        const ok = window.confirm(
            "¿Mandar recordatorio a " + cantidad + " cliente" + (cantidad !== 1 ? "s" : "") + "? Se abrirán " + cantidad + " pestañas de WhatsApp con 2 seg de pausa entre cada una."
        );
        if (!ok) return;

        setEnviando(true);
        const lista = turnosActivos.filter((t) => seleccionados.has(t.id_turno));
        let enviados = 0;

        for (let i = 0; i < lista.length; i++) {
            const t = lista[i];
            window.open(linkWhatsApp(t), "_blank");
            enviados++;
            mostrarToast("Abriendo " + enviados + "/" + lista.length + ": " + nombreCliente(t.id_cliente).split(" ")[0]);
            if (i < lista.length - 1) await new Promise((r) => setTimeout(r, 2000));
        }

        mostrarToast("✅ " + enviados + " mensaje" + (enviados !== 1 ? "s" : "") + " preparado" + (enviados !== 1 ? "s" : ""));
        setSeleccionados(new Set());
        setEnviando(false);
    };

    const primerSeleccionado = turnosActivos.find((t) => seleccionados.has(t.id_turno));

    if (cargando) {
        return React.createElement("div", { className: "text-center py-20 text-gray-500" }, "Cargando recordatorios...");
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1">Recordatorios</h1>
                <p className="text-gray-400">Próximos turnos en las siguientes 24 horas</p>
            </div>

            {proximos.length > 0 && (
                <div className="flex items-center gap-3.5 bg-gold/5 border border-gold/20 rounded-2xl px-5 py-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-300 to-gold flex items-center justify-center text-ink flex-shrink-0">
                        <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-white text-sm font-semibold">Turnos próximos</h4>
                        <p className="text-xs text-gray-400">Contactá a tus clientes para confirmar el turno por WhatsApp o teléfono</p>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-gradient-to-br from-yellow-300 to-gold text-ink text-sm font-bold">
                        {proximos.length}
                    </span>
                </div>
            )}

            <div className="space-y-3">
                {proximos.length === 0 ? (
                    <div className="text-center py-20 bg-ink-card border border-line rounded-2xl">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                            <Sparkles className="w-9 h-9" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1.5">Sin turnos próximos</h3>
                        <p className="text-gray-500 text-sm">No tenés turnos en las próximas 24 horas</p>
                    </div>
                ) : (
                    proximos.map((t) => {
                        const urgente = t.minutosRestantes <= 60;
                        const tiempoNum = t.minutosRestantes < 60 ? t.minutosRestantes : Math.floor(t.minutosRestantes / 60);
                        const tiempoLabel = t.minutosRestantes < 60 ? "min" : "hs";
                        const tel = telefonoDe(t);
                        const claseTarjeta = "grid grid-cols-[90px_1fr_auto] sm:grid-cols-[100px_1fr_auto] gap-4 sm:gap-5 items-center p-5 rounded-2xl border transition-colors " + (urgente ? "bg-red-500/5 border-red-500/25" : "bg-ink-card border-line");
                        const clasePill = "flex flex-col items-center justify-center py-4 rounded-xl border " + (urgente ? "bg-red-500/10 border-red-500/25" : "bg-gold/10 border-gold/20");
                        const claseNum = "text-2xl font-bold leading-none " + (urgente ? "text-red-400" : "text-gold");
                        const claseLabel = "text-[10px] font-bold uppercase tracking-wide mt-1 " + (urgente ? "text-red-400/80" : "text-gold/70");
                        const claseBadge = "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase " + (t.estado === "confirmado" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "bg-amber-500/15 text-amber-400 border border-amber-500/25");
                        const botonWA = "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-xs font-semibold hover:brightness-110 transition-all";
                        const botonCall = "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-ink border border-line text-gray-300 text-xs font-semibold hover:text-white transition-colors";

                        return (
                            <div key={t.id_turno} className={claseTarjeta}>
                                <div className={clasePill}>
                                    <span className={claseNum}>{tiempoNum}</span>
                                    <span className={claseLabel}>{tiempoLabel}</span>
                                </div>

                                <div className="min-w-0">
                                    <h3 className="text-white font-semibold text-base mb-1">{nombreCliente(t.id_cliente)}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
                                        {nombresServicios(t.servicios)}
                                        <span className="text-gold font-bold">{formatoPrecio(t.precio_total)}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" /> {fechaLegible(t.fecha)} · {formatoHora(t.hora_inicio)}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Phone className="w-3 h-3" /> {tel}
                                        </span>
                                        <span className={claseBadge}>{t.estado}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 min-w-[110px]">
                                    {React.createElement(
                                        "a",
                                        { href: linkWhatsApp(t), target: "_blank", rel: "noreferrer", className: botonWA },
                                        React.createElement(MessageCircle, { className: "w-3.5 h-3.5" }),
                                        " WhatsApp"
                                    )}
                                    {tel &&
                                        React.createElement(
                                            "a",
                                            { href: "tel:" + tel, className: botonCall },
                                            React.createElement(Phone, { className: "w-3.5 h-3.5" }),
                                            " Llamar"
                                        )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="mt-10 p-6 bg-gold/[0.03] border border-gold/15 rounded-2xl">
                <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-300 to-gold flex items-center justify-center text-ink flex-shrink-0">
                        <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-white text-xl font-bold">Envío masivo de recordatorios</h2>
                        <p className="text-gray-400 text-sm mt-0.5">
                            Seleccioná los turnos pendientes/confirmados a los que querés mandar WhatsApp
                        </p>
                    </div>
                    <button
                        onClick={cargarDatos}
                        className="p-2 rounded-lg bg-ink border border-line text-gray-400 hover:text-white transition-colors"
                        title="Refrescar"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer text-white text-sm font-semibold">
                        <input
                            type="checkbox"
                            checked={turnosActivos.length > 0 && seleccionados.size === turnosActivos.length}
                            onChange={toggleTodos}
                            className="w-[18px] h-[18px] accent-gold cursor-pointer"
                        />
                        Seleccionar todos
                    </label>
                    <span className="text-gray-500 text-xs">
                        {seleccionados.size} seleccionado{seleccionados.size !== 1 ? "s" : ""}
                    </span>
                    <div className="flex-1" />
                    <button
                        onClick={() => setVerPreview((v) => !v)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-ink border border-line text-gray-300 text-sm hover:text-white transition-colors"
                    >
                        Ver mensaje
                    </button>
                    <button
                        onClick={enviarMasivamente}
                        disabled={seleccionados.size === 0 || enviando}
                        className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MessageCircle className="w-4 h-4" />
                        {enviando ? "Enviando…" : "Enviar a " + seleccionados.size}
                    </button>
                </div>

                {verPreview && (
                    <div className="mb-4 bg-ink border border-line rounded-xl p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2.5">
                            Vista previa del mensaje (cada cliente recibe el suyo)
                        </p>
                        <pre className="bg-emerald-950/30 border border-emerald-500/20 rounded-lg p-4 text-gray-200 text-sm whitespace-pre-wrap font-sans">
                            {primerSeleccionado ? mensajeTurno(primerSeleccionado) : "Seleccioná al menos un turno para ver el mensaje"}
                        </pre>
                    </div>
                )}

                <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto">
                    {turnosActivos.length === 0 ? (
                        <div className="text-center py-16 text-gray-500 text-sm">
                            Sin turnos pendientes con teléfono cargado
                        </div>
                    ) : (
                        turnosActivos.map((t) => {
                            const cliente = clienteDe(t.id_cliente);
                            const inicial = (cliente?.primer_nombre || "?")[0].toUpperCase();
                            const claseEstado = "text-[11px] font-bold uppercase mb-0.5 " + (t.estado === "confirmado" ? "text-emerald-400" : "text-amber-400");
                            return (
                                <label
                                    key={t.id_turno}
                                    className="flex items-center gap-3.5 px-4 py-3.5 bg-ink border border-line rounded-xl cursor-pointer hover:border-gold/25 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={seleccionados.has(t.id_turno)}
                                        onChange={() => toggleSeleccion(t.id_turno)}
                                        className="w-[18px] h-[18px] accent-gold cursor-pointer flex-shrink-0"
                                    />
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-300 to-gold flex items-center justify-center text-ink font-bold text-sm flex-shrink-0">
                                        {inicial}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-semibold text-sm truncate">{nombreCliente(t.id_cliente)}</div>
                                        <div className="text-gray-500 text-xs truncate">
                                            {t.fecha} · {formatoHora(t.hora_inicio)} · {nombresServicios(t.servicios)}
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className={claseEstado}>{t.estado}</div>
                                        <div className="text-gray-500 text-xs">{telefonoDe(t)}</div>
                                    </div>
                                </label>
                            );
                        })
                    )}
                </div>
            </div>

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-ink-card/95 backdrop-blur border border-line text-white text-sm shadow-xl">
                    {toast}
                </div>
            )}
        </div>
    );
}

export default Recordatorios;