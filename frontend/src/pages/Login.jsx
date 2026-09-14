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
      const datos = new URLSearchParams();
      datos.append("username", usuario);
      datos.append("password", password);
      datos.append("client_id", subdominio);
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
    `w-full bg-ink-card border rounded-xl pl-12 pr-4 py-4 text-white text-base placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all ${tocado[campo] && !valor
      ? "border-red-500/50"
      : "border-line focus:border-gold"
    }`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-ink">
      {/* Panel de marca */}
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
          <img src={logo} alt="Barber Pro" className="w-20 h-20 rounded-2xl object-cover mb-8 shadow-lg shadow-gold/20" />

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
        </div>
      </div>

      {/* Panel del formulario */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md animate-fade-in delay-200">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>

          {paso === "credenciales" ? (
            <>
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-white mb-3">Bienvenido</h2>
                <p className="text-gray-400 text-lg">
                  Ingresá a tu cuenta para continuar
                </p>
              </div>

              {/* Selector de rol */}
              <div className="flex gap-1.5 p-1.5 bg-ink-card border border-line rounded-xl mb-8">
                {ROLES.map((r) => {
                  const Icono = r.icono;
                  const activo = rolSeleccionado === r.valor;
                  return (
                    <button
                      key={r.valor}
                      type="button"
                      onClick={() => { setRolSeleccionado(r.valor); setError(""); }}
                      className={`flex-1 inline-flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                        activo ? "bg-gold text-ink" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <Icono className="w-4 h-4" />
                      {r.label}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={manejarSubmit} className="space-y-5" noValidate>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 animate-fade-in">
                    {error}
                  </div>
                )}

                <div className="animate-fade-in-up delay-100">
                  <label className="block text-sm text-gray-300 mb-2 font-medium">
                    Barbería (subdominio)
                  </label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
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
                    <p className="text-red-400 text-xs mt-1.5">Este campo es obligatorio</p>
                  )}
                </div>

                <div className="animate-fade-in-up delay-200">
                  <label className="block text-sm text-gray-300 mb-2 font-medium">
                    Usuario
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
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
                    <p className="text-red-400 text-xs mt-1.5">Este campo es obligatorio</p>
                  )}
                </div>

                <div className="animate-fade-in-up delay-300">
                  <label className="block text-sm text-gray-300 mb-2 font-medium">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={verPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => marcarTocado("password")}
                      placeholder="••••••••"
                      className={claseInput(password, "password") + " pr-12"}
                    />
                    <button
                      type="button"
                      onClick={() => setVerPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold transition-colors"
                    >
                      {verPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {tocado.password && !password && (
                    <p className="text-red-400 text-xs mt-1.5">Este campo es obligatorio</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full bg-gold text-ink font-semibold rounded-xl py-4 text-base hover:bg-gold-soft hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {cargando ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <p className="text-center text-gray-500 text-sm mt-4">
                <Link to="/olvide-password" className="text-gold hover:underline">¿Olvidaste tu contraseña?</Link>
              </p>

              <p className="text-center text-gray-500 text-sm mt-10">
                ¿No tenés cuenta?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-gold font-medium hover:underline cursor-pointer"
                >
                  Registrá tu barbería
                </button>
              </p>

              <p className="text-center text-gray-600 text-xs mt-4">
                ¿Sos parte del equipo de soporte?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/superadmin/login")}
                  className="text-gray-500 hover:text-gold hover:underline cursor-pointer"
                >
                  Ingresá acá
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mb-5">
                  <Mail className="w-7 h-7 text-gold" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Revisá tu correo</h2>
                <p className="text-gray-400">
                  Te mandamos un código de 6 dígitos. Ingresalo para completar el ingreso.
                </p>
              </div>

              <form onSubmit={manejarVerificarCodigo} className="space-y-5" noValidate>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 animate-fade-in">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-300 mb-3 font-medium">Código de verificación</label>
                  <div className="flex gap-2 sm:gap-3 justify-center" onPaste={(e) => {
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
                        className="w-11 h-14 sm:w-12 sm:h-16 bg-ink-card border border-line rounded-xl text-white text-2xl font-semibold text-center placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando || codigo.length !== 6}
                  className="w-full bg-gold text-ink font-semibold rounded-xl py-4 text-base hover:bg-gold-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cargando ? "Verificando..." : "Confirmar código"}
                </button>

                <button
                  type="button"
                  onClick={() => { setPaso("credenciales"); setCodigo(""); setError(""); }}
                  className="w-full text-center text-sm text-gray-500 hover:text-gold transition-colors"
                >
                  ← Volver a ingresar mis datos
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;