import { useState, useEffect } from "react";
import { Trash2, Save, Coffee, Check } from "lucide-react";
import api from "../api/cliente";

const DIAS = [
  { num: 1, nombre: "Lunes" },
  { num: 2, nombre: "Martes" },
  { num: 3, nombre: "Miércoles" },
  { num: 4, nombre: "Jueves" },
  { num: 5, nombre: "Viernes" },
  { num: 6, nombre: "Sábado" },
  { num: 7, nombre: "Domingo" },
];

function Horarios() {
  const [barberos, setBarberos] = useState([]);
  const [idBarbero, setIdBarbero] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(null);
  const [guardadoOk, setGuardadoOk] = useState(null); // num de día guardado
  const [error, setError] = useState("");

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
      setGuardadoOk(null);
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

  const horarioDe = (numDia) =>
    horarios.find((h) => h.dia_semana === numDia) || null;

  const recargar = async () => {
    const res = await api.get(`/horarios/barbero/${idBarbero}`);
    setHorarios(res.data);
  };

  const activarDia = async (numDia) => {
    setGuardando(numDia);
    setError("");
    try {
      await api.post("/horarios", {
        id_barbero: idBarbero,
        dia_semana: numDia,
        hora_inicio: "09:00",
        hora_fin: "18:00",
        pausa_inicio: null,
        pausa_fin: null,
      });
      await recargar();
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo activar el día");
    } finally {
      setGuardando(null);
    }
  };

  const desactivarDia = async (idHorario, numDia) => {
    setGuardando(numDia);
    setError("");
    try {
      await api.delete(`/horarios/${idHorario}`);
      await recargar();
      setGuardadoOk((ok) => (ok === numDia ? null : ok));
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo desactivar el día");
    } finally {
      setGuardando(null);
    }
  };

  const cambiarCampo = (idHorario, campo, valor) => {
    setHorarios((prev) =>
      prev.map((h) =>
        h.id_horario === idHorario ? { ...h, [campo]: valor } : h,
      ),
    );
    // Al editar, ese día deja de estar "guardado"
    const horarioEditado = horarios.find((h) => h.id_horario === idHorario);
    if (horarioEditado) {
      setGuardadoOk((ok) => (ok === horarioEditado.dia_semana ? null : ok));
    }
  };

  const guardarDia = async (h, numDia) => {
    setGuardando(numDia);
    setError("");
    try {
      await api.put(`/horarios/${h.id_horario}`, {
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
        pausa_inicio: h.pausa_inicio || null,
        pausa_fin: h.pausa_fin || null,
      });
      await recargar();
      setGuardadoOk(numDia); // se queda en "Guardado" hasta que cambies algo
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo guardar el horario");
    } finally {
      setGuardando(null);
    }
  };

  const hhmm = (hora) => (hora ? hora.slice(0, 5) : "");

  const barberoSel = barberos.find((b) => b.id_barbero === idBarbero);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-1">
        Horarios de atención
      </h1>
      <p className="text-gray-400 mb-6">
        Configurá los días y horas que trabaja cada barbero
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Selector de barbero */}
      <div className="bg-ink-card border border-line rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {barberos.map((b) => {
            const activo = b.id_barbero === idBarbero;
            const iniciales =
              `${b.nombre?.[0] || ""}${b.apellido?.[0] || ""}`.toUpperCase();
            return (
              <button
                key={b.id_barbero}
                onClick={() => setIdBarbero(b.id_barbero)}
                className={`inline-flex items-center gap-2 rounded-full pl-1.5 pr-4 py-1.5 border transition-colors ${
                  activo
                    ? "bg-gold/10 border-gold text-gold"
                    : "bg-ink border-line text-gray-300 hover:text-white"
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    activo ? "bg-gold text-ink" : "bg-ink-soft text-gray-400"
                  }`}
                >
                  {iniciales}
                </span>
                {b.nombre} {b.apellido}
              </button>
            );
          })}
        </div>
      </div>

      {barberoSel && (
        <>
          <h2 className="text-xl font-bold text-white mb-1">
            Horarios de {barberoSel.nombre} {barberoSel.apellido}
          </h2>
          <p className="text-gray-400 text-sm mb-5">
            Activá los días que trabaja y definí horarios y pausas
          </p>
        </>
      )}

      {cargando ? (
        <div className="text-center py-16 text-gray-500">
          Cargando horarios...
        </div>
      ) : (
        <div className="space-y-3">
          {DIAS.map((dia) => {
            const h = horarioDe(dia.num);
            const activo = Boolean(h);
            const ocupado = guardando === dia.num;
            const recienGuardado = guardadoOk === dia.num;

            return (
              <div
                key={dia.num}
                className={`rounded-2xl border p-5 transition-colors ${
                  activo
                    ? "bg-ink-card border-gold/40"
                    : "bg-ink-card/50 border-line"
                }`}
              >
                <div className="flex flex-wrap items-center gap-4">
                  <span
                    className={`font-semibold w-24 ${activo ? "text-gold" : "text-gray-500"}`}
                  >
                    {dia.nombre}
                  </span>

                  <button
                    onClick={() =>
                      activo
                        ? desactivarDia(h.id_horario, dia.num)
                        : activarDia(dia.num)
                    }
                    disabled={ocupado}
                    className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                      activo ? "bg-gold" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                        activo ? "left-6" : "left-0.5"
                      }`}
                    />
                  </button>

                  {activo ? (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={hhmm(h.hora_inicio)}
                          onChange={(e) =>
                            cambiarCampo(
                              h.id_horario,
                              "hora_inicio",
                              e.target.value,
                            )
                          }
                          className="bg-ink border border-line rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold"
                        />
                        <span className="text-gray-500 text-sm">a</span>
                        <input
                          type="time"
                          value={hhmm(h.hora_fin)}
                          onChange={(e) =>
                            cambiarCampo(
                              h.id_horario,
                              "hora_fin",
                              e.target.value,
                            )
                          }
                          className="bg-ink border border-line rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold"
                        />
                      </div>
                      <span className="text-xs font-medium text-emerald-400 uppercase">
                        Activo
                      </span>

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={() => guardarDia(h, dia.num)}
                          disabled={ocupado}
                          className={`inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-2 transition-colors disabled:opacity-50 ${
                            recienGuardado
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-gold text-ink hover:bg-gold-soft"
                          }`}
                        >
                          {recienGuardado ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Guardado
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              {ocupado ? "..." : "Guardar"}
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => desactivarDia(h.id_horario, dia.num)}
                          disabled={ocupado}
                          className="inline-flex items-center gap-1.5 text-red-400 hover:bg-red-500/10 text-sm rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Quitar
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      Sin trabajar
                    </span>
                  )}
                </div>

                {activo && (
                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-line/60">
                    <span className="inline-flex items-center gap-1.5 text-purple-400 text-sm font-medium w-24">
                      <Coffee className="w-4 h-4" />
                      Pausa
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={hhmm(h.pausa_inicio)}
                        onChange={(e) =>
                          cambiarCampo(
                            h.id_horario,
                            "pausa_inicio",
                            e.target.value,
                          )
                        }
                        className="bg-ink border border-line rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold"
                      />
                      <span className="text-gray-500 text-sm">a</span>
                      <input
                        type="time"
                        value={hhmm(h.pausa_fin)}
                        onChange={(e) =>
                          cambiarCampo(
                            h.id_horario,
                            "pausa_fin",
                            e.target.value,
                          )
                        }
                        className="bg-ink border border-line rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold"
                      />
                    </div>
                    <span className="text-xs text-purple-400/70">
                      Almuerzo / descanso (opcional)
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Horarios;
