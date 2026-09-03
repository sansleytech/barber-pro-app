import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Store,
    User,
    Mail,
    Phone,
    Lock,
    Eye,
    EyeOff,
    Check,
    Scissors,
} from "lucide-react";
import api from "../api/cliente";

const inputCls =
    "w-full bg-ink-card border rounded-xl pl-12 pr-4 py-4 text-white text-base placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all border-line focus:border-gold";
const labelCls = "block text-sm text-gray-300 mb-2 font-medium";
const iconCls =
    "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none";

const PASOS = [
    { n: 1, label: "Barbería" },
    { n: 2, label: "Administrador" },
    { n: 3, label: "Confirmar" },
];

function Registro() {
    const navigate = useNavigate();
    const [paso, setPaso] = useState(1);
    const [error, setError] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [verPassword, setVerPassword] = useState(false);
    const [completado, setCompletado] = useState(null);

    const [form, setForm] = useState({
        nombre_barberia: "",
        subdominio: "",
        email_contacto: "",
        telefono: "",
        nombre_admin: "",
        email_admin: "",
        password_admin: "",
        password_confirmar: "",
    });

    const set = (campo) => (e) =>
        setForm((f) => ({ ...f, [campo]: e.target.value }));

    const setSubdominio = (e) => {
        const limpio = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
        setForm((f) => ({ ...f, subdominio: limpio }));
    };

    const validarPaso1 = () => {
        if (!form.nombre_barberia.trim()) return "Ingresá el nombre de tu barbería";
        if (form.subdominio.length < 3) return "El subdominio debe tener al menos 3 caracteres";
        return "";
    };

    const validarPaso2 = () => {
        if (!form.nombre_admin.trim()) return "Ingresá tu nombre";
        if (!form.email_admin.trim() || !form.email_admin.includes("@")) return "Ingresá un email válido";
        if (form.password_admin.length < 6) return "La contraseña debe tener al menos 6 caracteres";
        if (form.password_admin !== form.password_confirmar) return "Las contraseñas no coinciden";
        return "";
    };

    const continuar = () => {
        const msg = paso === 1 ? validarPaso1() : validarPaso2();
        if (msg) {
            setError(msg);
            return;
        }
        setError("");
        setPaso((p) => p + 1);
    };

    const volver = () => {
        setError("");
        setPaso((p) => p - 1);
    };

    const enviar = async () => {
        setError("");
        setEnviando(true);
        try {
            const res = await api.post("/registro", {
                nombre_barberia: form.nombre_barberia.trim(),
                subdominio: form.subdominio,
                email_contacto: form.email_contacto.trim() || null,
                telefono: form.telefono.trim() || null,
                nombre_admin: form.nombre_admin.trim(),
                email_admin: form.email_admin.trim(),
                password_admin: form.password_admin,
            });
            setCompletado(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || "No se pudo completar el registro. Intentá de nuevo.");
        } finally {
            setEnviando(false);
        }
    };

    // ============ PANEL DE MARCA (igual que Login) ============
    const PanelMarca = (
        <div className="md:w-1/2 relative overflow-hidden flex items-center justify-center p-8 md:p-16 min-h-[40vh] md:min-h-screen">
            <div
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{ backgroundImage: "" }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-ink/90 via-ink/70 to-ink" />
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    background:
                        "radial-gradient(circle at 30% 40%, rgba(212,175,55,0.5), transparent 55%)",
                }}
            />

            <div className="relative z-10 text-center md:text-left max-w-md animate-fade-in-up">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gold mb-8 shadow-lg shadow-gold/20">
                    <Scissors className="w-10 h-10 text-ink" />
                </div>

                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                    Barber <span className="text-gold">Pro</span>
                </h1>
                <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
                    Gestioná tu barbería de punta a punta: turnos, clientes, inventario
                    y caja en un solo lugar.
                </p>
                <div className="mt-10 flex items-center justify-center md:justify-start gap-4 text-sm text-gray-400">
                    <span>Turnos</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    <span>Inventario</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    <span>Reportes</span>
                </div>
                <div className="mt-8 inline-flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold text-sm font-medium rounded-lg px-4 py-2.5 w-fit">
                    14 días de prueba gratis, sin tarjeta
                </div>
            </div>
        </div>
    );

    // ============ VISTA DE ÉXITO ============
    if (completado) {
        return (
            <div className="min-h-screen flex flex-col md:flex-row bg-ink">
                {PanelMarca}
                <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16">
                    <div className="w-full max-w-md text-center animate-fade-in delay-200">
                        <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center mx-auto mb-6">
                            <Check className="w-8 h-8 text-ink" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                            ¡Listo, {completado.nombre_usuario_admin}!
                        </h2>
                        <p className="text-gray-400 text-lg mb-8">{completado.mensaje}</p>
                        <div className="bg-ink-card border border-line rounded-xl p-5 text-left mb-8">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tu barbería</p>
                            <p className="text-white font-semibold mb-3">{completado.subdominio}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Portal público</p>
                            <p className="text-gold text-sm">tusitio.com/portal/{completado.subdominio}</p>
                        </div>
                        <button
                            onClick={() => navigate("/login")}
                            className="w-full bg-gold text-ink font-semibold rounded-xl py-4 text-base hover:bg-gold-soft hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Ir a iniciar sesión
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ============ WIZARD ============
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-ink">
            {PanelMarca}

            <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16">
                <div className="w-full max-w-md animate-fade-in delay-200">
                    <div className="mb-8">
                        <h2 className="text-4xl font-bold text-white mb-3">Registrá tu barbería</h2>
                        <p className="text-gray-400 text-lg">Empezá tu prueba gratuita de 14 días</p>
                    </div>

                    {/* indicador de pasos */}
                    <div className="flex items-center mb-8">
                        {PASOS.map((p, i) => (
                            <div key={p.n} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors ${paso === p.n
                                            ? "bg-gold border-gold text-ink"
                                            : paso > p.n
                                                ? "bg-gold/20 border-gold text-gold"
                                                : "bg-ink-card border-line text-gray-500"
                                            }`}
                                    >
                                        {paso > p.n ? <Check className="w-4 h-4" /> : p.n}
                                    </div>
                                    <span
                                        className={`text-[0.7rem] mt-1.5 ${paso >= p.n ? "text-white" : "text-gray-500"
                                            }`}
                                    >
                                        {p.label}
                                    </span>
                                </div>
                                {i < PASOS.length - 1 && (
                                    <div
                                        className={`flex-1 h-px mx-2 ${paso > p.n ? "bg-gold" : "bg-line"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-5 animate-fade-in">
                            {error}
                        </div>
                    )}

                    {/* PASO 1: Barbería */}
                    {paso === 1 && (
                        <div className="space-y-5 animate-fade-in-up">
                            <div>
                                <label className={labelCls}>Nombre de tu barbería</label>
                                <div className="relative">
                                    <Store className={iconCls} />
                                    <input
                                        type="text"
                                        placeholder="Ingresa el nombre de la barberia"
                                        value={form.nombre_barberia}
                                        onChange={set("nombre_barberia")}
                                        className={inputCls}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Subdominio</label>
                                <div className="relative">
                                    <Store className={iconCls} />
                                    <input
                                        type="text"
                                        placeholder="Ingresa un subdominio (ej: barbepro)"
                                        value={form.subdominio}
                                        onChange={setSubdominio}
                                        className={inputCls}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1.5">
                                    Tu portal quedará en:{" "}
                                    <span className="text-gold">
                                        tusitio.com/portal/{form.subdominio || "..."}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <label className={labelCls}>
                                    Email de contacto{" "}
                                    <span className="text-gray-500 font-normal">(opcional)</span>
                                </label>
                                <div className="relative">
                                    <Mail className={iconCls} />
                                    <input
                                        type="email"
                                        placeholder="Ingresa un email de contacto"
                                        value={form.email_contacto}
                                        onChange={set("email_contacto")}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>
                                    Teléfono <span className="text-gray-500 font-normal">(opcional)</span>
                                </label>
                                <div className="relative">
                                    <Phone className={iconCls} />
                                    <input
                                        type="text"
                                        placeholder="Digita un teléfono de contacto"
                                        value={form.telefono}
                                        onChange={set("telefono")}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={continuar}
                                className="w-full bg-gold text-ink font-semibold rounded-xl py-4 text-base hover:bg-gold-soft hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Continuar
                            </button>
                        </div>
                    )}

                    {/* PASO 2: Administrador */}
                    {paso === 2 && (
                        <div className="space-y-5 animate-fade-in-up">
                            <div>
                                <label className={labelCls}>Nombre de usuario o administrador</label>
                                <div className="relative">
                                    <User className={iconCls} />
                                    <input
                                        type="text"
                                        placeholder="Ingresa el nombre de usuario o administrador"
                                        value={form.nombre_admin}
                                        onChange={set("nombre_admin")}
                                        className={inputCls}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Tu email</label>
                                <div className="relative">
                                    <Mail className={iconCls} />
                                    <input
                                        type="email"
                                        placeholder="Ingresa tu email"
                                        value={form.email_admin}
                                        onChange={set("email_admin")}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Contraseña</label>
                                <div className="relative">
                                    <Lock className={iconCls} />
                                    <input
                                        type={verPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={form.password_admin}
                                        onChange={set("password_admin")}
                                        className={inputCls + " pr-12"}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setVerPassword((v) => !v)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold transition-colors"
                                    >
                                        {verPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Confirmar contraseña</label>
                                <div className="relative">
                                    <Lock className={iconCls} />
                                    <input
                                        type={verPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={form.password_confirmar}
                                        onChange={set("password_confirmar")}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={volver}
                                    className="flex-1 border border-line text-white font-semibold rounded-xl py-4 hover:border-gold/50 transition-colors"
                                >
                                    Atrás
                                </button>
                                <button
                                    onClick={continuar}
                                    className="flex-[2] bg-gold text-ink font-semibold rounded-xl py-4 hover:bg-gold-soft hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Continuar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PASO 3: Confirmar */}
                    {paso === 3 && (
                        <div className="space-y-5 animate-fade-in-up">
                            <div className="bg-ink-card border border-line rounded-xl p-5 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Barbería</span>
                                    <span className="text-white font-medium">{form.nombre_barberia}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subdominio</span>
                                    <span className="text-gold font-medium">{form.subdominio}</span>
                                </div>
                                {form.email_contacto && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Email de contacto</span>
                                        <span className="text-white font-medium">{form.email_contacto}</span>
                                    </div>
                                )}
                                {form.telefono && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Teléfono</span>
                                        <span className="text-white font-medium">{form.telefono}</span>
                                    </div>
                                )}
                                <div className="border-t border-line pt-3 flex justify-between text-sm">
                                    <span className="text-gray-500">Administrador</span>
                                    <span className="text-white font-medium">{form.nombre_admin}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Email de acceso</span>
                                    <span className="text-white font-medium">{form.email_admin}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={volver}
                                    disabled={enviando}
                                    className="flex-1 border border-line text-white font-semibold rounded-xl py-4 hover:border-gold/50 transition-colors disabled:opacity-50"
                                >
                                    Atrás
                                </button>
                                <button
                                    onClick={enviar}
                                    disabled={enviando}
                                    className="flex-[2] bg-gold text-ink font-semibold rounded-xl py-4 hover:bg-gold-soft hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:hover:scale-100"
                                >
                                    {enviando ? "Creando barbería…" : "Crear mi barbería"}
                                </button>
                            </div>
                        </div>
                    )}

                    <p className="text-center text-gray-500 text-sm mt-8">
                        ¿Ya tenés cuenta?{" "}
                        <Link to="/login" className="text-gold font-medium hover:underline">
                            Iniciar sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Registro;