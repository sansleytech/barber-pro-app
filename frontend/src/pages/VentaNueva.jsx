import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft, Search, Plus, Minus, Trash2, ShoppingCart, Package,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/cliente";

// Datos de tu barbería (provisorio hasta la fase fiscal — editá con los tuyos)
const DATOS_BARBERIA = {
    nombre: "BARBER PRO",
    telefono: "300 000 0000",
    direccion: "Tu dirección, Medellín",
};

function VentaNueva() {
    const navigate = useNavigate();

    const [productos, setProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [idCliente, setIdCliente] = useState("");
    const [metodoPago, setMetodoPago] = useState("efectivo");
    const [observaciones, setObservaciones] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const cargar = async () => {
            try {
                const [resP, resC] = await Promise.all([
                    api.get("/productos"),
                    api.get("/clientes"),
                ]);
                setProductos(resP.data);
                setClientes(resC.data);
            } catch {
                setError("No se pudieron cargar los datos");
            }
        };
        cargar();
    }, []);

    const formatoPrecio = (valor) =>
        new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(valor || 0);

    const enCarrito = (idProducto) => {
        const item = carrito.find((i) => i.producto.id_producto === idProducto);
        return item ? item.cantidad : 0;
    };

    const agregar = (producto) => {
        const yaHay = enCarrito(producto.id_producto);
        if (yaHay >= producto.stock_actual) return;
        setCarrito((prev) => {
            const existe = prev.find((i) => i.producto.id_producto === producto.id_producto);
            if (existe) {
                return prev.map((i) =>
                    i.producto.id_producto === producto.id_producto
                        ? { ...i, cantidad: i.cantidad + 1 }
                        : i
                );
            }
            return [...prev, { producto, cantidad: 1 }];
        });
    };

    const quitarUno = (idProducto) => {
        setCarrito((prev) =>
            prev
                .map((i) =>
                    i.producto.id_producto === idProducto ? { ...i, cantidad: i.cantidad - 1 } : i
                )
                .filter((i) => i.cantidad > 0)
        );
    };

    const quitarTodo = (idProducto) => {
        setCarrito((prev) => prev.filter((i) => i.producto.id_producto !== idProducto));
    };

    const subtotal = carrito.reduce((acc, i) => acc + Number(i.producto.precio_venta) * i.cantidad, 0);
    const cantidadItems = carrito.reduce((acc, i) => acc + i.cantidad, 0);

    const productosFiltrados = productos.filter((p) =>
        `${p.nombre} ${p.marca || ""} ${p.codigo_barras || ""}`.toLowerCase().includes(busqueda.toLowerCase())
    );

    const nombreClienteSel = () => {
        if (!idCliente) return "Cliente ocasional";
        const c = clientes.find((x) => x.id_cliente === Number(idCliente));
        return c ? `${c.primer_nombre} ${c.apellidos}` : "Cliente";
    };

    // Genera el comprobante PDF de la venta recién hecha
    const generarComprobante = (venta) => {
        const doc = new jsPDF();

        // Encabezado: datos de la barbería
        doc.setFontSize(18);
        doc.setTextColor(0);
        doc.text(DATOS_BARBERIA.nombre, 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(110);
        doc.text(`Tel: ${DATOS_BARBERIA.telefono}`, 14, 27);
        doc.text(DATOS_BARBERIA.direccion, 14, 32);

        // Título comprobante
        doc.setFontSize(13);
        doc.setTextColor(0);
        doc.text("COMPROBANTE DE VENTA", 14, 44);
        doc.setFontSize(10);
        doc.setTextColor(110);
        const numero = venta.numero_factura || venta.id_venta;
        doc.text(`N°: ${numero}`, 14, 51);
        doc.text(`Fecha: ${new Date(venta.fecha_venta).toLocaleString("es-CO")}`, 14, 56);
        doc.text(`Cliente: ${nombreClienteSel()}`, 14, 61);
        doc.text(`Método de pago: ${metodoPago}`, 14, 66);

        // Tabla de productos
        autoTable(doc, {
            startY: 73,
            head: [["Producto", "Cant.", "P. Unit.", "Subtotal"]],
            body: carrito.map((i) => [
                i.producto.nombre,
                i.cantidad,
                formatoPrecio(i.producto.precio_venta),
                formatoPrecio(Number(i.producto.precio_venta) * i.cantidad),
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [212, 175, 55] },
        });

        // Totales (usa los que devuelve el backend, ya con IVA)
        let y = doc.lastAutoTable.finalY + 8;
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Subtotal: ${formatoPrecio(venta.subtotal)}`, 140, y);
        y += 6;
        doc.text(`IVA: ${formatoPrecio(venta.iva)}`, 140, y);
        y += 7;
        doc.setFontSize(12);
        doc.text(`TOTAL: ${formatoPrecio(venta.total)}`, 140, y);

        y += 14;
        doc.setFontSize(9);
        doc.setTextColor(130);
        doc.text("¡Gracias por tu compra!", 14, y);

        doc.save(`comprobante_${numero}.pdf`);
    };

    const cobrar = async () => {
        if (carrito.length === 0) {
            setError("Agregá al menos un producto");
            return;
        }
        setError("");
        setCargando(true);

        const datos = {
            id_cliente: idCliente ? Number(idCliente) : null,
            metodo_pago: metodoPago,
            observaciones: observaciones || null,
            items: carrito.map((i) => ({
                id_producto: i.producto.id_producto,
                cantidad: i.cantidad,
            })),
        };

        try {
            const res = await api.post("/ventas", datos);
            generarComprobante(res.data); // descarga el PDF con la venta registrada
            navigate("/ventas");
        } catch (err) {
            setError(
                err.response?.data?.detail && typeof err.response.data.detail === "string"
                    ? err.response.data.detail
                    : "No se pudo registrar la venta"
            );
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="w-full">
            <button
                onClick={() => navigate("/ventas")}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver a ventas
            </button>

            <h1 className="text-3xl font-bold text-white mb-1">Nueva venta</h1>
            <p className="text-gray-400 mb-6">Seleccioná productos y cobrá</p>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* IZQUIERDA: productos */}
                <div className="lg:col-span-2">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar producto..."
                            className="w-full bg-ink-card border border-line rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
                        />
                    </div>

                    {productosFiltrados.length === 0 ? (
                        <div className="text-center py-16 text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                            No hay productos
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {productosFiltrados.map((p) => {
                                const agotado = (p.stock_actual || 0) === 0;
                                const enCar = enCarrito(p.id_producto);
                                const sinMas = enCar >= p.stock_actual;
                                return (
                                    <button
                                        key={p.id_producto}
                                        type="button"
                                        onClick={() => agregar(p)}
                                        disabled={agotado || sinMas}
                                        className={`text-left bg-ink-card border rounded-xl p-3 transition-colors ${agotado || sinMas
                                                ? "border-line opacity-40 cursor-not-allowed"
                                                : "border-line hover:border-gold/50"
                                            }`}
                                    >
                                        <div className="h-16 flex items-center justify-center mb-2 bg-ink rounded-lg">
                                            {p.foto ? (
                                                <img src={p.foto} alt={p.nombre} className="h-full w-full object-cover rounded-lg" />
                                            ) : (
                                                <Package className="w-6 h-6 text-gray-600" />
                                            )}
                                        </div>
                                        <div className="text-white text-sm font-medium leading-tight line-clamp-2">{p.nombre}</div>
                                        <div className="text-gold text-sm font-semibold mt-1">{formatoPrecio(p.precio_venta)}</div>
                                        <div className={`text-xs mt-0.5 ${agotado ? "text-red-400" : "text-gray-500"}`}>
                                            {agotado ? "Agotado" : `Stock: ${p.stock_actual}`}
                                            {enCar > 0 && <span className="text-gold"> · {enCar} en carrito</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* DERECHA: carrito */}
                <div className="lg:col-span-1">
                    <div className="bg-ink-card border border-line rounded-2xl p-5 lg:sticky lg:top-4">
                        <div className="flex items-center gap-2 mb-4">
                            <ShoppingCart className="w-5 h-5 text-gold" />
                            <h2 className="text-white font-semibold">Carrito</h2>
                            {cantidadItems > 0 && (
                                <span className="ml-auto bg-gold text-ink text-xs font-bold px-2 py-0.5 rounded-full">
                                    {cantidadItems}
                                </span>
                            )}
                        </div>

                        {carrito.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-8">El carrito está vacío</p>
                        ) : (
                            <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                                {carrito.map((i) => (
                                    <div key={i.producto.id_producto} className="flex items-center gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white text-sm font-medium truncate">{i.producto.nombre}</div>
                                            <div className="text-xs text-gray-500">{formatoPrecio(i.producto.precio_venta)} c/u</div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => quitarUno(i.producto.id_producto)}
                                                className="p-1 text-gray-400 hover:text-white bg-ink rounded transition-colors"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="text-white text-sm w-5 text-center">{i.cantidad}</span>
                                            <button
                                                onClick={() => agregar(i.producto)}
                                                disabled={i.cantidad >= i.producto.stock_actual}
                                                className="p-1 text-gray-400 hover:text-white bg-ink rounded transition-colors disabled:opacity-30"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => quitarTodo(i.producto.id_producto)}
                                                className="p-1 text-gray-400 hover:text-red-400 ml-1 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-3 border-t border-line pt-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Cliente (opcional)</label>
                                <select
                                    value={idCliente}
                                    onChange={(e) => setIdCliente(e.target.value)}
                                    className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold"
                                >
                                    <option value="">Cliente ocasional</option>
                                    {clientes.map((c) => (
                                        <option key={c.id_cliente} value={c.id_cliente}>
                                            {c.primer_nombre} {c.apellidos}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Método de pago</label>
                                <select
                                    value={metodoPago}
                                    onChange={(e) => setMetodoPago(e.target.value)}
                                    className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold"
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="nequi">Nequi</option>
                                    <option value="daviplata">Daviplata</option>
                                </select>
                            </div>
                        </div>

                        <div className="border-t border-line mt-4 pt-4">
                            <div className="flex items-center justify-between mb-1 text-sm">
                                <span className="text-gray-400">Subtotal</span>
                                <span className="text-gray-300">{formatoPrecio(subtotal)}</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">El IVA se calcula al cobrar según tu configuración</p>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-white font-semibold">Total</span>
                                <span className="text-gold font-bold text-xl">{formatoPrecio(subtotal)}</span>
                            </div>
                            <button
                                onClick={cobrar}
                                disabled={cargando || carrito.length === 0}
                                className="w-full bg-gold text-ink font-semibold rounded-lg py-3 hover:bg-gold-soft transition-colors disabled:opacity-50"
                            >
                                {cargando ? "Procesando..." : `Cobrar ${formatoPrecio(subtotal)}`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VentaNueva;