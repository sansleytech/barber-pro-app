import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/cliente";
import { useAuth } from "../context/AuthContext";

// --- Íconos inline (sin dependencias externas) ---
const IconTienda = (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
        <path d="M3 9l1-5h16l1 5M3 9a2 2 0 002 2h1a2 2 0 002-2M3 9v9a1 1 0 001 1h3M21 9a2 2 0 01-2 2h-1a2 2 0 01-2-2M21 9v9a1 1 0 01-1 1h-3M9 9a2 2 0 01-2 2H6a2 2 0 01-2-2M15 9a2 2 0 002 2M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IconUsuario = (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
);
const IconMail = (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
        <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IconTelefono = (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
        <path d="M5 4h3l2 5-2 1a11 11 0 005 5l1-2 5 2v3a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IconCandado = (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
        <rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
    </svg>
);
const IconOjo = (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
const IconOjoTachado = (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
        <path d="M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.9 5.1A11 11 0 0123 12s-1.1 1.9-3.1 3.6M6.6 6.6C4.5 8 3 10 3 12s4 7 11 7c1.3 0 2.5-.2 3.6-.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IconCheck = (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}>
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const inputCls =
    "w-full bg-neutral-900 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 text-sm outline-none focus:border-yellow-400 transition-colors";
const labelCls = "block text-sm font-semibold text-white mb-1.5";
const iconCls = "absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none";

const PASOS = [
    { n: 1, label: "Barbería" },
    { n: 2, label: "Administrador" },
    { n: 3, label: "Confirmar" },
];

function Registro() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [params] = useSearchParams();
    const planElegido = params.get("plan");

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

    const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

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
        if (msg) { setError(msg); return; }
        setError("");
        setPaso((p) => p + 1);
    };

    const volver = () => { setError(""); setPaso((p) => p - 1); };

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

            if (planElegido) {
                try {
                    const datosLogin = new URLSearchParams();
                    datosLogin.append("username", form.nombre_admin.trim());
                    datosLogin.append("password", form.password_admin);
                    datosLogin.append("client_id", form.subdominio);
                    const resLogin = await api.post("/auth/login", datosLogin);
                    login(resLogin.data);
                    navigate(`/pagar?plan=${planElegido}`);
                    return;
                } catch {
                    // Si el auto-login falla, mostramos igual la pantalla de éxito.
                }
            }

            setCompletado(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || "No se pudo completar el registro. Intentá de nuevo.");
        } finally {
            setEnviando(false);
        }
    };

    const PanelMarca = (
        <div className="flex flex-col justify-center px-10 lg:px-16 py-16">
            <div className="w-20 h-20 rounded-2xl bg-yellow-400 flex items-center justify-center mb-8">
                <span className="text-3xl">✂️</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                Barber <span className="text-yellow-400">Pro</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-sm mb-8">
                Gestioná tu barbería de punta a punta: turnos, clientes, inventario y caja en un solo lugar.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-10">
                <span>Turnos</span><span className="text-yellow-400">•</span>
                <span>Inventario</span><span className="text-yellow-400">•</span>
                <span>Reportes</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-sm font-medium rounded-lg px-4 py-2.5 w-fit">
                14 días de prueba gratis, sin tarjeta
            </div>
        </div>
    );

    if (completado) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="w-full max-w-6xl grid lg:grid-cols-2">
                    <div className="hidden lg:block">{PanelMarca}</div>
                    <div className="flex items-center justify-center px-6 py-16">
                        <div className="w-full max-w-md text-center">
                            <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center mx-auto mb-6">
                                <IconCheck className="w-8 h-8 text-neutral-950" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">¡Listo, {completado.nombre_usuario_admin}!</h2>
                            <p className="text-gray-400 mb-8">{completado.mensaje}</p>
                            <div className="bg-neutral-900 border border-white/10 rounded-xl p-5 text-left mb-8">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tu barbería</p>
                                <p className="text-white font-semibold mb-3">{completado.subdominio}</p>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Portal público</p>
                                <p className="text-yellow-400 text-sm">barberproapp.online/portal/{completado.subdominio}</p>
                            </div>
                            <button
                                onClick={() => navigate("/login")}
                                className="w-full bg-yellow-400 text-neutral-950 font-semibold rounded-lg py-3 hover:bg-yellow-300 transition-colors"
                            >
                                Ir a iniciar sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
            <div className="w-full max-w-6xl grid lg:grid-cols-2">
                <div className="hidden lg:block">{PanelMarca}</div>

                <div className="flex items-center justify-center px-6 py-16">
                    <div className="w-full max-w-md">
                        <h2 className="text-3xl font-bold text-white mb-1">Registrá tu barbería</h2>
                        <p className="text-gray-400 mb-8">
                            {planElegido ? "Un último paso antes de activar tu plan" : "Empezá tu prueba gratuita de 14 días"}
                        </p>

                        <div className="flex items-center mb-8">
                            {PASOS.map((p, i) => (
                                <div key={p.n} className="flex items-center flex-1 last:flex-none">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors ${paso === p.n
                                                    ? "bg-yellow-400 border-yellow-400 text-neutral-950"
                                                    : paso > p.n
                                                        ? "bg-yellow-400/20 border-yellow-400 text-yellow-400"
                                                        : "bg-neutral-900 border-white/15 text-gray-500"
                                                }`}
                                        >
                                            {paso > p.n ? <IconCheck className="w-4 h-4" /> : p.n}
                                        </div>
                                        <span className={`text-[0.7rem] mt-1.5 ${paso >= p.n ? "text-white" : "text-gray-500"}`}>{p.label}</span>
                                    </div>
                                    {i < PASOS.length - 1 && (
                                        <div className={`flex-1 h-px mx-2 ${paso > p.n ? "bg-yellow-400" : "bg-white/10"}`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
                                {error}
                            </div>
                        )}

                        {paso === 1 && (
                            <div className="space-y-5">
                                <div>
                                    <label className={labelCls}>Nombre de tu barbería</label>
                                    <div className="relative">
                                        <IconTienda className={iconCls} />
                                        <input type="text" placeholder="Barber Kobe" value={form.nombre_barberia}
                                            onChange={set("nombre_barberia")} className={inputCls} autoFocus />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Subdominio</label>
                                    <div className="relative">
                                        <IconTienda className={iconCls} />
                                        <input type="text" placeholder="barberkobe" value={form.subdominio}
                                            onChange={setSubdominio} className={inputCls} />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1.5">
                                        Tu portal quedará en: <span className="text-yellow-400">barberproapp.online/portal/{form.subdominio || "..."}</span>
                                    </p>
                                </div>
                                <div>
                                    <label className={labelCls}>Email de contacto <span className="text-gray-500 font-normal">(opcional)</span></label>
                                    <div className="relative">
                                        <IconMail className={iconCls} />
                                        <input type="email" placeholder="contacto@barberkobe.com" value={form.email_contacto}
                                            onChange={set("email_contacto")} className={inputCls} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Teléfono <span className="text-gray-500 font-normal">(opcional)</span></label>
                                    <div className="relative">
                                        <IconTelefono className={iconCls} />
                                        <input type="text" placeholder="1800-404040" value={form.telefono}
                                            onChange={set("telefono")} className={inputCls} />
                                    </div>
                                </div>
                                <button onClick={continuar} className="w-full bg-yellow-400 text-neutral-950 font-semibold rounded-lg py-3 hover:bg-yellow-300 transition-colors">
                                    Continuar
                                </button>
                            </div>
                        )}

                        {paso === 2 && (
                            <div className="space-y-5">
                                <div>
                                    <label className={labelCls}>Tu nombre</label>
                                    <div className="relative">
                                        <IconUsuario className={iconCls} />
                                        <input type="text" placeholder="Kobe Pérez" value={form.nombre_admin}
                                            onChange={set("nombre_admin")} className={inputCls} autoFocus />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Tu email</label>
                                    <div className="relative">
                                        <IconMail className={iconCls} />
                                        <input type="email" placeholder="kobe@barberkobe.com" value={form.email_admin}
                                            onChange={set("email_admin")} className={inputCls} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Contraseña</label>
                                    <div className="relative">
                                        <IconCandado className={iconCls} />
                                        <input type={verPassword ? "text" : "password"} placeholder="••••••••" value={form.password_admin}
                                            onChange={set("password_admin")} className={`${inputCls} pr-11`} />
                                        <button type="button" onClick={() => setVerPassword((v) => !v)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                            {verPassword ? <IconOjoTachado className="w-5 h-5" /> : <IconOjo className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Confirmar contraseña</label>
                                    <div className="relative">
                                        <IconCandado className={iconCls} />
                                        <input type={verPassword ? "text" : "password"} placeholder="••••••••" value={form.password_confirmar}
                                            onChange={set("password_confirmar")} className={inputCls} />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={volver} className="flex-1 border border-white/15 text-white font-semibold rounded-lg py-3 hover:border-white/30 transition-colors">
                                        Atrás
                                    </button>
                                    <button onClick={continuar} className="flex-[2] bg-yellow-400 text-neutral-950 font-semibold rounded-lg py-3 hover:bg-yellow-300 transition-colors">
                                        Continuar
                                    </button>
                                </div>
                            </div>
                        )}

                        {paso === 3 && (
                            <div className="space-y-5">
                                <div className="bg-neutral-900 border border-white/10 rounded-xl p-5 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Barbería</span>
                                        <span className="text-white font-medium">{form.nombre_barberia}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Subdominio</span>
                                        <span className="text-yellow-400 font-medium">{form.subdominio}</span>
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
                                    <div className="border-t border-white/10 pt-3 flex justify-between text-sm">
                                        <span className="text-gray-500">Administrador</span>
                                        <span className="text-white font-medium">{form.nombre_admin}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Email de acceso</span>
                                        <span className="text-white font-medium">{form.email_admin}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={volver} disabled={enviando} className="flex-1 border border-white/15 text-white font-semibold rounded-lg py-3 hover:border-white/30 transition-colors disabled:opacity-50">
                                        Atrás
                                    </button>
                                    <button onClick={enviar} disabled={enviando} className="flex-[2] bg-yellow-400 text-neutral-950 font-semibold rounded-lg py-3 hover:bg-yellow-300 transition-colors disabled:opacity-60">
                                        {enviando ? "Creando barbería…" : planElegido ? "Crear barbería y pagar" : "Crear mi barbería"}
                                    </button>
                                </div>
                            </div>
                        )}

                        <p className="text-center text-gray-500 text-sm mt-8">
                            ¿Ya tenés cuenta?{" "}
                            <Link to="/login" className="text-yellow-400 font-medium hover:text-yellow-300">
                                Iniciar sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Registro;