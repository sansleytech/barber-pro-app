import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/cliente";

function PagoResultado() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [estado, setEstado] = useState("consultando");

    useEffect(() => {
        let intentos = 0;
        const referencia = params.get("reference") || sessionStorage.getItem("ultima_referencia_pago");

        const consultar = async () => {
            if (!referencia) { setEstado("desconocido"); return; }
            try {
                const res = await api.get(`/pagos/estado/${referencia}`);
                if (res.data.estado === "aprobado") { setEstado("aprobado"); return; }
                if (res.data.estado === "rechazado" || res.data.estado === "error") { setEstado("rechazado"); return; }
                intentos++;
                if (intentos < 8) setTimeout(consultar, 2000);
                else setEstado("pendiente");
            } catch {
                setEstado("desconocido");
            }
        };
        consultar();
    }, [params]);

    const mensajes = {
        consultando: "Confirmando tu pago…",
        aprobado: "¡Pago aprobado! Tu plan ya está activo.",
        rechazado: "El pago no fue aprobado. Podés intentar de nuevo.",
        pendiente: "Tu pago está siendo procesado. Esto puede tardar unos minutos.",
        desconocido: "No pudimos confirmar el estado del pago. Contactanos si el cobro se realizó.",
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-6 text-center px-6">
            <p className="text-white text-lg">{mensajes[estado]}</p>
            {estado !== "consultando" && (
                <button onClick={() => navigate("/dashboard")} className="bg-gold text-ink font-semibold rounded-lg px-6 py-3">
                    Ir al panel
                </button>
            )}
        </div>
    );
}

export default PagoResultado;