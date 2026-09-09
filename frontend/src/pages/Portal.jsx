import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const portalApi = axios.create({ baseURL: "http://localhost:8000" });

const FRANJAS = [
  { valor: "manana", label: "Mañana" },
  { valor: "tarde", label: "Tarde" },
  { valor: "noche", label: "Noche" },
  { valor: "cualquiera", label: "Cualquiera" },
];

function useFuentes() {
  useEffect(() => {
    if (document.getElementById("portal-fuentes")) return;
    const link = document.createElement("link");
    link.id = "portal-fuentes";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);
}

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
}

function ContadorAnimado({ valor, sufijo = "" }) {
  const [ref, visible] = useReveal();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const destino = Number(valor) || 0;
    const duracion = 900;
    const inicio = performance.now();
    let raf;
    const tick = (ahora) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      setN(Math.round(destino * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, valor]);
  return <span ref={ref}>{n}{sufijo}</span>;
}

const wrap = "w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-24";

const input =
  "w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm outline-none focus:border-yellow-400 transition-colors";
const btnPrimary =
  "font-semibold text-sm text-neutral-950 bg-yellow-400 rounded-lg px-6 py-3 hover:bg-yellow-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-yellow-400/20 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-default";
const pill = (active) =>
  `text-sm font-medium px-4 py-2 rounded-full border transition-all ${active ? "bg-yellow-400 border-yellow-400 text-neutral-950 scale-105" : "bg-neutral-900 border-white/10 text-gray-400 hover:border-white/25 hover:scale-105"
  }`;
const alert = "bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3";
const alertBrass = "bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 text-sm rounded-lg px-4 py-3";

function Portal() {
  const { subdominio } = useParams();
  useFuentes();

  const [info, setInfo] = useState(null);
  const [barberos, setBarberos] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [servicios, setServicios] = useState([]);

  const [vista, setVista] = useState("inicio");
  const [slideActual, setSlideActual] = useState(0);
  const [tabGaleria, setTabGaleria] = useState("todos");
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [navSolido, setNavSolido] = useState(false);
  const [menuMobileAbierto, setMenuMobileAbierto] = useState(false);

  const [paso, setPaso] = useState("documento");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [documento, setDocumento] = useState("");
  const [cliente, setCliente] = useState(null);
  const [registro, setRegistro] = useState({ primer_nombre: "", apellidos: "", telefono: "", fecha_nacimiento: "", email: "" });
  const [solicitud, setSolicitud] = useState({ id_barbero: "", fecha_preferida: "", franja_preferida: "cualquiera", comentario: "" });

  const [resenia, setResenia] = useState({ documento: "", id_barbero: "", estrellas: 5, comentario: "" });
  const [enviandoResenia, setEnviandoResenia] = useState(false);
  const [msgResenia, setMsgResenia] = useState("");

  useEffect(() => {
    portalApi.get(`/portal/${subdominio}/info`).then((r) => setInfo(r.data)).catch(() => { });
    portalApi.get(`/portal/${subdominio}/barberos`).then((r) => setBarberos(r.data)).catch(() => { });
    portalApi.get(`/portal/${subdominio}/galeria`).then((r) => setGaleria(r.data)).catch(() => { });
    portalApi.get(`/portal/${subdominio}/categorias-galeria`).then((r) => setCategorias(r.data)).catch(() => { });
    portalApi.get(`/portal/${subdominio}/comentarios`).then((r) => setComentarios(r.data)).catch(() => { });
    portalApi.get(`/portal/${subdominio}/servicios`).then((r) => setServicios(r.data)).catch(() => { });
  }, [subdominio]);

  useEffect(() => {
    const onScroll = () => setNavSolido(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const destacados = galeria.filter((f) => f.destacado);

  useEffect(() => {
    if (destacados.length <= 1) return;
    const t = setInterval(() => setSlideActual((s) => (s + 1) % destacados.length), 4000);
    return () => clearInterval(t);
  }, [destacados.length]);

  const categoriasConFotos = categorias
    .map((cat) => ({ id: String(cat.id_categoria_galeria), nombre: cat.nombre, count: galeria.filter((f) => String(f.id_categoria_galeria) === String(cat.id_categoria_galeria)).length }))
    .filter((c) => c.count > 0);
  const sinCategoriaCount = galeria.filter((f) => !f.id_categoria_galeria).length;
  const tabsGaleria = [
    { id: "todos", nombre: "Todos", count: galeria.length },
    ...categoriasConFotos,
    ...(sinCategoriaCount > 0 ? [{ id: "otros", nombre: "Otros", count: sinCategoriaCount }] : []),
  ];
  const galeriaVisible =
    tabGaleria === "todos" ? galeria
      : tabGaleria === "otros" ? galeria.filter((f) => !f.id_categoria_galeria)
        : galeria.filter((f) => String(f.id_categoria_galeria) === tabGaleria);

  useEffect(() => {
    if (fotoAmpliada === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setFotoAmpliada(null);
      if (e.key === "ArrowRight") setFotoAmpliada((i) => (i + 1) % galeriaVisible.length);
      if (e.key === "ArrowLeft") setFotoAmpliada((i) => (i - 1 + galeriaVisible.length) % galeriaVisible.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fotoAmpliada, galeriaVisible.length]);

  const identificar = async (e) => {
    e.preventDefault();
    setError("");
    if (!documento.trim()) { setError("Ingresá tu número de documento"); return; }
    setCargando(true);
    try {
      const res = await portalApi.get(`/portal/${subdominio}/cliente/${documento.trim()}`);
      if (res.data.existe) { setCliente(res.data); setPaso("solicitar"); }
      else { setPaso("registro"); }
    } catch { setError("No se pudo verificar el documento."); }
    finally { setCargando(false); }
  };

  const registrarCliente = async (e) => {
    e.preventDefault();
    setError("");
    if (!registro.primer_nombre.trim() || !registro.apellidos.trim() || !registro.telefono.trim() || !registro.fecha_nacimiento) {
      setError("Completá todos los campos obligatorios"); return;
    }
    setCargando(true);
    try {
      const res = await portalApi.post(`/portal/${subdominio}/cliente`, {
        documento: documento.trim(), primer_nombre: registro.primer_nombre, apellidos: registro.apellidos,
        telefono: registro.telefono, fecha_nacimiento: registro.fecha_nacimiento, email: registro.email || null,
      });
      setCliente({ primer_nombre: res.data.primer_nombre });
      setPaso("solicitar");
    } catch (err) { setError(err.response?.data?.detail || "No se pudo registrar."); }
    finally { setCargando(false); }
  };

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await portalApi.post(`/portal/${subdominio}/solicitar`, {
        nombre_cliente: cliente.primer_nombre, telefono: registro.telefono || "0000000", documento: documento.trim(),
        id_barbero: solicitud.id_barbero ? Number(solicitud.id_barbero) : null,
        fecha_preferida: solicitud.fecha_preferida || null, franja_preferida: solicitud.franja_preferida,
        comentario: solicitud.comentario || null,
      });
      setPaso("listo");
    } catch (err) { setError(err.response?.data?.detail || "No se pudo enviar la solicitud."); }
    finally { setCargando(false); }
  };

  const enviarResenia = async (e) => {
    e.preventDefault();
    setMsgResenia("");
    if (!resenia.documento.trim()) { setMsgResenia("Ingresá tu documento para comentar"); return; }
    setEnviandoResenia(true);
    try {
      const res = await portalApi.post(`/portal/${subdominio}/comentarios`, {
        documento: resenia.documento.trim(),
        id_barbero: resenia.id_barbero ? Number(resenia.id_barbero) : null,
        estrellas: resenia.estrellas,
        comentario: resenia.comentario || null,
      });
      setMsgResenia(`¡Gracias ${res.data.nombre_cliente}! Tu comentario fue publicado.`);
      setResenia({ documento: "", id_barbero: "", estrellas: 5, comentario: "" });
      portalApi.get(`/portal/${subdominio}/comentarios`).then((r) => setComentarios(r.data)).catch(() => { });
    } catch (err) {
      setMsgResenia(err.response?.data?.detail || "No se pudo publicar el comentario.");
    } finally { setEnviandoResenia(false); }
  };

  const estrellasTexto = (n) => "★".repeat(n) + "☆".repeat(5 - n);
  const promedioEstrellas = comentarios.length
    ? (comentarios.reduce((acc, c) => acc + (c.estrellas || 0), 0) / comentarios.length).toFixed(1)
    : null;
  const resenaDestacada = comentarios
    .filter((c) => c.comentario && c.comentario.trim().length > 0)
    .sort((a, b) => (b.estrellas - a.estrellas) || (b.comentario.length - a.comentario.length))[0] || null;
  const otrasResenas = comentarios.filter((c) => c.id_valoracion !== resenaDestacada?.id_valoracion);
  const PASOS = ["documento", "registro", "solicitar", "listo"];
  const pasoIndex = PASOS.indexOf(paso === "registro" && cliente ? "solicitar" : paso);
  const redesSociales = (() => {
    try {
      const raw = JSON.parse(info?.redes_sociales || "[]");
      if (!Array.isArray(raw)) return [];
      return raw.map((r) => (typeof r === "string" ? { nombre: "Red social", url: r } : { nombre: r.nombre || r.red || "Red social", url: r.url })).filter((r) => r.url);
    } catch { return []; }
  })();

  const tieneCoordenadas = info?.latitud != null && info?.longitud != null;
  const lat = tieneCoordenadas ? Number(info.latitud) : null;
  const lng = tieneCoordenadas ? Number(info.longitud) : null;
  const bbox = tieneCoordenadas
    ? `${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}`
    : null;
  const mapaEmbedUrl = tieneCoordenadas
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
    : null;
  const comoLlegarUrl = tieneCoordenadas ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  // ============ VISTA TURNO ============
  if (vista === "turno") {
    return (
      <div className="min-h-screen bg-neutral-950 text-white px-5 py-12 flex justify-center">
        <div className="w-full max-w-md">
          <button onClick={() => { setVista("inicio"); setPaso("documento"); }} className="text-sm text-gray-400 hover:text-white transition-colors mb-5">
            ← Volver al inicio
          </button>
          <div className="bg-neutral-900 border border-white/10 rounded-[22px] overflow-hidden">
            <div className="p-7 pb-6 text-center">
              <span className="font-['IBM_Plex_Mono'] text-xs tracking-[0.16em] uppercase text-yellow-400">Boleto de turno</span>
              <h1 className="font-['Fraunces'] font-semibold text-2xl mt-2 mb-6">{info?.nombre || "Barbería"}</h1>
              <div className="flex justify-between gap-2">
                {["Documento", "Datos", "Turno", "Listo"].map((label, i) => (
                  <div key={label} className="flex flex-col items-center gap-1 flex-1">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-['IBM_Plex_Mono'] text-xs border transition-all ${i <= pasoIndex ? "bg-yellow-400 border-yellow-400 text-neutral-950 scale-110" : "bg-neutral-800 border-white/10 text-gray-500"}`}>{i + 1}</span>
                    <span className={`text-[0.65rem] uppercase tracking-wide ${i <= pasoIndex ? "text-white" : "text-gray-500"}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative border-t-2 border-dashed border-white/10">
              <span className="absolute -top-[11px] -left-[11px] w-[22px] h-[22px] rounded-full bg-neutral-950" />
              <span className="absolute -top-[11px] -right-[11px] w-[22px] h-[22px] rounded-full bg-neutral-950" />
            </div>
            <div className="p-7">
              {error && <div className={`${alert} mb-4`}>{error}</div>}
              {paso === "documento" && (
                <form onSubmit={identificar} className="flex flex-col gap-4">
                  <label className="block text-sm text-gray-400">Tu número de documento</label>
                  <input type="text" value={documento} onChange={(e) => setDocumento(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Ej: 1234567890" className={input} autoFocus />
                  <button type="submit" disabled={cargando} className={btnPrimary}>{cargando ? "Verificando…" : "Continuar"}</button>
                </form>
              )}
              {paso === "registro" && (
                <form onSubmit={registrarCliente} className="flex flex-col gap-4">
                  <p className="text-sm text-gray-400">No te encontramos en el libro de clientes. Registrate:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Nombre *" value={registro.primer_nombre} onChange={(e) => setRegistro((r) => ({ ...r, primer_nombre: e.target.value }))} className={input} />
                    <input type="text" placeholder="Apellidos *" value={registro.apellidos} onChange={(e) => setRegistro((r) => ({ ...r, apellidos: e.target.value }))} className={input} />
                  </div>
                  <input type="text" placeholder="Teléfono *" value={registro.telefono} onChange={(e) => setRegistro((r) => ({ ...r, telefono: e.target.value }))} className={input} />
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Fecha de nacimiento *</label>
                    <input type="date" value={registro.fecha_nacimiento} onChange={(e) => setRegistro((r) => ({ ...r, fecha_nacimiento: e.target.value }))} className={input} />
                  </div>
                  <input type="email" placeholder="Email (opcional)" value={registro.email} onChange={(e) => setRegistro((r) => ({ ...r, email: e.target.value }))} className={input} />
                  <button type="submit" disabled={cargando} className={btnPrimary}>{cargando ? "Registrando…" : "Registrarme y continuar"}</button>
                </form>
              )}
              {paso === "solicitar" && (
                <form onSubmit={enviarSolicitud} className="flex flex-col gap-4">
                  <p className="font-['Fraunces'] text-xl">Hola, <span className="text-yellow-400">{cliente?.primer_nombre}</span></p>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Barbero (opcional)</label>
                    <select value={solicitud.id_barbero} onChange={(e) => setSolicitud((s) => ({ ...s, id_barbero: e.target.value }))} className={input}>
                      <option value="">Cualquiera</option>
                      {barberos.map((b) => <option key={b.id_barbero} value={b.id_barbero}>{b.nombre} {b.apellido}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Día preferido (opcional)</label>
                    <input type="date" value={solicitud.fecha_preferida} onChange={(e) => setSolicitud((s) => ({ ...s, fecha_preferida: e.target.value }))} className={input} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Franja preferida</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FRANJAS.map((f) => (
                        <button key={f.valor} type="button" onClick={() => setSolicitud((s) => ({ ...s, franja_preferida: f.valor }))} className={pill(solicitud.franja_preferida === f.valor)}>{f.label}</button>
                      ))}
                    </div>
                  </div>
                  <textarea placeholder="Comentario (opcional)" value={solicitud.comentario} onChange={(e) => setSolicitud((s) => ({ ...s, comentario: e.target.value }))} rows={2} className={input} />
                  <button type="submit" disabled={cargando} className={btnPrimary}>{cargando ? "Enviando…" : "Solicitar turno"}</button>
                </form>
              )}
              {paso === "listo" && (
                <div className="text-center py-4 pb-6">
                  <div className="w-24 h-24 mx-auto mb-5 rounded-full border-2 border-yellow-400 flex items-center justify-center -rotate-[8deg] relative">
                    <span className="absolute inset-1.5 rounded-full border border-yellow-400/60" />
                    <span className="font-['Fraunces'] font-semibold text-xs uppercase tracking-wide text-yellow-400">Confirmado</span>
                  </div>
                  <h2 className="font-['Fraunces'] text-xl mb-2">Tu solicitud quedó registrada</h2>
                  <p className="text-gray-400 text-sm">Te contactaremos pronto para confirmar el horario exacto.</p>
                  <button onClick={() => { setVista("inicio"); setPaso("documento"); }} className="text-yellow-400 text-sm mt-6 hover:underline">Volver al inicio</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ VISTA INICIO ============
  return (
    <div className="min-h-screen bg-neutral-950 text-white overflow-x-hidden">

      {/* NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-40 relative flex items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-24 py-4 transition-all duration-300 ${navSolido ? "bg-neutral-950/90 backdrop-blur-md border-b border-white/10 py-3" : "bg-transparent"}`}>
        <div className="flex items-center gap-2">
          {info?.logo_url ? (
            <img src={info.logo_url} alt="logo" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <span className="w-9 h-9 rounded-full bg-yellow-400 text-neutral-950 font-['Fraunces'] font-bold flex items-center justify-center text-sm hover:rotate-12 transition-transform">
              {(info?.nombre || "B")[0]}
            </span>
          )}
          <span className="font-['Fraunces'] font-semibold text-sm sm:text-base">{info?.nombre || "Barbería"}</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#nosotros" className="relative text-gray-300 hover:text-white text-sm transition-colors group">Nosotros<span className="absolute left-0 -bottom-1 w-0 h-px bg-yellow-400 group-hover:w-full transition-all duration-300" /></a>
          <a href="#servicios" className="relative text-gray-300 hover:text-white text-sm transition-colors group">Servicios<span className="absolute left-0 -bottom-1 w-0 h-px bg-yellow-400 group-hover:w-full transition-all duration-300" /></a>
          <a href="#trabajos" className="relative text-gray-300 hover:text-white text-sm transition-colors group">Trabajos<span className="absolute left-0 -bottom-1 w-0 h-px bg-yellow-400 group-hover:w-full transition-all duration-300" /></a>
          <a href="#equipo" className="relative text-gray-300 hover:text-white text-sm transition-colors group">Equipo<span className="absolute left-0 -bottom-1 w-0 h-px bg-yellow-400 group-hover:w-full transition-all duration-300" /></a>
          <a href="#resenas" className="relative text-gray-300 hover:text-white text-sm transition-colors group">Reseñas<span className="absolute left-0 -bottom-1 w-0 h-px bg-yellow-400 group-hover:w-full transition-all duration-300" /></a>
          <Link to="/login" className="text-gray-300 hover:text-yellow-400 text-sm transition-colors">Ingresar</Link>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setVista("turno")} className="text-xs font-semibold border border-white/15 rounded-full px-4 py-2 hover:border-yellow-400 hover:text-yellow-400 hover:scale-105 transition-all">Agendar</button>
          <button
            onClick={() => setMenuMobileAbierto((v) => !v)}
            className="md:hidden w-9 h-9 flex items-center justify-center text-white"
            aria-label="Abrir menú"
          >
            {menuMobileAbierto ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        {menuMobileAbierto && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-neutral-950/98 backdrop-blur-md border-b border-white/10 flex flex-col px-6 py-4">
            <a href="#nosotros" onClick={() => setMenuMobileAbierto(false)} className="py-3 text-gray-300 hover:text-white text-sm border-b border-white/5">Nosotros</a>
            <a href="#servicios" onClick={() => setMenuMobileAbierto(false)} className="py-3 text-gray-300 hover:text-white text-sm border-b border-white/5">Servicios</a>
            <a href="#trabajos" onClick={() => setMenuMobileAbierto(false)} className="py-3 text-gray-300 hover:text-white text-sm border-b border-white/5">Trabajos</a>
            <a href="#equipo" onClick={() => setMenuMobileAbierto(false)} className="py-3 text-gray-300 hover:text-white text-sm border-b border-white/5">Equipo</a>
            <a href="#resenas" onClick={() => setMenuMobileAbierto(false)} className="py-3 text-gray-300 hover:text-white text-sm border-b border-white/5">Reseñas</a>
            <Link to="/login" onClick={() => setMenuMobileAbierto(false)} className="py-3 text-yellow-400 text-sm font-medium">Ingresar al panel</Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <header className="relative min-h-[92vh] flex items-center overflow-hidden pb-24 pt-24">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "6s" }} />
        {info?.hero_url ? (
          <img src={info.hero_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" />
            <div className="absolute inset-0 flex items-center justify-end overflow-hidden pointer-events-none select-none">
              <span className="font-['Fraunces'] font-bold text-[28vw] leading-none text-white/[0.03] -mr-[4vw] whitespace-nowrap">
                {(info?.nombre || "BARBER")[0]}
              </span>
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-neutral-950" />

        <div className={`relative z-10 ${wrap} grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center`}>
          <div className="text-left">
            <span className="inline-block font-['IBM_Plex_Mono'] text-xs tracking-[0.16em] uppercase text-yellow-400 animate-pulse mb-4">
              Barbería · Turnos online
            </span>
            <h1 className="font-['Fraunces'] font-bold uppercase text-5xl sm:text-6xl lg:text-7xl leading-[0.98] tracking-tight mb-5">
              {info?.nombre || "Tu barbería"}
            </h1>
            <p className="text-gray-300 text-lg max-w-lg mb-9">
              {info?.slogan || "Estilo y tradición, con turno asegurado."}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => setVista("turno")} className={`${btnPrimary} px-9 py-4 text-base`}>Pedir turno</button>
              <a href="#trabajos" className="text-sm text-gray-300 hover:text-white transition-colors">Ver trabajos ↓</a>
            </div>
          </div>

          {!info?.hero_url && destacados.length > 0 && (
            <div className="hidden lg:grid grid-cols-2 gap-4 h-[420px]">
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img src={destacados[0].url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="flex flex-col gap-4">
                {destacados.slice(1, 3).map((f) => (
                  <div key={f.id_foto} className="flex-1 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                    <img src={f.url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 w-6 h-10 rounded-full border border-white/15 flex justify-center pt-2">
          <span className="block w-1 h-2 rounded-full bg-yellow-400 animate-bounce" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-stretch bg-neutral-900/80 backdrop-blur-sm border-t border-white/10">
          <div className={`${wrap} !px-0 flex items-stretch w-full`}>
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-3 border-r border-white/10">
              <span className="font-['IBM_Plex_Mono'] text-[0.65rem] tracking-[0.08em] uppercase text-gray-500">Teléfono</span>
              <span className="text-sm mt-0.5">{info?.telefono || "—"}</span>
            </div>
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-3 border-r border-white/10">
              <span className="font-['IBM_Plex_Mono'] text-[0.65rem] tracking-[0.08em] uppercase text-gray-500">Email</span>
              <span className="text-sm mt-0.5">{info?.email || "—"}</span>
            </div>
            <div className="hidden sm:flex flex-1 flex-col justify-center px-6 py-3 border-r border-white/10">
              <span className="font-['IBM_Plex_Mono'] text-[0.65rem] tracking-[0.08em] uppercase text-gray-500">Horario</span>
              <span className="text-sm mt-0.5">{info?.horario || "Lun a Sáb"}</span>
            </div>
            <button onClick={() => setVista("turno")} className="flex-none bg-yellow-400 text-neutral-950 font-bold text-sm uppercase tracking-wide px-6 sm:px-9 hover:bg-yellow-300 transition-colors">
              Agendar
            </button>
          </div>
        </div>
      </header>

      {/* CIFRAS */}
      {(barberos.length > 0 || comentarios.length > 0 || categorias.length > 0) && (
        <div className="border-b border-white/10 bg-neutral-900/50">
          <div className={`${wrap} grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10`}>
            {promedioEstrellas && (
              <Reveal className="text-center py-8 px-3">
                <p className="font-['Fraunces'] font-semibold text-3xl sm:text-4xl text-yellow-400"><ContadorAnimado valor={promedioEstrellas} sufijo="★" /></p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Calificación</p>
              </Reveal>
            )}
            {comentarios.length > 0 && (
              <Reveal delay={100} className="text-center py-8 px-3">
                <p className="font-['Fraunces'] font-semibold text-3xl sm:text-4xl"><ContadorAnimado valor={comentarios.length} /></p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Reseñas</p>
              </Reveal>
            )}
            {barberos.length > 0 && (
              <Reveal delay={200} className="text-center py-8 px-3">
                <p className="font-['Fraunces'] font-semibold text-3xl sm:text-4xl"><ContadorAnimado valor={barberos.length} /></p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Barberos</p>
              </Reveal>
            )}
            {categorias.length > 0 && (
              <Reveal delay={300} className="text-center py-8 px-3">
                <p className="font-['Fraunces'] font-semibold text-3xl sm:text-4xl"><ContadorAnimado valor={categorias.length} /></p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Especialidades</p>
              </Reveal>
            )}
          </div>
        </div>
      )}

      <main className={wrap}>

        <section className="py-24 grid lg:grid-cols-2 gap-16 items-center" id="nosotros">
          <Reveal>
            <span className="font-['IBM_Plex_Mono'] text-xs tracking-[0.16em] uppercase text-yellow-400 block mb-3">Quiénes somos</span>
            <h2 className="font-['Fraunces'] font-semibold text-3xl sm:text-4xl mb-6">
              Más que un corte, una tradición
            </h2>
            {info?.historia ? (
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">{info.historia}</p>
            ) : (
              <p className="text-gray-400 leading-relaxed">
                Todavía no cargaste la historia de tu barbería. Contá tu historia desde el panel de Configuración.
              </p>
            )}
          </Reveal>
          <Reveal delay={100} className="grid grid-cols-2 gap-4">
            {info?.mision && (
              <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6">
                <span className="font-['IBM_Plex_Mono'] text-xs tracking-[0.14em] uppercase text-yellow-400 block mb-2">Misión</span>
                <p className="text-gray-300 text-sm leading-relaxed">{info.mision}</p>
              </div>
            )}
            {info?.vision && (
              <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6">
                <span className="font-['IBM_Plex_Mono'] text-xs tracking-[0.14em] uppercase text-yellow-400 block mb-2">Visión</span>
                <p className="text-gray-300 text-sm leading-relaxed">{info.vision}</p>
              </div>
            )}
          </Reveal>
        </section>

        {servicios.length > 0 && (
          <section className="py-24 grid lg:grid-cols-[0.8fr_1.2fr] gap-12" id="servicios">
            <Reveal>
              <span className="font-['IBM_Plex_Mono'] text-xs tracking-[0.16em] uppercase text-yellow-400 block mb-3">Lo que hacemos</span>
              <h2 className="font-['Fraunces'] font-semibold text-3xl sm:text-4xl mb-4">Servicios</h2>
              <p className="text-gray-400 mb-8 max-w-sm">Elegí qué te vas a hacer antes de pedir el turno, sin sorpresas de precio.</p>
              <button onClick={() => setVista("turno")} className={btnPrimary}>Pedir turno</button>
            </Reveal>
            <div className="grid sm:grid-cols-2 gap-3 content-start">
              {servicios.map((s, i) => (
                <Reveal key={s.id_servicio} delay={i * 60}>
                  <div className="flex items-center justify-between gap-4 bg-neutral-900 border border-white/10 rounded-2xl px-6 py-5 hover:border-yellow-400/50 hover:-translate-y-1 transition-all h-full">
                    <div>
                      <p className="font-['Fraunces'] font-semibold text-lg">{s.nombre}</p>
                      {(s.duracion_minutos || s.duracion) && <p className="font-['IBM_Plex_Mono'] text-xs text-gray-400 mt-1">{s.duracion_minutos || s.duracion} min</p>}
                      {s.descripcion && <p className="text-gray-400 text-sm mt-1.5">{s.descripcion}</p>}
                    </div>
                    {s.precio != null && <span className="font-['Fraunces'] font-semibold text-xl text-yellow-400 whitespace-nowrap">${s.precio}</span>}
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {galeria.length > 0 && (
          <section className="py-24" id="trabajos">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <Reveal>
                <span className="font-['IBM_Plex_Mono'] text-xs tracking-[0.16em] uppercase text-yellow-400 block mb-3">Portafolio</span>
                <h2 className="font-['Fraunces'] font-semibold text-3xl sm:text-4xl">Nuestros trabajos</h2>
              </Reveal>
              {tabsGaleria.length > 1 && (
                <Reveal delay={120} className="flex gap-2 overflow-x-auto pb-1">
                  {tabsGaleria.map((tab) => (
                    <button key={tab.id} onClick={() => setTabGaleria(tab.id)} className={pill(tabGaleria === tab.id)}>
                      {tab.nombre} <span className={tabGaleria === tab.id ? "text-neutral-950/60" : "text-gray-600"}>{tab.count}</span>
                    </button>
                  ))}
                </Reveal>
              )}
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 grid-flow-row-dense auto-rows-[90px] sm:auto-rows-[110px] gap-1">
              {galeriaVisible.map((f, i) => {
                const grande = i % 7 === 0;
                return (
                  <button key={f.id_foto} onClick={() => setFotoAmpliada(i)}
                    className={`group relative overflow-hidden bg-neutral-900 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] ${grande ? "col-span-2 row-span-2" : ""}`}
                    style={{ animationDelay: `${Math.min(i, 24) * 35}ms` }}>
                    <img src={f.url} alt={f.titulo || "Corte"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    {f.destacado && <span className="absolute top-1.5 right-1.5 text-yellow-400 text-xs drop-shadow">★</span>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {fotoAmpliada !== null && galeriaVisible[fotoAmpliada] && (
          <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center px-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setFotoAmpliada(null)}>
            <button onClick={() => setFotoAmpliada(null)} className="absolute top-5 right-5 text-white/70 hover:text-white text-3xl leading-none z-10">×</button>
            {galeriaVisible.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setFotoAmpliada((i) => (i - 1 + galeriaVisible.length) % galeriaVisible.length); }} className="absolute left-3 sm:left-6 text-white/70 hover:text-white text-4xl leading-none z-10 px-2">‹</button>
                <button onClick={(e) => { e.stopPropagation(); setFotoAmpliada((i) => (i + 1) % galeriaVisible.length); }} className="absolute right-3 sm:right-6 text-white/70 hover:text-white text-4xl leading-none z-10 px-2">›</button>
              </>
            )}
            <div className="max-w-3xl max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <img src={galeriaVisible[fotoAmpliada].url} alt={galeriaVisible[fotoAmpliada].titulo || "Corte"} className="max-w-full max-h-[75vh] object-contain rounded-lg" />
              <div className="flex items-center gap-3 mt-4 text-sm text-gray-400">
                {galeriaVisible[fotoAmpliada].titulo && <span className="text-white">{galeriaVisible[fotoAmpliada].titulo}</span>}
                <span className="font-['IBM_Plex_Mono']">{fotoAmpliada + 1} / {galeriaVisible.length}</span>
              </div>
            </div>
          </div>
        )}

        {barberos.length > 0 && (
          <section className="py-24" id="equipo">
            <Reveal className="mb-10">
              <span className="font-['IBM_Plex_Mono'] text-xs tracking-[0.16em] uppercase text-yellow-400 block mb-3">El equipo</span>
              <h2 className="font-['Fraunces'] font-semibold text-3xl sm:text-4xl">Quién te va a atender</h2>
            </Reveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {barberos.map((b, i) => (
                <Reveal key={b.id_barbero} delay={i * 70}>
                  <div className="group bg-neutral-900 border border-white/10 rounded-2xl p-6 text-center hover:border-yellow-400/40 hover:-translate-y-1.5 transition-all h-full">
                    {b.foto ? (
                      <div className="w-16 h-16 rounded-full overflow-hidden mb-3 mx-auto border-2 border-white/10 group-hover:border-yellow-400/50 transition-colors">
                        <img src={b.foto} alt={b.nombre} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-700 font-['Fraunces'] font-semibold text-xl mb-3 mx-auto group-hover:scale-110 group-hover:rotate-3 transition-transform">
                        {b.nombre?.[0]}{b.apellido?.[0]}
                      </div>
                    )}
                    <span className="font-['IBM_Plex_Mono'] text-[0.6rem] tracking-[0.1em] uppercase text-yellow-400 block mb-1">
                      {b.especialidad || "Barbero"}
                    </span>
                    <span className="font-['Fraunces'] font-semibold text-sm">{b.nombre} {b.apellido}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {tieneCoordenadas && (
          <section className="py-24">
            <Reveal className="mb-8">
              <span className="font-['IBM_Plex_Mono'] text-xs tracking-[0.16em] uppercase text-yellow-400 block mb-3">Cómo llegar</span>
              <h2 className="font-['Fraunces'] font-semibold text-3xl sm:text-4xl">Nuestra ubicación</h2>
            </Reveal>
            <Reveal delay={100} className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
              <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <p className="font-['Fraunces'] font-semibold text-lg mb-2">{info?.nombre}</p>
                  {info?.direccion && <p className="text-gray-300 text-sm mb-1">{info.direccion}</p>}
                  {info?.telefono && <p className="text-gray-400 text-sm">{info.telefono}</p>}
                </div>
                <a href={comoLlegarUrl} target="_blank" rel="noreferrer" className={`${btnPrimary} inline-block text-center mt-6`}>
                  Cómo llegar
                </a>
              </div>
              <div className="rounded-2xl overflow-hidden border border-white/10 h-80 lg:h-auto">
                <iframe
                  title="Ubicación de la barbería"
                  src={mapaEmbedUrl}
                  className="w-full h-full grayscale-[0.3] contrast-[1.1]"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
            </Reveal>
          </section>
        )}

        <section className="py-24" id="resenas">
          <Reveal className="mb-10">
            <span className="font-['IBM_Plex_Mono'] text-xs tracking-[0.16em] uppercase text-yellow-400 block mb-3">Lo que dicen</span>
            <h2 className="font-['Fraunces'] font-semibold text-3xl sm:text-4xl">Reseñas de clientes</h2>
          </Reveal>

          {comentarios.length > 0 ? (
            <div className="grid lg:grid-cols-[1fr_1fr] gap-10 mb-14">
              {resenaDestacada && (
                <Reveal>
                  <div className="lg:sticky lg:top-28">
                    <p className="font-['IBM_Plex_Mono'] text-yellow-400 text-lg mb-4">{estrellasTexto(resenaDestacada.estrellas)}</p>
                    <p className="font-['Fraunces'] text-3xl sm:text-4xl leading-snug mb-5">"{resenaDestacada.comentario}"</p>
                    <p className="text-gray-400 text-sm">
                      {resenaDestacada.nombre_cliente}
                      {resenaDestacada.nombre_barbero && ` · Atendido por ${resenaDestacada.nombre_barbero}`}
                    </p>
                  </div>
                </Reveal>
              )}
              <div className="grid sm:grid-cols-2 gap-3 content-start">
                {otrasResenas.slice(0, 6).map((c, i) => (
                  <Reveal key={c.id_valoracion} delay={i * 70}>
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors h-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{c.nombre_cliente}</span>
                        <span className="font-['IBM_Plex_Mono'] text-yellow-400 text-xs">{estrellasTexto(c.estrellas)}</span>
                      </div>
                      {c.nombre_barbero && <p className="text-xs text-gray-400 mb-1">Atendido por {c.nombre_barbero}</p>}
                      {c.comentario && <p className="text-gray-300 text-sm">{c.comentario}</p>}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 mb-14">Todavía no hay reseñas — sé el primero en dejar una.</p>
          )}

          <Reveal className="bg-neutral-900 border border-white/10 rounded-2xl p-7 max-w-md">
            <h3 className="font-['Fraunces'] font-semibold text-xl mb-4">Dejá tu comentario</h3>
            {msgResenia && <div className={`${alertBrass} mb-4`}>{msgResenia}</div>}
            <form onSubmit={enviarResenia} className="flex flex-col gap-4">
              <input type="text" placeholder="Tu documento (cédula)" value={resenia.documento} onChange={(e) => setResenia((r) => ({ ...r, documento: e.target.value.replace(/[^0-9]/g, "") }))} className={input} />
              <select value={resenia.id_barbero} onChange={(e) => setResenia((r) => ({ ...r, id_barbero: e.target.value }))} className={input}>
                <option value="">¿Qué barbero te atendió? (opcional)</option>
                {barberos.map((b) => <option key={b.id_barbero} value={b.id_barbero}>{b.nombre} {b.apellido}</option>)}
              </select>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tu calificación</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setResenia((r) => ({ ...r, estrellas: n }))} className={`text-3xl leading-none transition-transform hover:scale-125 ${n <= resenia.estrellas ? "text-yellow-400" : "text-neutral-700"}`}>★</button>
                  ))}
                </div>
              </div>
              <textarea placeholder="Tu comentario (opcional)" value={resenia.comentario} onChange={(e) => setResenia((r) => ({ ...r, comentario: e.target.value }))} rows={3} className={input} />
              <button type="submit" disabled={enviandoResenia} className={btnPrimary}>{enviandoResenia ? "Publicando…" : "Publicar comentario"}</button>
            </form>
          </Reveal>
        </section>
      </main>

      <section className="relative border-y border-white/10 bg-neutral-900/50 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "5s" }} />
        <div className={`${wrap} relative py-20 flex flex-col lg:flex-row items-center justify-between gap-6`}>
          <Reveal>
            <h2 className="font-['Fraunces'] font-semibold text-3xl sm:text-4xl mb-2">¿Listo para tu próximo corte?</h2>
            <p className="text-gray-400">Elegí barbero, día y franja horaria en menos de un minuto.</p>
          </Reveal>
          <Reveal delay={100}>
            <button onClick={() => setVista("turno")} className={`${btnPrimary} px-9 py-4 text-base whitespace-nowrap`}>Pedir turno</button>
          </Reveal>
        </div>
      </section>

      <footer className="bg-neutral-950">
        <div className={`${wrap} pt-16 pb-10 border-b border-white/10`}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="flex items-center gap-3">
              {info?.logo_url ? (
                <img src={info.logo_url} alt="logo" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <span className="w-12 h-12 rounded-full bg-yellow-400 text-neutral-950 font-['Fraunces'] font-bold flex items-center justify-center text-xl">
                  {(info?.nombre || "B")[0]}
                </span>
              )}
              <h2 className="font-['Fraunces'] font-semibold text-4xl sm:text-5xl leading-none">{info?.nombre || "Barbería"}</h2>
            </div>
            {redesSociales.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {redesSociales.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 rounded-full border border-white/15 text-gray-400 hover:text-yellow-400 hover:border-yellow-400 transition-colors">
                    {r.nombre}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`${wrap} py-12 grid grid-cols-2 sm:grid-cols-4 gap-8 sm:divide-x sm:divide-white/10`}>
          <div className="sm:pr-8">
            <h4 className="font-['IBM_Plex_Mono'] text-xs tracking-[0.14em] uppercase text-yellow-400 mb-4">Navegación</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-gray-400">
              <li><a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a></li>
              <li><a href="#servicios" className="hover:text-white transition-colors">Servicios</a></li>
              <li><a href="#trabajos" className="hover:text-white transition-colors">Trabajos</a></li>
              <li><a href="#equipo" className="hover:text-white transition-colors">Equipo</a></li>
              <li><a href="#resenas" className="hover:text-white transition-colors">Reseñas</a></li>
            </ul>
          </div>
          <div className="sm:px-8">
            <h4 className="font-['IBM_Plex_Mono'] text-xs tracking-[0.14em] uppercase text-yellow-400 mb-4">Contacto</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-gray-400">
              {info?.direccion && <li>{info.direccion}</li>}
              {info?.telefono && <li>{info.telefono}</li>}
              {info?.email && <li>{info.email}</li>}
              <li>{info?.horario || "Lun a Sáb"}</li>
            </ul>
          </div>
          <div className="sm:px-8 col-span-2 sm:col-span-1">
            <h4 className="font-['IBM_Plex_Mono'] text-xs tracking-[0.14em] uppercase text-yellow-400 mb-4">Equipo interno</h4>
            <p className="text-gray-400 text-sm mb-3">¿Trabajás acá?</p>
            <Link to="/login" className="inline-block text-sm font-semibold border border-white/15 rounded-lg px-4 py-2 hover:border-yellow-400 hover:text-yellow-400 transition-colors">
              Ingresar al panel
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className={`${wrap} py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500`}>
            <span>© {new Date().getFullYear()} {info?.nombre || "Barbería"}. Todos los derechos reservados.</span>
            <span>
              Plataforma desarrollada por{" "}
              <a href="mailto:sansley.tech-sol@outlook.com" className="text-gray-400 hover:text-yellow-400 transition-colors">
                Sansley Tech Solutions
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Portal;