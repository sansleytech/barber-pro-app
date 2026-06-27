import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import api from "../api/cliente";

function ServicioForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    duracion_minutos: "",
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editando) return;
    const cargar = async () => {
      try {
        const res = await api.get(`/servicios/${id}`);
        const s = res.data;
        setForm({
          nombre: s.nombre || "",
          descripcion: s.descripcion || "",
          precio: s.precio ?? "",
          duracion_minutos: s.duracion_minutos ?? "",
        });
      } catch {
        setError("No se pudo cargar el servicio");
      }
    };
    cargar();
  }, [id, editando]);

  const cambiar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
  };

  const soloNumeros = (v) => v.replace(/[^0-9]/g, "");
  const aMayuscula = (v) => v.toUpperCase();

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    // El backend espera precio y duración como números
    const datos = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      precio: Number(form.precio),
      duracion_minutos: Number(form.duracion_minutos),
    };

    try {
      if (editando) {
        await api.put(`/servicios/${id}`, datos);
      } else {
        await api.post("/servicios", datos);
      }
      navigate("/servicios");
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(
          typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : "Revisá los datos del formulario",
        );
      } else {
        setError("No se pudo guardar el servicio");
      }
    } finally {
      setCargando(false);
    }
  };

  const inputClase =
    "w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors";

  return (
    <div className="w-full">
      <button
        onClick={() => navigate("/servicios")}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a servicios
      </button>

      <h1 className="text-3xl font-bold text-white mb-1">
        {editando ? "Editar servicio" : "Nuevo servicio"}
      </h1>
      <p className="text-gray-400 mb-6">
        {editando
          ? "Modificá los datos del servicio"
          : "Completá los datos del servicio"}
      </p>

      <form
        onSubmit={enviar}
        className="bg-ink-card border border-line rounded-2xl p-6 md:p-8 space-y-5"
      >
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Nombre del servicio *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => cambiar("nombre", aMayuscula(e.target.value))}
              className={inputClase}
              placeholder="Corte clásico, Barbas, tintes, etc "
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Precio *
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.precio}
              onChange={(e) => cambiar("precio", soloNumeros(e.target.value))}
              className={inputClase}
              placeholder="Introduce el precio del servicio"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Duración (minutos) *
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.duracion_minutos}
              onChange={(e) =>
                cambiar("duracion_minutos", soloNumeros(e.target.value))
              }
              className={inputClase}
              placeholder="Introduce en número la cantidad de tiempo"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">
            Descripción
          </label>
          <textarea
            value={form.descripcion}
            onChange={(e) => cambiar("descripcion", aMayuscula(e.target.value))}
            rows={4}
            className={inputClase}
            placeholder="Descripción del servicio (opcional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-line pt-5">
          <button
            type="submit"
            disabled={cargando}
            className="inline-flex items-center justify-center gap-2 bg-gold text-ink font-semibold rounded-lg py-3 hover:bg-gold-soft transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {cargando ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/servicios")}
            className="border border-line text-gray-300 hover:text-white hover:bg-ink-soft rounded-lg py-3 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default ServicioForm;
