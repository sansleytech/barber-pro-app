import { useState, useEffect, useRef } from "react";
import { CreditCard, ShieldCheck, RefreshCw } from "lucide-react";
import api from "../api/cliente";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

function Facturacion() {
  const { usuario } = useAuth();
  const { avisar } = useUI();
  const [fuente, setFuente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tokenizando, setTokenizando] = useState(false);
  const scriptCargado = useRef(false);

  const cargar = () => {
    api.get("/pagos/mi-fuente").then((r) => setFuente(r.data)).finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const cargarScriptWompi = () =>
    new Promise((resolve) => {
      if (window.WidgetCheckout) { resolve(); return; }
      if (scriptCargado.current) {
        const chequear = setInterval(() => {
          if (window.WidgetCheckout) { clearInterval(chequear); resolve(); }
        }, 100);
        return;
      }
      scriptCargado.current = true;
      const script = document.createElement("script");
      script.src = "https://checkout.wompi.co/widget.js";
      script.onload = resolve;
      document.body.appendChild(script);
    });

  const guardarTarjeta = async () => {
    setTokenizando(true);
    try {
      const res = await api.get("/pagos/public-key");
      await cargarScriptWompi();

      const checkout = new window.WidgetCheckout({
        currency: "COP",
        amountInCents: 0,
        reference: `tokenizacion_${Date.now()}`,
        publicKey: res.data.public_key,
        widgetOperation: "tokenize",
      });

       checkout.open(async (resultado) => {
        const token = resultado?.payment_source?.token || resultado?.data?.id;
        if (!token) {
          avisar("No se pudo obtener el token de la tarjeta", "error");
          setTokenizando(false);
          return;
        }
        try {
          await api.post("/pagos/guardar-fuente", { token_tarjeta: token });
          avisar("Tarjeta guardada correctamente", "exito");
          cargar();
        } catch (err) {
          avisar(err.response?.data?.detail || "No se pudo guardar la tarjeta", "error");
        } finally {
          setTokenizando(false);
        }
      });
    } catch {
      avisar("No se pudo abrir el formulario de la tarjeta", "error");
      setTokenizando(false);
    }
  };

  if (cargando) return <div className="text-center py-20 text-gray-500">Cargando...</div>;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Facturación</h1>
        <p className="text-gray-400">Gestioná el método de pago para la renovación automática de tu plan.</p>
      </div>

      <div className="bg-ink-card border border-line rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-gold" />
          <h2 className="text-white font-semibold">Método de pago para renovación</h2>
        </div>

        {fuente ? (
          <div>
            <div className="flex items-center justify-between bg-ink border border-line rounded-xl px-5 py-4 mb-4">
              <div>
                <p className="text-white font-medium">{fuente.franquicia || "Tarjeta"} •••• {fuente.ultimos_4_digitos || "----"}</p>
                <p className="text-xs text-gray-500 mt-0.5">Guardada el {new Date(fuente.fecha_creacion).toLocaleDateString("es-CO")}</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <button
              onClick={guardarTarjeta}
              disabled={tokenizando}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" /> {tokenizando ? "Abriendo formulario…" : "Cambiar tarjeta"}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-400 text-sm mb-4">
              No tenés ninguna tarjeta guardada. Guardá una para que tu plan se renueve solo, sin tener que pagar manualmente cada mes.
            </p>
            <button
              onClick={guardarTarjeta}
              disabled={tokenizando}
              className="bg-gold text-ink font-semibold rounded-lg px-5 py-3 hover:bg-gold-soft transition-colors disabled:opacity-50"
            >
              {tokenizando ? "Abriendo formulario…" : "Guardar tarjeta"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Facturacion;