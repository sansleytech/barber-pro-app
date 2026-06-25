import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import api from "../api/cliente";

function UsuarioForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();

  const [barberos, setBarberos] = useState([]);
  const [form, setForm] = useState({
    nombre_usuario: "",
    password: "",
    rol: "barbero",
    id_barbero: "",
    pregunta_seguridad: "",
    respuesta_seguridad: "",
  });
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarBarberos = async () => {
      try {
        const res = await api.get("/barberos");
        setBarberos(res.data);
      } catch {
        // si falla, el selector queda vacío
      }
    };
    cargarBarberos();

    // Si estamos editando, traemos los datos del usuario
    if (!editando) return;
    const cargarUsuario = async () => {
      try {
        const res = await api.get("/usuarios");
        const u = res.data.find((x) => x.id_usuario === Number(id));
        if (u) {
          setForm({
            nombre_usuario: u.nombre_usuario || "",
            password: "",
            rol: u.rol || "barbero",
            id_barbero: u.id_barbero ?? "",
            pregunta_seguridad: "",
            respuesta_seguridad: "",
          });
        }
      } catch {
        setError("No se pudo cargar el usuario");
      }
    };
    cargarUsuario();
  }, [id, editando]);

  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const enviar = async (e) => {
    e.preventDefault();
    setError("");

    // Al crear, la contraseña es obligatoria (mín 6). Al editar, es opcional.
    if (!editando && form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (editando && form.password && form.password.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargando(true);

    try {
      if (editando) {
        // En edición, solo mandamos lo editable (no el nombre de usuario)
        const datos = {
          rol: form.rol,
          id_barbero: form.id_barbero ? Number(form.id_barbero) : null,
        };
        if (form.password) datos.password = form.password;
        if (form.pregunta_seguridad) datos.pregunta_seguridad = form.pregunta_seguridad;
        if (form.respuesta_seguridad) datos.respuesta_seguridad = form.respuesta_seguridad;
        await api.put(`/usuarios/${id}`, datos);
      } else {
        const datos = {
          nombre_usuario: form.nombre_usuario,
          password: form.password,
          rol: form.rol,
          id_barbero: form.id_barbero ? Number(form.id_barbero) : null,
          pregunta_seguridad: form.pregunta_seguridad || null,
          respuesta_seguridad: form.respuesta_seguridad || null,
        };
        await api.post("/usuarios", datos);
      }
      navigate("/usuarios");
    } catch (err) {
      setError(
        err.response?.data?.detail && typeof err.response.data.detail === "string"
          ? err.response.data.detail
          : "No se pudo guardar el usuario"
      );
    } finally {
      setCargando(false);
    }
  };

  const inputClase =
    "w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors";

  return (
    <div className="w-full">
      <button
        onClick={() => navigate("/usuarios")}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a usuarios
      </button>

      <h1 className="text-3xl font-bold text-white mb-1">
        {editando ? "Editar usuario" : "Nuevo usuario"}
      </h1>
      <p className="text-gray-400 mb-6">
        {editando ? "Modificá el acceso del usuario" : "Creá un acceso al sistema"}
      </p>

      <form onSubmit={enviar} className="bg-ink-card border border-line rounded-2xl p-6 md:p-8 space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Nombre de usuario *</label>
            <input
              type="text"
              value={form.nombre_usuario}
              onChange={(e) => cambiar("nombre_usuario", e.target.value.toLowerCase().trim())}
              className={inputClase + (editando ? " opacity-60 cursor-not-allowed" : "")}
              placeholder="nombre.usuario"
              required
              disabled={editando}
            />
            {editando && (
              <p className="text-xs text-gray-600 mt-1">El nombre de usuario no se puede cambiar</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              {editando ? "Nueva contraseña" : "Contraseña *"}
            </label>
            <div className="relative">
              <input
                type={verPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => cambiar("password", e.target.value)}
                className={inputClase + " pr-12"}
                placeholder={editando ? "Dejá vacío para no cambiarla" : "Mínimo 6 caracteres"}
                required={!editando}
              />
              <button
                type="button"
                onClick={() => setVerPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold transition-colors"
              >
                {verPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Rol *</label>
            <select
              value={form.rol}
              onChange={(e) => cambiar("rol", e.target.value)}
              className={inputClase}
            >
              <option value="administrador">Administrador</option>
              <option value="recepcionista">Recepcionista</option>
              <option value="barbero">Barbero</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Vincular a barbero <span className="text-gray-600">(opcional)</span>
            </label>
            <select
              value={form.id_barbero}
              onChange={(e) => cambiar("id_barbero", e.target.value)}
              className={inputClase}
            >
              <option value="">Sin vincular</option>
              {barberos.map((b) => (
                <option key={b.id_barbero} value={b.id_barbero}>
                  {b.nombre} {b.apellido}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Pregunta de seguridad <span className="text-gray-600">(opcional)</span>
            </label>
            <input
              type="text"
              value={form.pregunta_seguridad}
              onChange={(e) => cambiar("pregunta_seguridad", e.target.value)}
              className={inputClase}
              placeholder={editando ? "Dejá vacío para no cambiar" : "Ej: ¿Tu primera mascota?"}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Respuesta <span className="text-gray-600">(opcional)</span>
            </label>
            <input
              type="text"
              value={form.respuesta_seguridad}
              onChange={(e) => cambiar("respuesta_seguridad", e.target.value)}
              className={inputClase}
              placeholder="Respuesta"
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
            {cargando ? "Guardando..." : editando ? "Guardar cambios" : "Crear usuario"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/usuarios")}
            className="border border-line text-gray-300 hover:text-white hover:bg-ink-soft rounded-lg py-3 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default UsuarioForm;