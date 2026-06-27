import { useState, useEffect } from "react";
import { Plus, X, Save, QrCode, Download, ExternalLink } from "lucide-react";
import api from "../api/cliente";

const TIPOS = [
  { valor: "personalizado", label: "Personalizado" },
  { valor: "sistema", label: "Sistema" },
  { valor: "barbero", label: "Barbero" },
];

const SUGERENCIAS = [
  { nombre: "WhatsApp", ejemplo: "https://wa.me/573000000000" },
  { nombre: "Google Reviews", ejemplo: "https://g.page/r/tu-barberia/review" },
  { nombre: "Instagram", ejemplo: "https://instagram.com/tubarberia" },
];

function CodigosQR() {
  const [codigos, setCodigos] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [imagenes, setImagenes] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [panelAbierto, setPanelAbierto] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    tipo: "personalizado",
    url_destino: "",
    id_barbero: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    try {
      const [resQR, resB] = await Promise.all([
        api.get("/qr"),
        api.get("/barberos"),
      ]);
      setCodigos(resQR.data);
      setBarberos(resB.data);
      cargarImagenes(resQR.data);
    } catch (err) {
      setError("No se pudieron cargar los códigos QR");
    } finally {
      setCargando(false);
    }
  };

  const cargarImagenes = async (lista) => {
    for (const qr of lista) {
      try {
        const res = await api.get(`/qr/${qr.id_qr}/imagen`, {
          responseType: "blob",
        });
        const url = URL.createObjectURL(res.data);
        setImagenes((prev) => ({ ...prev, [qr.id_qr]: url }));
      } catch {
        // si falla una imagen, seguimos con las demás
      }
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const nombreBarbero = (id) => {
    const b = barberos.find((x) => x.id_barbero === id);
    return b ? `${b.nombre} ${b.apellido}` : null;
  };

  const labelTipo = (valor) =>
    TIPOS.find((t) => t.valor === valor)?.label || valor;

  const abrirPanel = () => {
    setForm({
      nombre: "",
      tipo: "personalizado",
      url_destino: "",
      id_barbero: "",
    });
    setErrorForm("");
    setPanelAbierto(true);
  };

  const registrar = async (e) => {
    e.preventDefault();
    setErrorForm("");
    if (!form.nombre.trim() || !form.url_destino.trim()) {
      setErrorForm("Completá el nombre y el link de destino");
      return;
    }
    setGuardando(true);
    try {
      await api.post("/qr", {
        nombre: form.nombre,
        tipo: form.tipo,
        url_destino: form.url_destino,
        id_barbero:
          form.tipo === "barbero" && form.id_barbero
            ? Number(form.id_barbero)
            : null,
      });
      setPanelAbierto(false);
      cargarDatos();
    } catch (err) {
      setErrorForm(
        err.response?.data?.detail &&
          typeof err.response.data.detail === "string"
          ? err.response.data.detail
          : "No se pudo crear el código QR",
      );
    } finally {
      setGuardando(false);
    }
  };

  const descargar = (qr) => {
    const url = imagenes[qr.id_qr];
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${qr.nombre.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Códigos QR</h1>
          <p className="text-gray-400">
            Generá QR que apunten a tus links (WhatsApp, redes, reseñas)
          </p>
        </div>
        <button
          onClick={abrirPanel}
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo código QR
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="text-center py-16 text-gray-500">
          Cargando códigos QR...
        </div>
      ) : codigos.length === 0 ? (
        <div className="bg-ink-card border border-line rounded-2xl p-12 text-center">
          <QrCode className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">Todavía no tenés códigos QR</p>
          <p className="text-gray-600 text-sm mt-1">
            Creá el primero con "Nuevo código QR"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {codigos.map((qr) => (
            <div
              key={qr.id_qr}
              className="bg-ink-card border border-line rounded-2xl p-5"
            >
              <div className="flex items-center justify-center bg-white rounded-xl p-3 mb-4">
                {imagenes[qr.id_qr] ? (
                  <img
                    src={imagenes[qr.id_qr]}
                    alt={qr.nombre}
                    className="w-40 h-40"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-gray-400 text-sm">
                    Generando...
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-semibold">{qr.nombre}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold">
                  {labelTipo(qr.tipo)}
                </span>
              </div>
              {qr.id_barbero && nombreBarbero(qr.id_barbero) && (
                <div className="text-xs text-gray-500 mb-1">
                  Barbero: {nombreBarbero(qr.id_barbero)}
                </div>
              )}
              <a
                href={qr.url_destino}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gold truncate max-w-full mb-3"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{qr.url_destino}</span>
              </a>
              <button
                onClick={() => descargar(qr)}
                disabled={!imagenes[qr.id_qr]}
                className="w-full inline-flex items-center justify-center gap-2 bg-ink border border-line text-gray-300 hover:text-white hover:border-gold/40 rounded-lg py-2 text-sm transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Descargar PNG
              </button>
            </div>
          ))}
        </div>
      )}

      {panelAbierto && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setPanelAbierto(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-ink-card border-l border-line z-50 overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-line">
              <h2 className="text-xl font-bold text-white">Nuevo código QR</h2>
              <button
                onClick={() => setPanelAbierto(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-ink rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={registrar} className="p-5 space-y-4">
              {errorForm && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                  {errorForm}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nombre: e.target.value }))
                  }
                  placeholder="Ej: WhatsApp del local"
                  className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Tipo
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tipo: e.target.value }))
                  }
                  className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold"
                >
                  {TIPOS.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.tipo === "barbero" && (
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">
                    Barbero
                  </label>
                  <select
                    value={form.id_barbero}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, id_barbero: e.target.value }))
                    }
                    className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="">Seleccionar barbero...</option>
                    {barberos.map((b) => (
                      <option key={b.id_barbero} value={b.id_barbero}>
                        {b.nombre} {b.apellido}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Link de destino *
                </label>
                <input
                  type="text"
                  value={form.url_destino}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, url_destino: e.target.value }))
                  }
                  placeholder="https://..."
                  className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold"
                  required
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">Sugerencias:</p>
                  {SUGERENCIAS.map((s) => (
                    <button
                      key={s.nombre}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          nombre: f.nombre || s.nombre,
                          url_destino: s.ejemplo,
                        }))
                      }
                      className="block text-xs text-gold hover:underline"
                    >
                      {s.nombre}: {s.ejemplo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-line">
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gold text-ink font-semibold rounded-lg py-3 hover:bg-gold-soft transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {guardando ? "Generando..." : "Crear código QR"}
                </button>
                <button
                  type="button"
                  onClick={() => setPanelAbierto(false)}
                  className="px-5 border border-line text-gray-300 hover:text-white hover:bg-ink rounded-lg py-3 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default CodigosQR;
