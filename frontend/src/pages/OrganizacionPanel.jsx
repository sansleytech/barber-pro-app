import { useState, useEffect } from "react";
import { Plus, Building2, ExternalLink, LogOut } from "lucide-react";
import apiOrg from "../api/clienteOrganizacion";
import logo from "../assets/img/logo1.png";

const ESTADO_COLOR = {
  trial: "bg-blue-500/10 text-blue-400",
  activa: "bg-emerald-500/10 text-emerald-400",
  suspendida: "bg-amber-500/10 text-amber-400",
  cancelada: "bg-red-500/10 text-red-400",
};

function OrganizacionPanel() {
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre_barberia: "", subdominio: "", email_contacto: "", telefono: "",
    nombre_admin: "", email_admin: "", password_admin: "",
  });

  const dueno = JSON.parse(localStorage.getItem("dueno") || "{}");

  const cargar = () => {
    apiOrg.get("/organizacion/sedes").then((r) => setSedes(r.data)).finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const salir = () => {
    localStorage.removeItem("token_organizacion");
    localStorage.removeItem("dueno");
    window.location.href = "/organizacion/login";
  };

  const crearSede = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiOrg.post("/organizacion/sedes", form);
      setCreando(false);
      setForm({ nombre_barberia: "", subdominio: "", email_contacto: "", telefono: "", nombre_admin: "", email_admin: "", password_admin: "" });
      cargar();
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo crear la sede");
    }
  };

  if (cargando) return <div className="min-h-screen bg-ink flex items-center justify-center text-gray-500">Cargando...</div>;

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-line bg-ink-soft/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Barber Pro" className="w-9 h-9 rounded-lg object-cover" />
            <div>
              <h1 className="text-white font-semibold leading-tight">Barber Pro</h1>
              <p className="text-[11px] text-gold font-mono tracking-wider uppercase leading-tight">Panel de cadena</p>
            </div>
          </div>
          <button onClick={salir} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Tus sedes</h2>
            <p className="text-gray-500 text-sm">{dueno.nombre_usuario}</p>
          </div>
          <button
            onClick={() => setCreando(true)}
            className="inline-flex items-center gap-2 bg-gold text-ink font-semibold text-sm rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
          >
            <Plus className="w-4 h-4" /> Crear sede
          </button>
        </div>

        {creando && (
          <div className="bg-ink-card border border-gold/25 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-4">Nueva sede</h3>
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
            <form onSubmit={crearSede} className="grid sm:grid-cols-2 gap-4">
              <input placeholder="Nombre de la barbería" value={form.nombre_barberia} onChange={(e) => setForm((f) => ({ ...f, nombre_barberia: e.target.value }))} className="bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" required />
              <input placeholder="Subdominio" value={form.subdominio} onChange={(e) => setForm((f) => ({ ...f, subdominio: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") }))} className="bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" required />
              <input placeholder="Email de contacto" value={form.email_contacto} onChange={(e) => setForm((f) => ({ ...f, email_contacto: e.target.value }))} className="bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" />
              <input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} className="bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" />
              <input placeholder="Nombre del admin de la sede" value={form.nombre_admin} onChange={(e) => setForm((f) => ({ ...f, nombre_admin: e.target.value }))} className="bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" required />
              <input placeholder="Email del admin" value={form.email_admin} onChange={(e) => setForm((f) => ({ ...f, email_admin: e.target.value }))} className="bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" required />
              <input type="password" placeholder="Contraseña" value={form.password_admin} onChange={(e) => setForm((f) => ({ ...f, password_admin: e.target.value }))} className="bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold sm:col-span-2" required />
              <div className="sm:col-span-2 flex gap-3">
                <button type="button" onClick={() => setCreando(false)} className="flex-1 border border-line text-gray-300 rounded-lg py-2.5 text-sm hover:bg-ink transition-colors">Cancelar</button>
                <button type="submit" className="flex-[2] bg-gold text-ink font-semibold rounded-lg py-2.5 text-sm hover:bg-gold-soft transition-colors">Crear sede</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sedes.map((s) => (
            <div key={s.id_barberia} className="bg-ink-card border border-line rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-gold" />
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${ESTADO_COLOR[s.estado]}`}>{s.estado}</span>
              </div>
              <h3 className="text-white font-semibold mb-1">{s.nombre}</h3>
              <p className="text-gray-500 text-xs mb-4">@{s.subdominio}</p>
              {React.createElement(
                "a",
                {
                  href: `https://barberproapp.online/login?subdominio=${s.subdominio}`,
                  target: "_blank",
                  rel: "noreferrer",
                  className: "inline-flex items-center gap-1.5 text-sm text-gold hover:underline",
                },
                "Entrar a esta sede ",
                <ExternalLink key="icono" className="w-3.5 h-3.5" />
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default OrganizacionPanel;