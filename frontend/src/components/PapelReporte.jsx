import { useEffect } from "react";

// Contenedor reutilizable para cualquier pantalla que genere un reporte
// imprimible: Reportes, Estadísticas, historial de Caja, Compras, etc.
// Le da a todos el mismo "papel" — vos le pasás el contenido específico
// de cada pantalla como children.
//
// Uso:
// <PapelReporte
//   abierto={mostrarReporte}
//   onCerrar={() => setMostrarReporte(false)}
//   titulo="Historial de cierres"
//   subtitulo="Del 1 al 30 de junio de 2026"
//   barberia={{ nombre, nit, direccion, telefono, logo_url }}
// >
//   {/* acá va lo específico de cada pantalla: tabla, stats, lo que sea */}
// </PapelReporte>

export default function PapelReporte({ abierto, onCerrar, titulo, subtitulo, barberia, children }) {
    useEffect(() => {
        if (abierto) document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, [abierto]);

    if (!abierto) return null;

    const fechaGeneracion = new Date().toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

    return (
        <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center px-4 py-8 print:bg-white print:p-0">
            <div className="fixed top-4 right-4 flex gap-2 print:hidden z-10">
                <button
                    onClick={() => window.print()}
                    className="bg-yellow-400 text-neutral-950 font-semibold text-sm rounded-lg px-4 py-2 hover:bg-yellow-300 transition-colors"
                >
                    Imprimir
                </button>
                <button
                    onClick={onCerrar}
                    className="bg-neutral-800 text-white text-sm rounded-lg px-4 py-2 hover:bg-neutral-700 transition-colors border border-white/10"
                >
                    Cerrar
                </button>
            </div>

            <div
                className="bg-white text-neutral-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl print:shadow-none print:rounded-none print:max-w-full print:max-h-none print:overflow-visible"
                id="recibo-imprimible"
            >
                <div className="p-8 font-mono text-sm">

                    {/* Encabezado — mismo para todos los reportes */}
                    <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-neutral-300">
                        {barberia?.logo_url && (
                            <img
                                src={barberia.logo_url}
                                alt="Logo"
                                className="w-14 h-14 rounded-full object-cover mx-auto mb-3 border border-neutral-300"
                            />
                        )}
                        <p className="font-bold text-base uppercase">{barberia?.nombre || "Barbería"}</p>
                        {barberia?.nit && <p className="text-xs text-neutral-600">NIT: {barberia.nit}</p>}
                        {barberia?.direccion && <p className="text-xs text-neutral-600">{barberia.direccion}</p>}
                        {barberia?.telefono && <p className="text-xs text-neutral-600">Tel: {barberia.telefono}</p>}
                    </div>

                    {/* Título del reporte */}
                    <div className="text-center mb-6">
                        <p className="font-bold uppercase tracking-wide">{titulo}</p>
                        {subtitulo && <p className="text-xs text-neutral-500 mt-1">{subtitulo}</p>}
                        <p className="text-[10px] text-neutral-400 mt-1">Generado el {fechaGeneracion}</p>
                    </div>

                    {/* Contenido específico de cada pantalla */}
                    <div className="mb-4">{children}</div>

                    {/* Pie */}
                    <div className="mt-6 pt-4 border-t border-dashed border-neutral-300 text-center">
                        <p className="text-[10px] text-neutral-400 leading-relaxed">
                            Reporte interno de Barber Pro — no constituye documento tributario.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}