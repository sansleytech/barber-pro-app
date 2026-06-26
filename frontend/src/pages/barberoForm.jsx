import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import api from "../api/cliente";

const BarberoForm = () => {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    telefono: "",
    email: "",
    especialidad: "",
    fecha_ingreso: "",
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editando) return;
    const cargar = async () => {
      try {
        const res = await api.get(`/barberos/${id}`);
        const b = res.data;
        setForm({
          nombre: b.nombre || "",
          apellido: b.apellido || "",
          fecha_nacimiento: b.fecha_nacimiento || "",
          telefono: b.telefono || "",
          email: b.email || "",
          especialidad: b.especialidad || "",
          fecha_ingreso: b.fecha_ingreso || "",
        });
      } catch {
        setError("No se pudo cargar el barbero");
      }
    };
    cargar();
  }, [id, editando]);

  const cambiar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
  };

  // Filtros

  const soloNumeros = (v) => v.replace(/[^0-9]/g, "");
  const soloLetras = (v) =>
    v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "").toUpperCase();
  const aMayuscula = (v) => v.toUpperCase();

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    const datos = { ...form };
    Object.keys(datos).forEach((k) => {
      if (datos[k] === "") datos[k] = null;
    });

    try {
      if (editando) {
        await api.put(`/barberos/${id}`, datos);
      } else {
        await api.post("/barberos", datos);
      }
      navigate("/barberos");
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(
          typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : "Revisá los datos del formulario",
        );
      } else {
        setError("No se pudo guardar el barbero");
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
        onClick={() => navigate("/barberos")}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a barberos
      </button>

      <h1 className="text-3xl font-bold text-white mb-1">
        {editando ? "Editar barbero" : "Nuevo barbero"}
      </h1>
      <p className="text-gray-400 mb-6">
        {editando
          ? "Modificá los datos del barbero"
          : "Completá los datos del barbero"}
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
              Nombre *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => cambiar("nombre", soloLetras(e.target.value))}
              className={inputClase}
              placeholder="Nombre del barbero"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Apellido *
            </label>
            <input
              type="text"
              value={form.apellido}
              onChange={(e) => cambiar("apellido", soloLetras(e.target.value))}
              className={inputClase}
              placeholder="Apellido del barbero"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Teléfono *
            </label>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => cambiar("telefono", soloNumeros(e.target.value))}
              className={inputClase}
              placeholder="Teléfono"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Correo electrónico *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => cambiar("email", aMayuscula(e.target.value))}
              className={inputClase}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Especialidad
            </label>
            <input
              type="text"
              value={form.especialidad}
              onChange={(e) =>
                cambiar("especialidad", aMayuscula(e.target.value))
              }
              className={inputClase}
              placeholder="Ej: CORTES CLÁSICOS, BARBA..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Fecha de nacimiento *
            </label>
            <input
              type="date"
              value={form.fecha_nacimiento}
              onChange={(e) => cambiar("fecha_nacimiento", e.target.value)}
              className={inputClase}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Fecha de ingreso *
            </label>
            <input
              type="date"
              value={form.fecha_ingreso}
              onChange={(e) => cambiar("fecha_ingreso", e.target.value)}
              className={inputClase}
              required
            />
          </div>
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
            onClick={() => navigate("/barberos")}
            className="border border-line text-gray-300 hover:text-white hover:bg-ink-soft rounded-lg py-3 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default BarberoForm;
