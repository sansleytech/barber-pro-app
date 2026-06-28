import { useState, useEffect } from "react";
import {
  Store,
  Receipt,
  Share2,
  MessageSquare,
  Save,
  Check,
  Plus,
  Trash2,
  Globe,
  MessageCircle,
  Link as LinkIcon,
} from "lucide-react";
import api from "../api/cliente";

const MONEDAS = [
  { codigo: "COP", nombre: "Peso colombiano (COP)" },
  { codigo: "USD", nombre: "Dólar estadounidense (USD)" },
  { codigo: "EUR", nombre: "Euro (EUR)" },
  { codigo: "MXN", nombre: "Peso mexicano (MXN)" },
  { codigo: "ARS", nombre: "Peso argentino (ARS)" },
  { codigo: "CLP", nombre: "Peso chileno (CLP)" },
  { codigo: "PEN", nombre: "Sol peruano (PEN)" },
  { codigo: "BRL", nombre: "Real brasileño (BRL)" },
  { codigo: "UYU", nombre: "Peso uruguayo (UYU)" },
  { codigo: "BOB", nombre: "Boliviano (BOB)" },
  { codigo: "GTQ", nombre: "Quetzal (GTQ)" },
  { codigo: "DOP", nombre: "Peso dominicano (DOP)" },
];

const TIPOS_RED = [
  { tipo: "instagram", nombre: "Instagram", color: "text-pink-400" },
  { tipo: "facebook", nombre: "Facebook", color: "text-blue-400" },
  { tipo: "whatsapp", nombre: "WhatsApp", color: "text-emerald-400" },
  { tipo: "tiktok", nombre: "TikTok", color: "text-white" },
  { tipo: "youtube", nombre: "YouTube", color: "text-red-400" },
  { tipo: "twitter", nombre: "X / Twitter", color: "text-sky-400" },
  { tipo: "web", nombre: "Sitio web", color: "text-amber-400" },
];

const TABS = [
  { id: "negocio", nombre: "Negocio", icono: Store },
  { id: "facturacion", nombre: "Facturación", icono: Receipt },
  { id: "redes", nombre: "Redes", icono: Share2 },
  { id: "mensajes", nombre: "Mensajes", icono: MessageSquare },
];

function Configuracion() {
  const [tab, setTab] = useState("negocio");
  const [valores, setValores] = useState({});
  const [original, setOriginal] = useState({});
  const [redes, setRedes] = useState([]); // [{tipo, url}]
  const [redesOriginal, setRedesOriginal] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [guardadoOk, setGuardadoOk] = useState(false);

  const [nuevaRedTipo, setNuevaRedTipo] = useState("instagram");
  const [nuevaRedUrl, setNuevaRedUrl] = useState("");

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setError("");
      try {
        const res = await api.get("/configuracion");
        const obj = {};
        res.data.forEach((item) => {
          obj[item.clave] = item.valor ?? "";
        });
        setValores(obj);
        setOriginal(obj);

        const redesRaw = obj["redes_sociales"];
        if (redesRaw) {
          try {
            const parsed = JSON.parse(redesRaw);
            setRedes(Array.isArray(parsed) ? parsed : []);
          } catch {
            setRedes([]);
          }
        }
        setRedesOriginal(redesRaw || "");
      } catch (err) {
        setError("No se pudo cargar la configuración");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const cambiar = (clave, valor) => {
    setValores((v) => ({ ...v, [clave]: valor }));
    setGuardadoOk(false);
  };

  const agregarRed = () => {
    if (!nuevaRedUrl.trim()) return;
    setRedes((r) => [...r, { tipo: nuevaRedTipo, url: nuevaRedUrl.trim() }]);
    setNuevaRedUrl("");
    setGuardadoOk(false);
  };

  const quitarRed = (i) => {
    setRedes((r) => r.filter((_, idx) => idx !== i));
    setGuardadoOk(false);
  };

  const infoRed = (tipo) =>
    TIPOS_RED.find((t) => t.tipo === tipo) || TIPOS_RED[6];

  const guardar = async () => {
    setGuardando(true);
    setError("");
    setGuardadoOk(false);

    const cambios = [];
    Object.keys(valores).forEach((clave) => {
      if (valores[clave] !== (original[clave] ?? "")) {
        cambios.push({ clave, valor: String(valores[clave] ?? "") });
      }
    });
    const redesJson = JSON.stringify(redes);
    if (redesJson !== redesOriginal) {
      cambios.push({ clave: "redes_sociales", valor: redesJson });
    }

    const fallidos = [];
    for (const c of cambios) {
      try {
        await api.put(`/configuracion/${c.clave}`, { valor: c.valor });
      } catch (err) {
        fallidos.push(c.clave);
      }
    }

    if (fallidos.length > 0) {
      setError(`No se pudieron guardar: ${fallidos.join(", ")}`);
    } else {
      setOriginal({ ...valores });
      setRedesOriginal(redesJson);
      setGuardadoOk(true);
    }
    setGuardando(false);
  };

  const hayCambios =
    Object.keys(valores).some(
      (clave) => valores[clave] !== (original[clave] ?? ""),
    ) || JSON.stringify(redes) !== redesOriginal;

  if (cargando) {
    return (
      <div className="text-center py-20 text-gray-500">
        Cargando configuración...
      </div>
    );
  }

  const inputClase =
    "w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold";

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Configuración</h1>
        <p className="text-gray-400">Ajustes generales de tu barbería</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-ink-card border border-line rounded-xl mb-6 overflow-x-auto">
        {TABS.map((t) => {
          const Icono = t.icono;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t.id
                  ? "bg-gold text-ink"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Icono className="w-4 h-4" />
              {t.nombre}
            </button>
          );
        })}
      </div>

      <div className="bg-ink-card border border-line rounded-2xl p-6 mb-6">
        {/* NEGOCIO */}
        {tab === "negocio" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Nombre de la barbería
              </label>
              <input
                type="text"
                value={valores.negocio_nombre ?? ""}
                onChange={(e) => cambiar("negocio_nombre", e.target.value)}
                placeholder="Barber Pro"
                className={inputClase}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={valores.negocio_telefono ?? ""}
                  onChange={(e) => cambiar("negocio_telefono", e.target.value)}
                  placeholder="300 000 0000"
                  className={inputClase}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Email
                </label>
                <input
                  type="text"
                  value={valores.negocio_email ?? ""}
                  onChange={(e) => cambiar("negocio_email", e.target.value)}
                  placeholder="contacto@barberpro.com"
                  className={inputClase}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Dirección
                </label>
                <input
                  type="text"
                  value={valores.negocio_direccion ?? ""}
                  onChange={(e) => cambiar("negocio_direccion", e.target.value)}
                  placeholder="Calle 00 #00-00"
                  className={inputClase}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={valores.negocio_ciudad ?? ""}
                  onChange={(e) => cambiar("negocio_ciudad", e.target.value)}
                  placeholder="Medellín"
                  className={inputClase}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  NIT
                </label>
                <input
                  type="text"
                  value={valores.negocio_nit ?? ""}
                  onChange={(e) => cambiar("negocio_nit", e.target.value)}
                  placeholder="900123456-7"
                  className={inputClase}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Razón social
                </label>
                <input
                  type="text"
                  value={valores.negocio_razon_social ?? ""}
                  onChange={(e) =>
                    cambiar("negocio_razon_social", e.target.value)
                  }
                  placeholder="Inversiones Barber SAS"
                  className={inputClase}
                />
              </div>
            </div>
          </div>
        )}

        {/* FACTURACIÓN */}
        {tab === "facturacion" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">¿Aplica IVA?</div>
                <div className="text-xs text-gray-500">
                  Si está activo, las ventas calculan IVA
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  cambiar(
                    "aplica_iva",
                    valores.aplica_iva === "true" ? "false" : "true",
                  )
                }
                className={`relative w-12 h-6 rounded-full transition-colors ${valores.aplica_iva === "true" ? "bg-gold" : "bg-line"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${valores.aplica_iva === "true" ? "translate-x-6" : ""}`}
                />
              </button>
            </div>

            {valores.aplica_iva === "true" && (
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Porcentaje de IVA (%)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={valores.porcentaje_iva ?? ""}
                  onChange={(e) =>
                    cambiar(
                      "porcentaje_iva",
                      e.target.value.replace(/[^0-9.]/g, ""),
                    )
                  }
                  placeholder="19"
                  className={`${inputClase} max-w-[150px]`}
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Moneda
              </label>
              <select
                value={valores.moneda ?? "COP"}
                onChange={(e) => cambiar("moneda", e.target.value)}
                className={`${inputClase} max-w-sm`}
              >
                {MONEDAS.map((m) => (
                  <option key={m.codigo} value={m.codigo}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* REDES */}
        {tab === "redes" && (
          <div className="space-y-5">
            <p className="text-sm text-gray-400">
              Agregá las redes que quieras con su link.
            </p>

            {redes.length > 0 && (
              <div className="space-y-2">
                {redes.map((r, i) => {
                  const info = infoRed(r.tipo);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-ink border border-line rounded-lg px-4 py-3"
                    >
                      <LinkIcon className={`w-5 h-5 ${info.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium">
                          {info.nombre}
                        </div>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-gray-500 hover:text-gold truncate block"
                        >
                          {r.url}
                        </a>
                      </div>
                      <button
                        onClick={() => quitarRed(i)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t border-line pt-4">
              <label className="block text-sm text-gray-300 mb-2">
                Agregar red
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={nuevaRedTipo}
                  onChange={(e) => setNuevaRedTipo(e.target.value)}
                  className={`${inputClase} sm:max-w-[160px]`}
                >
                  {TIPOS_RED.map((t) => (
                    <option key={t.tipo} value={t.tipo}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={nuevaRedUrl}
                  onChange={(e) => setNuevaRedUrl(e.target.value)}
                  placeholder="https://instagram.com/tubarberia"
                  className={`${inputClase} flex-1`}
                />
                <button
                  onClick={agregarRed}
                  className="inline-flex items-center justify-center gap-1 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MENSAJES */}
        {tab === "mensajes" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Pie de comprobante
              </label>
              <textarea
                value={valores.msg_pie_comprobante ?? ""}
                onChange={(e) => cambiar("msg_pie_comprobante", e.target.value)}
                rows={3}
                placeholder="¡Gracias por su visita!"
                className={inputClase}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Mensaje de confirmación de turno
              </label>
              <textarea
                value={valores.msg_confirmacion_turno ?? ""}
                onChange={(e) =>
                  cambiar("msg_confirmacion_turno", e.target.value)
                }
                rows={3}
                placeholder="Le confirmamos su turno..."
                className={inputClase}
              />
            </div>
          </div>
        )}
      </div>

      {/* Barra de guardar */}
      <div className="sticky bottom-0 bg-ink/80 backdrop-blur py-4 flex items-center gap-3">
        <button
          onClick={guardar}
          disabled={guardando || !hayCambios}
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold-soft transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
        {guardadoOk && (
          <span className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
            <Check className="w-4 h-4" /> Guardado correctamente
          </span>
        )}
        {hayCambios && !guardadoOk && (
          <span className="text-gray-500 text-sm">
            Tenés cambios sin guardar
          </span>
        )}
      </div>
    </div>
  );
}

export default Configuracion;
