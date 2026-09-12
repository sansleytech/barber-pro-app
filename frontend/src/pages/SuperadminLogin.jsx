import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/cliente";
            <div className="w-20 h-20 rounded-2xl bg-yellow-400 flex items-center justify-center mb-8">
                <span className="text-3xl">✂️</span>
            </div>

function SuperadminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const respuesta = await api.post("/superadmin/login", { username, password });
      login(respuesta.data);
      navigate("/superadmin");
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Usuario o contraseña incorrectos");
      } else {
        setError("Error al conectar con el servidor");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-ink">
      {/* Panel de marca, igual estilo que el login normal */}
      <div className="md:w-1/2 relative overflow-hidden flex items-center justify-center p-8 md:p-16 min-h-[35vh] md:min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-neutral-900 to-ink" />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background: "radial-gradient(circle at 30% 40%, rgba(212,175,55,0.5), transparent 55%)",
          }}
        />
        <div className="relative z-10 text-center animate-fade-in-up">
          <img src={logo} alt="Barber Pro" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-6 shadow-lg shadow-gold/20" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Barber <span className="text-gold">Pro</span>
          </h1>
          <p className="text-gold font-mono text-xs tracking-[0.2em] uppercase">Panel de superadministración</p>
        </div>
      </div>

      {/* Panel del formulario */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-sm animate-fade-in delay-200">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Acceso restringido</h2>
            <p className="text-gray-400 text-sm">Solo para superadministradores de la plataforma</p>
          </div>

          <form onSubmit={manejarSubmit} className="space-y-4" noValidate>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 animate-fade-in">
                {error}
              </div>
            )}

            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Usuario"
                className="w-full bg-ink-card border border-line rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 outline-none focus:border-gold transition-colors"
                autoFocus
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full bg-ink-card border border-line rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 outline-none focus:border-gold transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-gold text-ink font-semibold rounded-xl py-3.5 hover:bg-gold-soft hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {cargando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SuperadminLogin;