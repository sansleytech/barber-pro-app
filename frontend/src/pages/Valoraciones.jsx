import { useState, useEffect } from "react";
import { Plus, Star, X, Save, Award, MessageSquare } from "lucide-react";
import api from "../api/cliente";

function Valoraciones() {
  const [valoraciones, setValoraciones] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [panelAbierto, setPanelAbierto] = useState(false);

  const [form, setForm] = useState({
    id_turno: "",
    estrellas: 0,
    comentario: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    try {
      const [resV, resT, resC, resB] = await Promise.all([
        api.get("/valoraciones"),
        api.get("/turnos"),
        api.get("/clientes"),
        api.get("/barberos"),
      ]);
      setValoraciones(resV.data);
      setTurnos(resT.data);
      setClientes(resC.data);
      setBarberos(resB.data);
    } catch (err) {
      setError("No se pudieron cargar las valoraciones");
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

  const formatoFecha = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Turnos completados que aún NO tienen valoración (para el formulario)
  const turnosValorados = new Set(valoraciones.map((v) => v.id_turno));
  const turnosSinValorar = turnos.filter(
    (t) => t.estado === "completado" && !turnosValorados.has(t.id_turno),
  );

  // Resumen general
  const cantidad = valoraciones.length;
  const promedioGeneral =
    cantidad > 0
      ? (
          valoraciones.reduce((acc, v) => acc + v.estrellas, 0) / cantidad
        ).toFixed(1)
      : "0.0";

  // Ranking por barbero (promedio + cantidad)
  const rankingBarberos = barberos
    .map((b) => {
      const suyas = valoraciones.filter((v) => v.id_barbero === b.id_barbero);
      const prom =
        suyas.length > 0
          ? suyas.reduce((acc, v) => acc + v.estrellas, 0) / suyas.length
          : 0;
      return {
        id: b.id_barbero,
        nombre: `${b.nombre} ${b.apellido}`,
        promedio: prom,
        cantidad: suyas.length,
      };
    })
    .filter((b) => b.cantidad > 0)
    .sort((a, b) => b.promedio - a.promedio);

  // Estrellas para mostrar (no clickeable)
  const Estrellas = ({ valor, size = "w-4 h-4" }) => (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= valor ? "text-gold fill-gold" : "text-gray-700"}`}
        />
      ))}
    </span>
  );

  const abrirPanel = () => {
    setForm({ id_turno: "", estrellas: 0, comentario: "" });
    setErrorForm("");
    setPanelAbierto(true);
  };

  const registrar = async (e) => {
    e.preventDefault();
    setErrorForm("");
    if (!form.id_turno) {
      setErrorForm("Elegí un turno");
      return;
    }
    if (form.estrellas < 1) {
      setErrorForm("Asigná al menos una estrella");
      return;
    }
    setGuardando(true);
    try {
      await api.post("/valoraciones", {
        id_turno: Number(form.id_turno),
        estrellas: form.estrellas,
        comentario: form.comentario || null,
      });
      setPanelAbierto(false);
      cargarDatos();
    } catch (err) {
      setErrorForm(
        err.response?.data?.detail &&
          typeof err.response.data.detail === "string"
          ? err.response.data.detail
          : "No se pudo registrar la valoración",
      );
    } finally {
      setGuardando(false);
    }
  };

  // Datos del turno elegido en el form (para mostrar de quién es)
  const turnoElegido = turnos.find((t) => t.id_turno === Number(form.id_turno));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Valoraciones</h1>
          <p className="text-gray-400">
            Reseñas y calificaciones de los servicios
          </p>
        </div>
        <button
          onClick={abrirPanel}
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva valoración
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="text-center py-16 text-gray-500">
          Cargando valoraciones...
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-ink-card border border-gold/30 rounded-2xl p-5">
              <div className="text-xs font-medium text-gray-400 mb-2">
                PROMEDIO GENERAL
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gold">
                  {promedioGeneral}
                </span>
                <Estrellas valor={Math.round(promedioGeneral)} size="w-5 h-5" />
              </div>
            </div>
            <div className="bg-ink-card border border-line rounded-2xl p-5">
              <div className="text-xs font-medium text-gray-400 mb-2">
                TOTAL RESEÑAS
              </div>
              <div className="text-3xl font-bold text-white">{cantidad}</div>
            </div>
            <div className="bg-ink-card border border-line rounded-2xl p-5">
              <div className="text-xs font-medium text-gray-400 mb-2">
                SIN VALORAR
              </div>
              <div className="text-3xl font-bold text-white">
                {turnosSinValorar.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                turnos completados
              </div>
            </div>
          </div>

          {/* Ranking de barberos */}
          {rankingBarberos.length > 0 && (
            <div className="bg-ink-card border border-line rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-gold" />
                <h2 className="text-white font-semibold">
                  Ranking de barberos
                </h2>
              </div>
              <div className="space-y-3">
                {rankingBarberos.map((b, i) => (
                  <div key={b.id} className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                        i === 0 ? "bg-gold text-ink" : "bg-ink text-gray-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-white font-medium flex-1">
                      {b.nombre}
                    </span>
                    <Estrellas valor={Math.round(b.promedio)} />
                    <span className="text-gold font-semibold w-10 text-right">
                      {b.promedio.toFixed(1)}
                    </span>
                    <span className="text-gray-500 text-xs w-16 text-right">
                      {b.cantidad} reseña{b.cantidad !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de valoraciones */}
          {valoraciones.length === 0 ? (
            <div className="bg-ink-card border border-line rounded-2xl p-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">Todavía no hay valoraciones</p>
              <p className="text-gray-600 text-sm mt-1">
                Registrá la primera con "Nueva valoración"
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {valoraciones.map((v) => (
                <div
                  key={v.id_valoracion}
                  className="bg-ink-card border border-line rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Estrellas valor={v.estrellas} />
                        <span className="text-white font-medium">
                          {nombreBarbero(v.id_barbero)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Cliente: {nombreCliente(v.id_cliente)} ·{" "}
                        {formatoFecha(v.fecha_creacion)}
                      </div>
                      {v.comentario && (
                        <p className="text-gray-300 text-sm">
                          "{v.comentario}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Panel lateral de nueva valoración */}
      {panelAbierto && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setPanelAbierto(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-ink-card border-l border-line z-50 overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-line">
              <h2 className="text-xl font-bold text-white">Nueva valoración</h2>
              <button
                onClick={() => setPanelAbierto(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-ink rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={registrar} className="p-5 space-y-5">
              {errorForm && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                  {errorForm}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Turno a valorar *
                </label>
                {turnosSinValorar.length === 0 ? (
                  <p className="text-gray-500 text-sm bg-ink border border-line rounded-lg px-4 py-3">
                    No hay turnos completados sin valorar
                  </p>
                ) : (
                  <select
                    value={form.id_turno}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, id_turno: e.target.value }))
                    }
                    className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold"
                    required
                  >
                    <option value="">Seleccionar turno...</option>
                    {turnosSinValorar.map((t) => (
                      <option key={t.id_turno} value={t.id_turno}>
                        {t.fecha} · {nombreCliente(t.id_cliente)} ·{" "}
                        {nombreBarbero(t.id_barbero)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {turnoElegido && (
                <div className="bg-ink rounded-lg border border-line px-4 py-3 text-sm">
                  <div className="text-gray-400">
                    Barbero:{" "}
                    <span className="text-white">
                      {nombreBarbero(turnoElegido.id_barbero)}
                    </span>
                  </div>
                  <div className="text-gray-400">
                    Cliente:{" "}
                    <span className="text-white">
                      {nombreCliente(turnoElegido.id_cliente)}
                    </span>
                  </div>
                </div>
              )}

              {/* Estrellas clickeables */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Calificación *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, estrellas: n }))}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${n <= form.estrellas ? "text-gold fill-gold" : "text-gray-700"}`}
                      />
                    </button>
                  ))}
                  {form.estrellas > 0 && (
                    <span className="text-gold font-semibold ml-2">
                      {form.estrellas}/5
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Comentario
                </label>
                <textarea
                  value={form.comentario}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, comentario: e.target.value }))
                  }
                  rows={4}
                  placeholder="¿Cómo estuvo el servicio? (opcional)"
                  className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-line">
                <button
                  type="submit"
                  disabled={guardando || turnosSinValorar.length === 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gold text-ink font-semibold rounded-lg py-3 hover:bg-gold-soft transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {guardando ? "Guardando..." : "Guardar valoración"}
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

export default Valoraciones;
