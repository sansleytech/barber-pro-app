import React from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Número de WhatsApp de soporte: código de país + número, sin "+" ni espacios.
const WHATSAPP_SOPORTE = "573116421654";

// Rutas donde el botón no se muestra (Soporte ya trae el suyo, y el superadmin sos vos).
const RUTAS_OCULTAS = ["/superadmin", "/soporte"];

function BotonWhatsApp() {
    const { pathname } = useLocation();
    const { usuario } = useAuth();

    if (RUTAS_OCULTAS.some((ruta) => pathname.startsWith(ruta))) return null;

    // El mensaje que llega precargado cambia según desde dónde escriben.
    let texto;
    if (usuario && !usuario.super_admin) {
        texto = `Hola, soy ${usuario.nombre_usuario} de la barbería "${usuario.barberia || ""}". Necesito ayuda con Barber Pro:`;
    } else if (pathname.startsWith("/portal")) {
        texto =
            "Hola, vi el portal de una barbería hecho con Barber Pro y quiero información para la mía.";
    } else {
        texto = "Hola, quiero información sobre Barber Pro para mi barbería.";
    }

    const href = `https://wa.me/${WHATSAPP_SOPORTE}?text=${encodeURIComponent(texto)}`;

    return React.createElement(
        "a",
        {
            href,
            target: "_blank",
            rel: "noreferrer",
            "aria-label": "Escribir por WhatsApp",
            title: "¿Necesitás ayuda? Escribinos por WhatsApp",
            className:
                "group fixed bottom-5 right-5 z-40 flex items-center gap-2 print:hidden",
        },
        <span
            key="etiqueta"
            className="hidden sm:block bg-ink-card border border-line text-white text-sm font-medium rounded-full px-3.5 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
        >
            ¿Necesitás ayuda?
        </span>,
        <span
            key="icono"
            className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5a] hover:scale-105 transition-all flex items-center justify-center shadow-lg shadow-black/40"
        >
            <MessageCircle className="w-7 h-7 text-white" />
        </span>,
    );
}

export default BotonWhatsApp;
