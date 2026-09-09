import { useEffect } from "react";

// Recibo imprimible, reutilizable para venta de productos o turno completado.
// Uso:
// <Recibo
//   abierto={mostrarRecibo}
//   onCerrar={() => setMostrarRecibo(false)}
//   tipo="venta" // o "turno"
//   numero={venta.id_venta}
//   fecha={venta.fecha_venta}
//   cliente={{ nombre: "...", documento: "..." }}
//   atendioPor={{ nombre: "...", rol: "Vendedor" }} // o barbero
//   items={[{ nombre, cantidad, precioUnitario, subtotal }]}
//   subtotal={...}
//   iva={...}
//   total={...}
//   metodoPago="Efectivo"
//   barberia={{ nombre, nit, direccion, telefono, logo_url }}
// />

function formatCOP(monto) {
  const n = parseFloat(monto || 0);
  return "$" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

export default function Recibo({
  abierto,
  onCerrar,
  tipo = "venta", // "venta" | "turno"
  numero,
  fecha,
  cliente,
  atendioPor,
  items = [],
  subtotal,
  iva = 0,
  total,
  metodoPago,
  barberia,
}) {
  useEffect(() => {
    if (abierto) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [abierto]);

  if (!abierto) return null;

  const fechaFmt = fecha
    ? new Date(fecha).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })
    : new Date().toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center px-4 py-8 print:bg-white print:p-0">
      {/* Controles (no se imprimen) */}
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

      {/* Hoja del recibo: blanco y negro, como papel */}
      <div className="bg-white text-neutral-900 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl print:shadow-none print:rounded-none print:max-w-full print:max-h-none print:overflow-visible" id="recibo-imprimible">
        <div className="p-8 font-mono text-sm">

          {/* Encabezado */}
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

          {/* Título del comprobante */}
          <div className="text-center mb-5">
            <p className="font-bold uppercase tracking-wide">
              {tipo === "venta" ? "Comprobante de venta" : "Comprobante de servicio"}
            </p>
            <p className="text-xs text-neutral-500 mt-1">N.° {String(numero).padStart(6, "0")}</p>
            <p className="text-xs text-neutral-500">{fechaFmt}</p>
          </div>

          {/* Datos del cliente / atendió */}
          <div className="mb-5 text-xs space-y-1 pb-4 border-b border-dashed border-neutral-300">
            {cliente?.nombre && (
              <div className="flex justify-between">
                <span className="text-neutral-500">Cliente</span>
                <span className="font-semibold">{cliente.nombre}</span>
              </div>
            )}
            {cliente?.documento && (
              <div className="flex justify-between">
                <span className="text-neutral-500">Documento</span>
                <span>{cliente.documento}</span>
              </div>
            )}
            {atendioPor?.nombre && (
              <div className="flex justify-between">
                <span className="text-neutral-500">{atendioPor.rol || "Atendió"}</span>
                <span>{atendioPor.nombre}</span>
              </div>
            )}
          </div>

          {/* Ítems */}
          <div className="mb-4">
            <div className="flex justify-between text-[11px] uppercase text-neutral-500 font-semibold mb-2">
              <span>Ítem</span>
              <span>Total</span>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span>
                    {it.nombre}
                    {it.cantidad > 1 && <span className="text-neutral-500"> x{it.cantidad}</span>}
                  </span>
                  <span className="font-semibold">{formatCOP(it.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="pt-3 border-t-2 border-dashed border-neutral-300 space-y-1.5">
            <div className="flex justify-between text-xs text-neutral-600">
              <span>Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            {iva > 0 && (
              <div className="flex justify-between text-xs text-neutral-600">
                <span>IVA</span>
                <span>{formatCOP(iva)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1.5 border-t border-neutral-300">
              <span>TOTAL</span>
              <span>{formatCOP(total)}</span>
            </div>
            {metodoPago && (
              <div className="flex justify-between text-xs text-neutral-500 pt-1">
                <span>Método de pago</span>
                <span>{metodoPago}</span>
              </div>
            )}
          </div>

          {/* Pie */}
          <div className="mt-6 pt-4 border-t border-dashed border-neutral-300 text-center">
            <p className="text-[10px] text-neutral-400 leading-relaxed">
              Este documento es un comprobante interno y no constituye factura electrónica válida ante la DIAN.
            </p>
            <p className="text-[10px] text-neutral-400 mt-2">¡Gracias por tu visita!</p>
          </div>
        </div>
      </div>
    </div>
  );
}