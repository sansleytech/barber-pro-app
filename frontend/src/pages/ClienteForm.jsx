import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import api from "../api/cliente";

function ClienteForm() {
    const { id } = useParams();
    const editando = Boolean(id);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        tipo_documento: "",
        documento: "",
        primer_nombre: "",
        segundo_nombre: "",
        apellidos: "",
        fecha_nacimiento: "",
        genero: "",
        telefono: "",
        direccion: "",
        notas: "",
        foto: "",
        es_vip: false,
    });

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    // Si estamos editando, carga los datos del cliente

    useEffect(() => {
        if (!editando) return;
        const cargar = async () => {
            try {
                const res = await api.get(`/clientes/${id}`);
                const c = res.data;
                setForm({
                    tipo_documento: c.tipo_documento || "",
                    documento: c.documento || "",
                    primer_nombre: c.primer_nombre || "",
                    segundo_nombre: c.segundo_nombre || "",
                    apellidos: c.apellidos || "",
                    fecha_nacimiento: c.fecha_nacimiento || "",
                    genero: c.genero || "",
                    email: c.email || "",
                    telefono: c.telefono || "",
                    direccion: c.direccion || "",
                    notas: c.notas || "",
                    foto: c.foto || "",
                    es_vip: c.es_vip || false,
                });
            } catch {
                setError("No se pudo cargar el cliente");
            }
        };
        cargar();
    }, [id, editando]);

    const cambiar = (campo, valor) => {
        setForm((f) => ({ ...f, [campo]: valor }));
    };

    const enviar = async (e) => {
        e.preventDefault();
        setError("");
        setCargando(true);

        //Limpiamos campos vacios opcionales (Los mandamos como null)
        const datos = { ...form };
        Object.keys(datos).forEach((k) => {
            if (datos[k] === "") datos[k] = null;
        });

        try {
            if (editando) {
                await api.put(`/clientes/${id}`, datos);
            } else {
                await api.post("/clientes", datos);
            }
            navigate("/clientes");
        } catch (err) {
            if (err.response?.data?.detail) {
                setError(
                    typeof err.response.data.detail === "string"
                        ? err.response.data.detail
                        : "Revisá los datos del formulario",
                );
            } else {
                setError("No se pudo guardar el cliente");
            }
        } finally {
            setCargando(false);
        }
    };

    const inputClase =
        "w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors";
    // Filtros para los campos
    const soloNumeros = (valor) => valor.replace(/[^0-9]/g, "");
    const soloLetras = (valor) => valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "").toUpperCase();
    const aMayuscula = (valor) => valor.toUpperCase();

    return (
        <div className="w-max-w-5xl mx-auto">
            <button
                onClick={() => navigate("/clientes")}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver a clientes
            </button>

            <h1 className="text-3xl font-bold text-white mb-1">
                {editando ? "Editar" : "Nuevo cliente"}
            </h1>

            <p className="text-gray-400 mb-6">
                {editando
                    ? "Modifica los datos del cliente"
                    : "Completá los datos del cliente"}
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
                        <label className="block text-sm text-gray-300 mb-1.5">Tipo de documento</label>
                        <select
                            value={form.tipo_documento}
                            onChange={(e) => cambiar("tipo_documento", e.target.value)}
                            className={inputClase}
                        >
                            <option value="">Selecciona tipo de documento</option>
                            <option value="CC">Cédula (CC)</option>
                            <option value="TI">Tarjeta de identidad (TI)</option>
                            <option value="CE">Cédula de extranjería (CE)</option>
                            <option value="PASAPORTE">Pasaporte</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Documento</label>
                        <input
                            type="text"
                            value={form.documento}
                            onChange={(e) => cambiar("documento", soloNumeros(e.target.value))}
                            className={inputClase}
                            placeholder="Número de documento"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Primer nombre *</label>
                        <input
                            type="text"
                            value={form.primer_nombre}
                            onChange={(e) => cambiar("primer_nombre", soloLetras(e.target.value))}
                            className={inputClase}
                            placeholder="Introduce tu primer nombre"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Segundo nombre</label>
                        <input
                            type="text"
                            value={form.segundo_nombre}
                            onChange={(e) => cambiar("segundo_nombre", soloLetras(e.target.value))}
                            className={inputClase}
                            placeholder="Introduce tu segundo nombre"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Apellidos *</label>
                        <input
                            type="text"
                            value={form.apellidos}
                            onChange={(e) => cambiar("apellidos", soloLetras(e.target.value))}
                            className={inputClase}
                            placeholder="Introduce tus apellidos"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Teléfono *</label>
                        <input
                            type="text"
                            value={form.telefono}
                            onChange={(e) => cambiar("telefono", soloNumeros(e.target.value))}
                            maxLength={10}
                            minLength={7}
                            className={inputClase}
                            placeholder="Introduce tu teléfono"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Fecha de nacimiento *</label>
                        <input
                            type="date"
                            value={form.fecha_nacimiento}
                            onChange={(e) => cambiar("fecha_nacimiento", e.target.value)}
                            className={inputClase}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Género</label>
                        <select
                            value={form.genero}
                            onChange={(e) => cambiar("genero", e.target.value)}
                            className={inputClase}
                        >
                            <option value="">Selecciona el género</option>
                            <option value="masculino">Masculino</option>
                            <option value="femenino">Femenino</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Correo electrónico</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => cambiar("email", aMayuscula(e.target.value))}
                            className={inputClase}
                            placeholder="Introduce tu correo electrónico"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1.5">Dirección</label>
                        <input
                            type="text"
                            value={form.direccion}
                            onChange={(e) => cambiar("direccion", aMayuscula(e.target.value))}
                            className={inputClase}
                            placeholder="Introduce tu dirección"
                        />
                    </div>
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

                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="es_vip"
                        checked={form.es_vip}
                        onChange={(e) => cambiar("es_vip", e.target.checked)}
                        className="w-5 h-5 rounded border-line bg-ink text-gold focus:ring-gold focus:ring-2 cursor-pointer accent-gold"
                    />
                    <label htmlFor="es_vip" className="text-sm text-gray-300 cursor-pointer select-none">
                        Cliente VIP
                    </label>
                </div>

                <div>
                    <label className="block text-sm text-gray-300 mb-1.5">Notas</label>
                    <textarea
                        value={form.notas}
                        onChange={(e) => cambiar("notas", aMayuscula(e.target.value))}
                        rows={4}
                        className={inputClase}
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
                        onClick={() => navigate("/clientes")}
                        className="border border-line text-gray-300 hover:text-white hover:bg-ink-soft rounded-lg py-3 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </form>


        </div>
    );
}

export default ClienteForm;
