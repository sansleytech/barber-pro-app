import { useState } from "react";
import React from "react";
import { MessageCircle, Send, LifeBuoy, Check } from "lucide-react";
import api from "../api/cliente";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

// Número de WhatsApp de soporte: código de país + número, sin "+" ni espacios.
const WHATSAPP_SOPORTE = "573116421654";
const whatsappConfigurado = /^\d{10,15}$/.test(WHATSAPP_SOPORTE);

function Soporte() {
    const { usuario } = useAuth();
    const { avisar } = useUI();

    const [asunto, setAsunto] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [emailRespuesta, setEmailRespuesta] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState("");

    const textoWhatsApp = `Hola, soy ${usuario?.nombre_usuario || ""} de la barbería "${usuario?.barberia || ""}". Necesito ayuda con Barber Pro:`;
    const linkWhatsApp = `https://wa.me/${WHATSAPP_SOPORTE}?text=${encodeURIComponent(textoWhatsApp)}`;

    const enviar = async (e) => {
        e.preventDefault();
        setError("");

        if (asunto.trim().length < 3) {
            setError("Escribí un asunto de al menos 3 caracteres");
            return;
        }
        if (mensaje.trim().length < 10) {
            setError(
                "Contanos un poco más: el mensaje debe tener al menos 10 caracteres",
            );
            return;
        }

        setEnviando(true);
        try {
            await api.post("/soporte", {
                asunto: asunto.trim(),
                mensaje: mensaje.trim(),
                email_respuesta: emailRespuesta.trim() || null,
            });
            setEnviado(true);
            setAsunto("");
            setMensaje("");
            avisar(
                "Mensaje enviado. Te vamos a responder lo antes posible.",
                "exito",
            );
        } catch (err) {
            const detalle = err.response?.data?.detail;
            setError(
                typeof detalle === "string"
                    ? detalle
                    : "No se pudo enviar el mensaje. Intentá de nuevo.",
            );
        } finally {
            setEnviando(false);
        }
    };

    const inputClase =
        "w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors";

    return (
        <div className="w-full max-w-4xl">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                        <LifeBuoy className="w-5 h-5 text-gold" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Soporte</h1>
                </div>
                <p className="text-gray-400">
                    ¿Tenés una duda o algo no funciona como esperabas?
                    Escribinos y te ayudamos.
                </p>
            </div>

            <div
                className={`grid gap-6 ${whatsappConfigurado ? "lg:grid-cols-[1fr_1.4fr]" : ""}`}
            >
                {whatsappConfigurado && (
                    <div className="bg-ink-card border border-line rounded-2xl p-6 h-fit">
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                            <MessageCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h2 className="text-white font-semibold text-lg mb-1">
                            Por WhatsApp
                        </h2>
                        <p className="text-gray-400 text-sm mb-5">
                            La forma más rápida de hablar directo con nosotros.
                            Ya te dejamos escrito tu nombre y tu barbería.
                        </p>
                        {React.createElement(
                            "a",
                            {
                                href: linkWhatsApp,
                                target: "_blank",
                                rel: "noreferrer",
                                className:
                                    "inline-flex items-center gap-2 bg-emerald-500 text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-emerald-600 transition-colors",
                            },
                            <MessageCircle className="w-4 h-4" />,
                            "Escribir por WhatsApp",
                        )}
                    </div>
                )}

                <div className="bg-ink-card border border-line rounded-2xl p-6">
                    <h2 className="text-white font-semibold text-lg mb-1">
                        Enviar un mensaje
                    </h2>
                    <p className="text-gray-400 text-sm mb-5">
                        Te respondemos por email. Incluimos automáticamente el
                        nombre de tu barbería y tu plan.
                    </p>

                    {enviado ? (
                        <div className="text-center py-8">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                <Check className="w-7 h-7 text-emerald-400" />
                            </div>
                            <h3 className="text-white font-semibold mb-1">
                                ¡Mensaje enviado!
                            </h3>
                            <p className="text-gray-400 text-sm mb-5">
                                Te vamos a responder lo antes posible.
                            </p>
                            <button
                                type="button"
                                onClick={() => setEnviado(false)}
                                className="text-gold text-sm font-medium hover:underline"
                            >
                                Enviar otro mensaje
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={enviar}
                            className="space-y-4"
                            noValidate
                        >
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm text-gray-300 mb-1.5">
                                    Asunto
                                </label>
                                <input
                                    type="text"
                                    value={asunto}
                                    onChange={(e) => setAsunto(e.target.value)}
                                    maxLength={120}
                                    placeholder="Ej: No me deja agregar un barbero"
                                    className={inputClase}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-300 mb-1.5">
                                    ¿Qué necesitás?
                                </label>
                                <textarea
                                    value={mensaje}
                                    onChange={(e) => setMensaje(e.target.value)}
                                    maxLength={2000}
                                    rows={6}
                                    placeholder="Contanos con el mayor detalle posible qué pasó o qué duda tenés."
                                    className={inputClase}
                                />
                                <p className="text-xs text-gray-600 mt-1 text-right">
                                    {mensaje.length}/2000
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-300 mb-1.5">
                                    Email para responderte (opcional)
                                </label>
                                <input
                                    type="email"
                                    value={emailRespuesta}
                                    onChange={(e) =>
                                        setEmailRespuesta(e.target.value)
                                    }
                                    placeholder="tucorreo@ejemplo.com"
                                    className={inputClase}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={enviando}
                                className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold-soft transition-colors disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                                {enviando ? "Enviando..." : "Enviar mensaje"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Soporte;
