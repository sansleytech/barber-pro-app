import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/cliente";

function PagarPlan() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const idPlan = params.get("plan");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(true);
    const widgetCargado = useRef(false);

    useEffect(() => {
        if (!idPlan) {
            setError("No se indicó ningún plan.");
            setCargando(false);
            return;
        }
        if (widgetCargado.current) return;
        widgetCargado.current = true;

        const iniciar = async () => {
            try {
                const res = await api.post("/pagos/iniciar", { id_plan: Number(idPlan) });
                const c = res.data.checkout;
                sessionStorage.setItem("ultima_referencia_pago", c.reference);

                // Cargamos el script del widget de Wompi (una sola vez).
                const script = document.createElement("script");
                script.src = "https://checkout.wompi.co/widget.js";
                script.onload = () => {
                    const checkout = new window.WidgetCheckout({
                        currency: c.currency,
                        amountInCents: c.amount_in_cents,
                        reference: c.reference,
                        publicKey: c.public_key,
                        signature: { integrity: c.signature_integrity },
                        redirectUrl: c.redirect_url,
                    });

                    checkout.open((resultado) => {
                        const transaccion = resultado.transaction;
                        // Guardamos referencia de la fuente de pago si Wompi la devolvió
                        // (solo pasa si el cliente tildó "guardar tarjeta").
                        if (transaccion?.payment_source_id) {
                            api.post("/pagos/guardar-fuente", {
                                id_fuente_wompi: String(transaccion.payment_source_id),
                            }).catch(() => {});
                        }
                        navigate(`/pago/resultado?ref=${c.reference}`);
                    });

                    setCargando(false);
                };
                document.body.appendChild(script);
            } catch (err) {
                setError(err.response?.data?.detail || "No se pudo iniciar el pago.");
                setCargando(false);
            }
        };

        iniciar();
    }, [idPlan, navigate]);

    if (error) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4 text-center px-6">
                <p className="text-red-400">{error}</p>
                <button onClick={() => navigate("/planes")} className="text-gold underline">
                    Volver a planes
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-gray-400">
            {cargando ? "Preparando el pago seguro…" : "Completá tus datos en la ventana de pago."}
        </div>
    );
}

export default PagarPlan;