import { createContext, useContext, useState, useCallback } from "react";
import { AlertTriangle, X, CheckCircle, XCircle, Info } from "lucide-react";

const UIContext = createContext(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI debe usarse dentro de UIProvider");
  return ctx;
}

export function UIProvider({ children }) {
  const [modal, setModal] = useState(null); // { titulo, mensaje, onConfirmar, textoConfirmar, peligroso, pedirTexto }
  const [textoEscrito, setTextoEscrito] = useState("");
  const [toasts, setToasts] = useState([]);
  const [aviso, setAviso] = useState(null); // { titulo, mensaje, tipo }

  // Abrir modal de confirmación. Si se pasa "pedirTexto" (ej: el nombre de
  // una barbería), el botón de confirmar queda deshabilitado hasta que el
  // usuario escriba ese texto exacto — para acciones irreversibles graves.
  const confirmar = useCallback((opciones) => {
    setTextoEscrito("");
    setModal({
      titulo: opciones.titulo || "¿Estás seguro?",
      mensaje: opciones.mensaje || "",
      textoConfirmar: opciones.textoConfirmar || "Confirmar",
      peligroso: opciones.peligroso ?? true,
      pedirTexto: opciones.pedirTexto || null,
      onConfirmar: opciones.onConfirmar || (() => {}),
    });
  }, []);

  // Mostrar modal de aviso (un solo boton OK)
  const avisar = useCallback((mensaje, tipo = "info", titulo = null) => {
    setAviso({ mensaje, tipo, titulo });
  }, []);

  // Mostrar toast temporal
  const toast = useCallback((mensaje, tipo = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  const cerrarModal = () => { setModal(null); setTextoEscrito(""); };
  const confirmarAccion = () => {
    if (modal?.pedirTexto && textoEscrito !== modal.pedirTexto) return;
    if (modal?.onConfirmar) modal.onConfirmar();
    setModal(null);
    setTextoEscrito("");
  };

  const iconoToast = { exito: CheckCircle, error: XCircle, info: Info };
  const colorToast = {
    exito: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    error: "text-red-400 border-red-500/30 bg-red-500/10",
    info: "text-gold border-gold/30 bg-gold/10",
  };

  const confirmarBloqueado = modal?.pedirTexto && textoEscrito !== modal.pedirTexto;

  return (
    <UIContext.Provider value={{ confirmar, toast, avisar }}>
      {children}

      {/* Modal de confirmación */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[100]" onClick={cerrarModal} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-ink-card border border-line rounded-2xl p-6 max-w-sm w-full pointer-events-auto shadow-2xl">
              <div className="flex items-start gap-3 mb-4">
                {modal.peligroso && (
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-white font-semibold text-lg">{modal.titulo}</h3>
                  {modal.mensaje && <p className="text-gray-400 text-sm mt-1">{modal.mensaje}</p>}
                </div>
              </div>

              {modal.pedirTexto && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1.5">
                    Escribí <span className="text-white font-semibold">{modal.pedirTexto}</span> para confirmar:
                  </p>
                  <input
                    type="text"
                    value={textoEscrito}
                    onChange={(e) => setTextoEscrito(e.target.value)}
                    autoFocus
                    className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-400"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button onClick={cerrarModal}
                  className="px-4 py-2 rounded-lg border border-line text-gray-300 hover:text-white hover:bg-ink transition-colors text-sm">
                  Cancelar
                </button>
                <button
                  onClick={confirmarAccion}
                  disabled={confirmarBloqueado}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    modal.peligroso
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-gold text-ink hover:bg-gold-soft"
                  }`}>
                  {modal.textoConfirmar}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de aviso */}
      {aviso && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[100]" onClick={() => setAviso(null)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-ink-card border border-line rounded-2xl p-6 max-w-sm w-full pointer-events-auto shadow-2xl">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  aviso.tipo === "exito" ? "bg-emerald-500/10" : aviso.tipo === "error" ? "bg-red-500/10" : "bg-gold/10"
                }`}>
                  {aviso.tipo === "exito" ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                    : aviso.tipo === "error" ? <XCircle className="w-5 h-5 text-red-400" />
                    : <Info className="w-5 h-5 text-gold" />}
                </div>
                <div>
                  {aviso.titulo && <h3 className="text-white font-semibold text-lg">{aviso.titulo}</h3>}
                  <p className="text-gray-300 text-sm mt-1">{aviso.mensaje}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setAviso(null)}
                  className="px-5 py-2 rounded-lg bg-gold text-ink font-semibold text-sm hover:bg-gold-soft transition-colors">
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-[110] flex flex-col gap-2">
        {toasts.map((t) => {
          const Icono = iconoToast[t.tipo] || Info;
          return (
            <div key={t.id}
              className={`flex items-center gap-2 border rounded-xl px-4 py-3 shadow-lg backdrop-blur ${colorToast[t.tipo] || colorToast.info} animate-in`}>
              <Icono className="w-5 h-5 shrink-0" />
              <span className="text-sm text-white">{t.mensaje}</span>
            </div>
          );
        })}
      </div>
    </UIContext.Provider>
  );
}