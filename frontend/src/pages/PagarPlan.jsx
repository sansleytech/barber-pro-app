import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/cliente";

function PagarPlan() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const idPlan = params.get("plan");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if (!idPlan) {
            setError("No se indicó ningún plan.");
            setCargando(false);
            return;
        }

        const iniciar = async () => {
            try {
                const res = await api.post("/pagos/iniciar", { id_plan: Number(idPlan) });
                const c = res.data.checkout;

                // Guardamos la referencia para poder consultar el estado del pago
                // cuando Wompi nos devuelva a la pantalla de resultado.
                sessionStorage.setItem("ultima_referencia_pago", c.reference);

                // Arma y envía un formulario real hacia el checkout de Wompi (redirección).
                const form = document.createElement("form");
                form.method = "GET";
                form.action = "https://checkout.wompi.co/p/";

                const campos = {
                    "public-key": c.public_key,
                    currency: c.currency,
                    "amount-in-cents": c.amount_in_cents,
                    reference: c.reference,
                    "signature:integrity": c.signature_integrity,
                    "redirect-url": c.redirect_url,
                };
                Object.entries(campos).forEach(([nombre, valor]) => {
                    const input = document.createElement("input");
                    input.type = "hidden";
                    input.name = nombre;
                    input.value = valor;
                    form.appendChild(input);
                });

                document.body.appendChild(form);
                form.submit();
            } catch (err) {
                setError(err.response?.data?.detail || "No se pudo iniciar el pago.");
                setCargando(false);
            }
        };

        iniciar();
    }, [idPlan]);

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
            Redirigiendo al pago seguro de Wompi…
        </div>
    );
}

export default PagarPlan;