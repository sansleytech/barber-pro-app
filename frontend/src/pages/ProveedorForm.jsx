import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import api from "../api/cliente";

function ProveedorForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
    notas: "",
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editando) return;
    const cargar = async () => {
      try {
        const res = await api.get("/proveedores");
        const prov = res.data.find((p) => p.id_proveedor === Number(id));
        if (prov) {
          setForm({
            nombre: prov.nombre || "",
            telefono: prov.telefono || "",
            email: prov.email || "",
            direccion: prov.direccion || "",
            notas: prov.notas || "",
          });
        }
      } catch {
        setError("No se pudo cargar el proveedor");
      }
    };
    cargar();
  }, [id, editando]);

  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const soloNumeros = (v) => v.replace(/[^0-9]/g, "");
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
        await api.put(`/proveedores/${id}`, datos);
      } else {
        await api.post("/proveedores", datos);
      }
      navigate("/proveedores");
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(
          typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : "Revisá los datos del formulario",
        );
      } else {
        setError("No se pudo guardar el proveedor");
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
        onClick={() => navigate("/proveedores")}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a proveedores
      </button>

      <h1 className="text-3xl font-bold text-white mb-1">
        {editando ? "Editar proveedor" : "Nuevo proveedor"}
      </h1>
      <p className="text-gray-400 mb-6">
        {editando
          ? "Modificá los datos del proveedor"
          : "Completá los datos del proveedor"}
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
              onChange={(e) => cambiar("nombre", aMayuscula(e.target.value))}
              className={inputClase}
              placeholder="NOMBRE DEL PROVEEDOR"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Teléfono
            </label>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => cambiar("telefono", soloNumeros(e.target.value))}
              className={inputClase}
              placeholder="Teléfono"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => cambiar("email", aMayuscula(e.target.value))}
              className={inputClase}
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Dirección
            </label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => cambiar("direccion", aMayuscula(e.target.value))}
              className={inputClase}
              placeholder="Dirección"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Notas</label>
          <textarea
            value={form.notas}
            onChange={(e) => cambiar("notas", aMayuscula(e.target.value))}
            rows={4}
            className={inputClase}
            placeholder="Notas adicionales (opcional)"
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
            onClick={() => navigate("/proveedores")}
            className="border border-line text-gray-300 hover:text-white hover:bg-ink-soft rounded-lg py-3 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProveedorForm;
