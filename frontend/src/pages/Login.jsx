import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Store, User, Lock, Scissors } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../api/cliente";

const Login = () => {
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
      login(respuesta.data);
      navigate("/dashboard");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Usuario o contraseña incorrectos");
      } else if (err.response && err.response.status === 404) {
        setError("No existe una barbería con ese subdominio");
      } else {
        setError("Error al conectar con el servidor");
      }
    } finally {
      setCargando(false);
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
        {/* Imagen de fondo: reemplazá la URL por tu foto real cuando la tengas */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: "",
          }}
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
          {/* Logo: reemplazá este círculo por tu logo real */}
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
        </div>
      </div>

      {/* Panel del formulario */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md animate-fade-in delay-200">
          <div className="mb-10">
            <h2 className="text-4xl font-bold text-white mb-3">Bienvenido</h2>
            <p className="text-gray-400 text-lg">
              Ingresá a tu cuenta para continuar
            </p>
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
                  placeholder="barberkobe"
                  className={claseInput(subdominio, "subdominio")}
                />
              </div>
              {tocado.subdominio && !subdominio && (
                <p className="text-red-400 text-xs mt-1.5">
                  Este campo es obligatorio
                </p>
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
                <p className="text-red-400 text-xs mt-1.5">
                  Este campo es obligatorio
                </p>
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
                  {verPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {tocado.password && !password && (
                <p className="text-red-400 text-xs mt-1.5">
                  Este campo es obligatorio
                </p>
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

          <p className="text-center text-gray-500 text-sm mt-10">
            ¿No tenés cuenta?{" "}
            <span className="text-gold cursor-pointer hover:underline font-medium">
              Registrá tu barbería
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
