import { useState, useEffect } from "react";
import { Trash2, Coffee, Check, Copy, X, Clock, Sun, Moon } from "lucide-react";
import api from "../api/cliente";

const DIAS = [
  { num: 1, nombre: "Lunes", corta: "Lun" },
  { num: 2, nombre: "Martes", corta: "Mar" },
  { num: 3, nombre: "Miércoles", corta: "Mié" },
  { num: 4, nombre: "Jueves", corta: "Jue" },
  { num: 5, nombre: "Viernes", corta: "Vie" },
  { num: 6, nombre: "Sábado", corta: "Sáb" },
  { num: 7, nombre: "Domingo", corta: "Dom" },
];

function Horarios() {
  const [barberos, setBarberos] = useState([]);
  const [idBarbero, setIdBarbero] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [diaSel, setDiaSel] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [error, setError] = useState("");
  const [modalReplicar, setModalReplicar] = useState(false);
  const [diasDestino, setDiasDestino] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get("/barberos");
        setBarberos(res.data);
        if (res.data.length > 0) setIdBarbero(res.data[0].id_barbero);
      } catch {
        setError("No se pudieron cargar los barberos");
      }
    };
    cargar();
  }, []);

  useEffect(() => {
    if (!idBarbero) return;
    const cargar = async () => {
      setCargando(true);
      setError("");
      try {
        const res = await api.get(`/horarios/barbero/${idBarbero}`);
        setHorarios(res.data);
      } catch {
        setError("No se pudieron cargar los horarios");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [idBarbero]);

  const horarioDe = (numDia) => horarios.find((h) => h.dia_semana === numDia) || null;
  const recargar = async () => {
    const res = await api.get(`/horarios/barbero/${idBarbero}`);
    setHorarios(res.data);
  };

  const hActual = horarioDe(diaSel);
  const activo = Boolean(hActual);
  const diaActual = DIAS.find((d) => d.num === diaSel);
  const diasActivos = DIAS.filter((d) => horarioDe(d.num));

  const activarDia = async () => {
    setGuardando(true);
    setError("");
    try {
      await api.post("/horarios", {
        id_barbero: idBarbero,
        dia_semana: diaSel,
        hora_inicio: "09:00",
        hora_fin: "18:00",
        pausa_inicio: null,
        pausa_fin: null,
      });
      await recargar();
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo activar el día");
    } finally {
      setGuardando(false);
    }
  };

  const desactivarDia = async () => {
    if (!hActual) return;
    setGuardando(true);
    setError("");
    try {
      await api.delete(`/horarios/${hActual.id_horario}`);
      await recargar();
      setGuardadoOk(false);
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo desactivar el día");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarCampo = (campo, valor) => {
    setHorarios((prev) =>
      prev.map((h) => (h.id_horario === hActual.id_horario ? { ...h, [campo]: valor } : h))
    );
    setGuardadoOk(false);
  };

  const guardarDia = async () => {
    setGuardando(true);
    setError("");
    try {
      await api.put(`/horarios/${hActual.id_horario}`, {
        hora_inicio: hActual.hora_inicio,
        hora_fin: hActual.hora_fin,
        pausa_inicio: hActual.pausa_inicio || null,
        pausa_fin: hActual.pausa_fin || null,
      });
      await recargar();
      setGuardadoOk(true);
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo guardar el horario");
    } finally {
      setGuardando(false);
    }
  };

  const toggleDiaDestino = (numDia) => {
    setDiasDestino((prev) =>
      prev.includes(numDia) ? prev.filter((d) => d !== numDia) : [...prev, numDia]
    );
  };

  const confirmarReplica = async () => {
    if (diasDestino.length === 0 || !hActual) return;
    setGuardando(true);
    setError("");
    try {
      for (const numDia of diasDestino) {
        const destino = horarioDe(numDia);
        const payload = {
          hora_inicio: hActual.hora_inicio,
          hora_fin: hActual.hora_fin,
          pausa_inicio: hActual.pausa_inicio || null,
          pausa_fin: hActual.pausa_fin || null,
        };
        if (destino) {
          await api.put(`/horarios/${destino.id_horario}`, payload);
        } else {
          await api.post("/horarios", { id_barbero: idBarbero, dia_semana: numDia, ...payload });
        }
      }
      await recargar();
      setDiasDestino([]);
      setModalReplicar(false);
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo replicar el horario");
    } finally {
      setGuardando(false);
    }
  };

  const hhmm = (hora) => (hora ? hora.slice(0, 5) : "");
  const barberoSel = barberos.find((b) => b.id_barbero === idBarbero);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Horarios de atención</h1>
        <p className="text-gray-400">Configurá los días y horas que trabaja cada barbero</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
          {error}
        </div>
      )}

      {/* Selector de barbero */}
      <div className="flex flex-wrap gap-2 mb-6">
        {barberos.map((b) => {
          const sel = b.id_barbero === idBarbero;
          const iniciales = `${b.nombre?.[0] || ""}${b.apellido?.[0] || ""}`.toUpperCase();
          return (
            <button
              key={b.id_barbero}
              onClick={() => setIdBarbero(b.id_barbero)}
              className={`inline-flex items-center gap-2 rounded-full pl-1.5 pr-4 py-1.5 border transition-colors ${
                sel ? "bg-gold/10 border-gold text-gold" : "bg-ink-card border-line text-gray-300 hover:text-white"
              }`}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold ${sel ? "bg-gold text-ink" : "bg-ink text-gray-400"}`}>
                {iniciales}
              </span>
              {b.nombre} {b.apellido}
            </button>
          );
        })}
      </div>

      {cargando ? (
        <div className="text-center py-16 text-gray-500">Cargando horarios...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          {/* Tira semanal — vista general de un vistazo */}
          <div className="bg-ink-card border border-line rounded-2xl p-3 lg:p-4 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
            {DIAS.map((dia) => {
              const h = horarioDe(dia.num);
              const activoDia = Boolean(h);
              const sel = diaSel === dia.num;
              return (
                <button
                  key={dia.num}
                  onClick={() => setDiaSel(dia.num)}
                  className={`flex-shrink-0 lg:w-full flex items-center gap-3 rounded-xl px-3.5 py-3 border text-left transition-all ${
                    sel
                      ? "bg-gold/10 border-gold"
                      : activoDia
                        ? "bg-ink border-line hover:border-white/20"
                        : "bg-transparent border-line/50 hover:border-white/10"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activoDia ? "bg-emerald-400" : "bg-gray-700"}`} />
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold ${sel ? "text-gold" : activoDia ? "text-white" : "text-gray-500"}`}>
                      {dia.corta}
                    </div>
                    <div className="text-[11px] text-gray-500 whitespace-nowrap">
                      {activoDia ? `${hhmm(h.hora_inicio)} - ${hhmm(h.hora_fin)}` : "Descansa"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Panel de detalle del día seleccionado */}
          <div className="bg-ink-card border border-line rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">{diaActual.nombre}</h2>
                {barberoSel && (
                  <p className="text-gray-500 text-sm mt-0.5">{barberoSel.nombre} {barberoSel.apellido}</p>
                )}
              </div>
              <button
                onClick={activo ? desactivarDia : activarDia}
                disabled={guardando}
                className={`relative w-14 h-7 rounded-full transition-colors disabled:opacity-50 ${activo ? "bg-gold" : "bg-gray-700"}`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${activo ? "left-8" : "left-1"}`} />
              </button>
            </div>

            {!activo ? (
              <div className="text-center py-16">
                <Moon className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-500 text-sm">Este barbero no trabaja el {diaActual.nombre.toLowerCase()}</p>
                <p className="text-gray-600 text-xs mt-1">Activá el interruptor para asignarle un horario</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Horario laboral */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sun className="w-4 h-4 text-gold" />
                    <span className="text-sm font-semibold text-white">Horario laboral</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[11px] text-gray-500 mb-1 uppercase tracking-wide">Entrada</label>
                      <input
                        type="time"
                        value={hhmm(hActual.hora_inicio)}
                        onChange={(e) => cambiarCampo("hora_inicio", e.target.value)}
                        className="w-full bg-ink border border-line rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-gold [color-scheme:dark]"
                      />
                    </div>
                    <div className="w-4 h-px bg-line mt-5" />
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[11px] text-gray-500 mb-1 uppercase tracking-wide">Salida</label>
                      <input
                        type="time"
                        value={hhmm(hActual.hora_fin)}
                        onChange={(e) => cambiarCampo("hora_fin", e.target.value)}
                        className="w-full bg-ink border border-line rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-gold [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {/* Pausa */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Coffee className="w-4 h-4 text-gold" />
                    <span className="text-sm font-semibold text-white">Pausa / almuerzo</span>
                    <span className="text-[11px] text-gray-500">(opcional)</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[11px] text-gray-500 mb-1 uppercase tracking-wide">Desde</label>
                      <input
                        type="time"
                        value={hhmm(hActual.pausa_inicio)}
                        onChange={(e) => cambiarCampo("pausa_inicio", e.target.value)}
                        className="w-full bg-ink border border-line rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-gold [color-scheme:dark]"
                      />
                    </div>
                    <div className="w-4 h-px bg-line mt-5" />
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[11px] text-gray-500 mb-1 uppercase tracking-wide">Hasta</label>
                      <input
                        type="time"
                        value={hhmm(hActual.pausa_fin)}
                        onChange={(e) => cambiarCampo("pausa_fin", e.target.value)}
                        className="w-full bg-ink border border-line rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-gold [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-line">
                  <button
                    onClick={guardarDia}
                    disabled={guardando}
                    className={`inline-flex items-center gap-2 font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-50 ${
                      guardadoOk ? "bg-emerald-500/15 text-emerald-400" : "bg-gold text-ink hover:bg-gold-soft"
                    }`}
                  >
                    {guardadoOk ? <><Check className="w-4 h-4" /> Guardado</> : <><Clock className="w-4 h-4" /> {guardando ? "Guardando..." : "Guardar cambios"}</>}
                  </button>

                  {diasActivos.length > 0 && (
                    <button
                      onClick={() => { setDiasDestino([]); setModalReplicar(true); }}
                      className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2.5 bg-ink border border-line text-gray-300 hover:text-gold hover:border-gold/40 transition-colors"
                    >
                      <Copy className="w-4 h-4" /> Copiar a otros días
                    </button>
                  )}

                  <button
                    onClick={desactivarDia}
                    disabled={guardando}
                    className="inline-flex items-center gap-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50 ml-auto"
                  >
                    <Trash2 className="w-4 h-4" /> Quitar día
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: replicar horario a otros días */}
      {modalReplicar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setModalReplicar(false)}>
          <div className="bg-ink-card border border-line rounded-2xl w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h3 className="text-white font-semibold">Copiar horario de {diaActual.nombre}</h3>
              <button onClick={() => setModalReplicar(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-500 mb-4">
                Elegí a qué días copiar {hhmm(hActual?.hora_inicio)} - {hhmm(hActual?.hora_fin)} (y la pausa, si tiene).
              </p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {DIAS.filter((d) => d.num !== diaSel).map((dia) => (
                  <button
                    key={dia.num}
                    onClick={() => toggleDiaDestino(dia.num)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      diasDestino.includes(dia.num)
                        ? "bg-gold/10 border-gold text-gold"
                        : "bg-ink border-line text-gray-400 hover:text-white"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 ${diasDestino.includes(dia.num) ? "bg-gold border-gold" : "border-line"}`}>
                      {diasDestino.includes(dia.num) && <Check className="w-3 h-3 text-ink" />}
                    </span>
                    {dia.nombre}
                  </button>
                ))}
              </div>
              <button
                onClick={confirmarReplica}
                disabled={diasDestino.length === 0 || guardando}
                className="w-full bg-gold text-ink font-semibold rounded-xl py-3 hover:bg-gold-soft transition-colors disabled:opacity-40"
              >
                {guardando ? "Copiando..." : `Copiar a ${diasDestino.length || ""} día${diasDestino.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Horarios;