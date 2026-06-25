import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import api from "../api/cliente";

function ProductoForm() {
    const { id } = useParams();
    const editando = Boolean(id);
    const navigate = useNavigate();

    const [categorias, setCategorias] = useState([]);
    const [form, setForm] = useState({
        nombre: "",
        descripcion: "",
        marca: "",
        id_categoria: "",
        costo_actual: "",
        precio_venta: "",
        stock_actual: "",
        stock_minimo: "",
        stock_maximo: "",
        codigo_barras: "",
        foto: "",
    });
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Cargar categorías para el selector
        const cargarCategorias = async () => {
            try {
                const res = await api.get("/categorias");
                setCategorias(res.data);
            } catch {
                // si fallan las categorías, el selector queda vacío pero el form funciona
            }
        };
        cargarCategorias();

        if (!editando) return;
        const cargarProducto = async () => {
            try {
                const res = await api.get(`/productos/${id}`);
                const p = res.data;
                setForm({
                    nombre: p.nombre || "",
                    descripcion: p.descripcion || "",
                    marca: p.marca || "",
                    id_categoria: p.id_categoria ?? "",
                    costo_actual: p.costo_actual ?? "",
                    precio_venta: p.precio_venta ?? "",
                    stock_actual: p.stock_actual ?? "",
                    stock_minimo: p.stock_minimo ?? "",
                    stock_maximo: p.stock_maximo ?? "",
                    codigo_barras: p.codigo_barras || "",
                    foto: p.foto || "",
                });
            } catch {
                setError("No se pudo cargar el producto");
            }
        };
        cargarProducto();
    }, [id, editando]);

    const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

    const soloNumeros = (v) => v.replace(/[^0-9]/g, "");
    const aMayuscula = (v) => v.toUpperCase();

    const enviar = async (e) => {
        e.preventDefault();
        setError("");
        setCargando(true);

        const datos = {
            nombre: form.nombre,
            descripcion: form.descripcion || null,
            marca: form.marca || null,
            id_categoria: form.id_categoria ? Number(form.id_categoria) : null,
            costo_actual: Number(form.costo_actual || 0),
            precio_venta: Number(form.precio_venta || 0),
            stock_actual: Number(form.stock_actual || 0),
            stock_minimo: Number(form.stock_minimo || 0),
            stock_maximo: Number(form.stock_maximo || 0),
            codigo_barras: form.codigo_barras || null,
            foto: form.foto || null,
        };

        try {
            if (editando) {
                await api.put(`/productos/${id}`, datos);
            } else {
                await api.post("/productos", datos);
            }
            navigate("/productos");
        } catch (err) {
            if (err.response?.data?.detail) {
                setError(
                    typeof err.response.data.detail === "string"
                        ? err.response.data.detail
                        : "Revisá los datos del formulario"
                );
            } else {
                setError("No se pudo guardar el producto");
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
                onClick={() => navigate("/productos")}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver a productos
            </button>

            <h1 className="text-3xl font-bold text-white mb-1">
                {editando ? "Editar producto" : "Nuevo producto"}
            </h1>
            <p className="text-gray-400 mb-6">
                {editando ? "Modificá los datos del producto" : "Completá los datos del producto"}
            </p>

            <form onSubmit={enviar} className="bg-ink-card border border-line rounded-2xl p-6 md:p-8 space-y-5">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Nombre *</label>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={(e) => cambiar("nombre", aMayuscula(e.target.value))}
                            className={inputClase}
                            placeholder="NOMBRE DEL PRODUCTO"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Marca</label>
                        <input
                            type="text"
                            value={form.marca}
                            onChange={(e) => cambiar("marca", aMayuscula(e.target.value))}
                            className={inputClase}
                            placeholder="MARCA"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Categoría</label>
                        <select
                            value={form.id_categoria}
                            onChange={(e) => cambiar("id_categoria", e.target.value)}
                            className={inputClase}
                        >
                            <option value="">Sin categoría</option>
                            {categorias.map((c) => (
                                <option key={c.id_categoria} value={c.id_categoria}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Código de barras</label>
                        <input
                            type="text"
                            value={form.codigo_barras}
                            onChange={(e) => cambiar("codigo_barras", e.target.value)}
                            className={inputClase}
                            placeholder="Código de barras"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Costo *</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={form.costo_actual}
                            onChange={(e) => cambiar("costo_actual", soloNumeros(e.target.value))}
                            className={inputClase}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Precio de venta *</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={form.precio_venta}
                            onChange={(e) => cambiar("precio_venta", soloNumeros(e.target.value))}
                            className={inputClase}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Stock actual</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={form.stock_actual}
                            onChange={(e) => cambiar("stock_actual", soloNumeros(e.target.value))}
                            className={inputClase}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Stock mínimo</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={form.stock_minimo}
                            onChange={(e) => cambiar("stock_minimo", soloNumeros(e.target.value))}
                            className={inputClase}
                            placeholder="5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Stock máximo</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={form.stock_maximo}
                            onChange={(e) => cambiar("stock_maximo", soloNumeros(e.target.value))}
                            className={inputClase}
                            placeholder="50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Foto (URL)</label>
                        <input
                            type="text"
                            value={form.foto}
                            onChange={(e) => cambiar("foto", e.target.value)}
                            className={inputClase}
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-gray-300 mb-1.5">Descripción</label>
                    <textarea
                        value={form.descripcion}
                        onChange={(e) => cambiar("descripcion", e.target.value)}
                        rows={4}
                        className={inputClase}
                        placeholder="Descripción del producto (opcional)"
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
                        onClick={() => navigate("/productos")}
                        className="border border-line text-gray-300 hover:text-white hover:bg-ink-soft rounded-lg py-3 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ProductoForm;