import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Store } from "lucide-react";
import api from "../api/cliente";
import logo from "../assets/img/logo1.png";

function OlvidePassword() {
  const [subdominio, setSubdominio] = useState("");
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await api.post("/auth/olvide-password", { subdominio, email });
      setEnviado(true);
    } catch {
      setError("No se pudo procesar la solicitud. Intentá de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Barber Pro" className="w-16 h-16 rounded-2xl object-cover mb-4" />
          <h1 className="text-2xl font-bold text-white">¿Olvidaste tu contraseña?</h1>
          <p className="text-gray-500 text-sm mt-1 text-center">Te mandamos un link para elegir una nueva</p>
        </div>

        {enviado ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl px-4 py-4 text-center">
            Si el email existe, te enviamos un link para restablecer tu contraseña. Revisá tu bandeja de entrada (y spam).
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            <div className="relative">
              <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={subdominio}
                onChange={(e) => setSubdominio(e.target.value)}
                placeholder="Subdominio de tu barbería"
                className="w-full bg-ink-card border border-line rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 outline-none focus:border-gold transition-colors"
                required
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu email"
                className="w-full bg-ink-card border border-line rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 outline-none focus:border-gold transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-gold text-ink font-semibold rounded-xl py-3.5 hover:bg-gold-soft transition-colors disabled:opacity-50"
            >
              {cargando ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        )}

        <p className="text-center text-gray-500 text-sm mt-8">
          <Link to="/login" className="text-gold hover:underline">Volver al login</Link>
        </p>
      </div>
    </div>
  );
}

export default OlvidePassword;