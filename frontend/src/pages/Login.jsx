import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Store, User, Lock, ShieldCheck, Calendar, ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/cliente";
import logo from "../assets/img/logo1.png";

const ROLES = [
  { valor: "administrador", label: "Administrador", icono: ShieldCheck },
  { valor: "barbero", label: "Barbero", icono: Store },
  { valor: "recepcionista", label: "Recepcionista", icono: Calendar },
];

// Clave de localStorage para el token de "dispositivo recordado", por
// subdominio+usuario (así un mismo navegador puede recordar varias cuentas).
const claveDispositivo = (subdominio, usuario) =>
  `bp_device_${subdominio.toLowerCase()}_${usuario.toLowerCase()}`;

const Login = () => {
  const [rolSeleccionado, setRolSeleccionado] = useState("administrador");
  const [subdominio, setSubdominio] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [tocado, setTocado] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const marcarTocado = (campo) => setTocado((t) => ({ ...t, [campo]: true }));

  // Segundo paso: pedir el código que llegó por email.
  const [paso, setPaso] = useState("credenciales"); // "credenciales" | "codigo"
  const [idUsuarioPendiente, setIdUsuarioPendiente] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [rolPendiente, setRolPendiente] = useState(null);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const tokenDispositivo = localStorage.getItem(claveDispositivo(subdominio, usuario)) || "";

      const datos = new URLSearchParams();
      datos.append("username", usuario);
      datos.append("password", password);
      datos.append("client_id", subdominio);
      // Reutilizamos el campo estándar "client_secret" del formulario OAuth2
      // para viajar el token de dispositivo recordado, sin agregar un campo nuevo.
      if (tokenDispositivo) datos.append("client_secret", tokenDispositivo);

      const respuesta = await api.post("/auth/login", datos);

      if (respuesta.data.requiere_verificacion) {
        setIdUsuarioPendiente(respuesta.data.id_usuario);
        setRolPendiente(rolSeleccionado);
        setPaso("codigo");
        setCargando(false);
        return;
      }

      completarLogin(respuesta.data, rolSeleccionado);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Usuario o contraseña incorrectos");
      } else if (err.response && err.response.status === 404) {
        setError("No existe una barbería con ese subdominio");
      } else {
        setError("Error al conectar con el servidor");
      }
      setCargando(false);
    }
  };

  const manejarVerificarCodigo = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const respuesta = await api.post("/auth/verificar-codigo", {
        id_usuario: idUsuarioPendiente,
        codigo: codigo.trim(),
      });

      // Guardamos el token de dispositivo para no volver a pedir el código
      // en este mismo navegador, con esta misma barbería y usuario.
      if (respuesta.data.device_token) {
        localStorage.setItem(claveDispositivo(subdominio, usuario), respuesta.data.device_token);
      }

      completarLogin(respuesta.data, rolPendiente);
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo verificar el código");
      setCargando(false);
    }
  };

  const completarLogin = (data, rolEsperado) => {
    const rolReal = data.usuario?.rol;
    if (rolReal !== rolEsperado) {
      setError(
        `Este usuario no tiene el rol "${ROLES.find((r) => r.valor === rolEsperado)?.label}". Probá con la pestaña correcta.`
      );
      setCargando(false);
      setPaso("credenciales");
      return;
    }
    login(data);
    if (rolReal === "barbero") {
      navigate("/mi-dia");
    } else {
      navigate("/dashboard");
    }
  };

  const claseInput = (valor, campo) =>
    `w-full bg-black/40 border rounded-xl pl-12 pr-4 py-3.5 text-white text-base placeholder-gray-600 outline-none transition-all duration-300 ${tocado[campo] && !valor
      ? "border-red-500/50"
      : "border-white/10 focus:border-gold/60 focus:bg-black/60"
    }`;

  return (
    <div className="min-h-screen bg-[#050505] relative flex items-center justify-center px-4 py-10 overflow-hidden">
      {/* Fondo: degradé sutil + una sola luz difusa arriba, quieta, discreta */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 800px 500px at 50% -10%, rgba(212,175,55,0.12), transparent 60%)",
        }}
      />
      <div className="absolute inset-0 bg-[#050505]" style={{ maskImage: "radial-gradient(ellipse 800px 500px at 50% -10%, transparent 20%, black 70%)" }} />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al inicio
      </Link>

      {/* Tarjeta única, centrada */}
      <div className="relative z-10 w-full max-w-[420px] animate-fade-in-up">
        <div className="bg-[#0d0d0f] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-8">
          {/* Logo + marca, compacto arriba */}
          <div className="flex flex-col items-center text-center mb-7">
            <img src={logo} alt="Barber Pro" className="w-14 h-14 object-contain mb-3" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Barber <span className="text-gold">Pro</span>
            </h1>
          </div>

          {paso === "credenciales" ? (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-1">Bienvenido de nuevo</h2>
                <p className="text-gray-500 text-sm">Ingresá a tu cuenta para continuar</p>
              </div>

              {/* Selector de rol */}
              <div className="flex gap-1 p-1 bg-black/40 border border-white/10 rounded-lg mb-6">
                {ROLES.map((r) => {
                  const Icono = r.icono;
                  const activo = rolSeleccionado === r.valor;
                  return (
                    <button
                      key={r.valor}
                      type="button"
                      onClick={() => { setRolSeleccionado(r.valor); setError(""); }}
                      className={`flex-1 inline-flex flex-col items-center justify-center gap-1 py-2 rounded-md text-[0.68rem] font-semibold transition-colors ${
                        activo ? "bg-gold text-ink" : "text-gray-500 hover:text-white"
                      }`}
                    >
                      <Icono className="w-3.5 h-3.5" />
                      {r.label}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={manejarSubmit} className="space-y-4" noValidate>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3.5 py-2.5">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                    Barbería (subdominio)
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                      type="text"
                      value={subdominio}
                      onChange={(e) => setSubdominio(e.target.value)}
                      onBlur={() => marcarTocado("subdominio")}
                      placeholder="Subdominio o nombre de barbería"
                      className={claseInput(subdominio, "subdominio")}
                    />
                  </div>
                  {tocado.subdominio && !subdominio && (
                    <p className="text-red-400 text-xs mt-1">Este campo es obligatorio</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                    Usuario
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                      type="text"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      onBlur={() => marcarTocado("usuario")}
                      placeholder="tu usuario"
                      className={claseInput(usuario, "usuario")}
                    />
                  </div>
                  {tocado.usuario && !usuario && (
                    <p className="text-red-400 text-xs mt-1">Este campo es obligatorio</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                      type={verPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => marcarTocado("password")}
                      placeholder="••••••••"
                      className={claseInput(password, "password") + " pr-11"}
                    />
                    <button
                      type="button"
                      onClick={() => setVerPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gold transition-colors"
                    >
                      {verPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {tocado.password && !password && (
                    <p className="text-red-400 text-xs mt-1">Este campo es obligatorio</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full bg-gold text-ink font-semibold rounded-lg py-3 text-sm hover:bg-gold-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {cargando ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <p className="text-center text-gray-500 text-xs mt-4">
                <Link to="/olvide-password" className="text-gold hover:underline">¿Olvidaste tu contraseña?</Link>
              </p>
            </>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Revisá tu correo</h2>
                <p className="text-gray-500 text-sm">
                  Te mandamos un código de 6 dígitos.
                </p>
              </div>

              <form onSubmit={manejarVerificarCodigo} className="space-y-4" noValidate>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3.5 py-2.5">
                    {error}
                  </div>
                )}

                <div className="flex gap-1.5 sm:gap-2 justify-center" onPaste={(e) => {
                  e.preventDefault();
                  const pegado = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
                  if (pegado) {
                    setCodigo(pegado);
                    const ultimo = document.getElementById(`codigo-${Math.min(pegado.length, 5)}`);
                    if (ultimo) ultimo.focus();
                  }
                }}>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                      key={i}
                      id={`codigo-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      autoFocus={i === 0}
                      value={codigo[i] || ""}
                      onChange={(e) => {
                        const digito = e.target.value.replace(/[^0-9]/g, "").slice(-1);
                        const nuevo = codigo.split("");
                        nuevo[i] = digito;
                        const nuevoCodigo = nuevo.join("").slice(0, 6);
                        setCodigo(nuevoCodigo);
                        if (digito && i < 5) {
                          document.getElementById(`codigo-${i + 1}`)?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !codigo[i] && i > 0) {
                          document.getElementById(`codigo-${i - 1}`)?.focus();
                        }
                      }}
                      className="w-10 h-13 sm:w-11 sm:h-14 bg-black/40 border border-white/10 rounded-lg text-white text-xl font-semibold text-center placeholder-gray-700 outline-none focus:border-gold/60 transition-all"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={cargando || codigo.length !== 6}
                  className="w-full bg-gold text-ink font-semibold rounded-lg py-3 text-sm hover:bg-gold-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cargando ? "Verificando..." : "Confirmar código"}
                </button>

                <button
                  type="button"
                  onClick={() => { setPaso("credenciales"); setCodigo(""); setError(""); }}
                  className="w-full text-center text-xs text-gray-500 hover:text-gold transition-colors"
                >
                  ← Volver a ingresar mis datos
                </button>
              </form>
            </>
          )}
        </div>

        {/* Enlaces fuera de la tarjeta */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-gray-500 text-sm">
            ¿No tenés cuenta?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-gold font-medium hover:underline cursor-pointer"
            >
              Registrá tu barbería
            </button>
          </p>
          <p className="text-gray-600 text-xs">
            ¿Sos parte del equipo de soporte?{" "}
            <button
              type="button"
              onClick={() => navigate("/superadmin/login")}
              className="text-gray-500 hover:text-gold hover:underline cursor-pointer"
            >
              Ingresá acá
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;