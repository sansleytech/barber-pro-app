import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import api from "../api/cliente";

function CategoriaForm() {
    const { id } = useParams();
    const editando = Boolean(id);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        nombre: "",
        color: "#D4AF37",
        orden: "",
    });
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!editando) return;
        const cargar = async () => {
            try {
                const res = await api.get(`/categorias`);
                const cat = res.data.find((c) => c.id_categoria === Number(id));
                if (cat) {
                    setForm({
                        nombre: cat.nombre || "",
                        color: cat.color || "#D4AF37",
                        orden: cat.orden ?? "",
                    });
                }
            } catch {
                setError("No se pudo cargar la categoría");
            }
        };
        cargar();
    }, [id, editando]);

    const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
    const aMayuscula = (v) => v.toUpperCase();
    const soloNumeros = (v) => v.replace(/[^0-9]/g, "");

    const enviar = async (e) => {
        e.preventDefault();
        setError("");
        setCargando(true);

        const datos = {
            nombre: form.nombre,
            color: form.color,
            icono: "package",
            orden: Number(form.orden || 0),
        };

        try {
            if (editando) {
                await api.put(`/categorias/${id}`, datos);
            } else {
                await api.post("/categorias", datos);
            }
            navigate("/categorias");
        } catch (err) {
            if (err.response?.data?.detail) {
                setError(
                    typeof err.response.data.detail === "string"
                        ? err.response.data.detail
                        : "Revisá los datos del formulario",
                );
            } else {
                setError("No se pudo guardar la categoría");
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
                onClick={() => navigate("/categorias")}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver a categorías
            </button>

            <h1 className="text-3xl font-bold text-white mb-1">
                {editando ? "Editar categoría" : "Nueva categoría"}
            </h1>
            <p className="text-gray-400 mb-6">
                {editando
                    ? "Modificá los datos de la categoría"
                    : "Completá los datos de la categoría"}
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
                            placeholder="Belleza, Cuidado del cabello, etc"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Orden</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={form.orden}
                            onChange={(e) => cambiar("orden", soloNumeros(e.target.value))}
                            className={inputClase}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Color</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={form.color}
                                onChange={(e) => cambiar("color", e.target.value)}
                                className="w-14 h-11 bg-ink border border-line rounded-lg cursor-pointer"
                            />
                            <input
                                type="text"
                                value={form.color}
                                onChange={(e) => cambiar("color", e.target.value)}
                                className={inputClase}
                                placeholder="#D4AF37"
                            />
                        </div>
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
                        onClick={() => navigate("/categorias")}
                        className="border border-line text-gray-300 hover:text-white hover:bg-ink-soft rounded-lg py-3 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CategoriaForm;
