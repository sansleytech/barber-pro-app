import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import api from "../api/cliente";
import logo from "../assets/img/logo1.png";

function RestablecerPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (password !== confirmar) { setError("Las contraseñas no coinciden"); return; }
    setCargando(true);
    try {
      await api.post("/auth/restablecer-password", { token, password_nueva: password });
      setListo(true);
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo restablecer la contraseña");
    } finally {
      setCargando(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-red-400 mb-4">Este link no es válido.</p>
          <Link to="/olvide-password" className="text-gold hover:underline">Pedir uno nuevo</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Barber Pro" className="w-16 h-16 rounded-2xl object-cover mb-4" />
          <h1 className="text-2xl font-bold text-white">Elegí una nueva contraseña</h1>
        </div>

        {listo ? (
          <div className="text-center">
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl px-4 py-4 mb-6">
              Tu contraseña se actualizó correctamente.
            </div>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-gold text-ink font-semibold rounded-xl py-3.5 hover:bg-gold-soft transition-colors"
            >
              Ir a iniciar sesión
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={verPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nueva contraseña"
                className="w-full bg-ink-card border border-line rounded-xl pl-12 pr-11 py-3.5 text-white placeholder-gray-600 outline-none focus:border-gold transition-colors"
              />
              <button type="button" onClick={() => setVerPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                {verPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={verPassword ? "text" : "password"}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Confirmar contraseña"
                className="w-full bg-ink-card border border-line rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 outline-none focus:border-gold transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-gold text-ink font-semibold rounded-xl py-3.5 hover:bg-gold-soft transition-colors disabled:opacity-50"
            >
              {cargando ? "Guardando..." : "Restablecer contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default RestablecerPassword;