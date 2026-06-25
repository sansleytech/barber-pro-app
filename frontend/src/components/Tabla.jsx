import { useState, useMemo } from "react";
import {
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

function Tabla({ columnas, datos, vacioTexto = "No hay registros" }) {
    const [orden, setOrden] = useState({ campo: null, asc: true });
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);

    // Ordenar los datos según la columna elegida
    const ordenados = useMemo(() => {
        if (!orden.campo) return datos;
        const copia = [...datos];
        copia.sort((a, b) => {
            const va = a[orden.campo];
            const vb = b[orden.campo];
            if (va == null) return 1;
            if (vb == null) return -1;
            if (typeof va === "number" && typeof vb === "number") {
                return orden.asc ? va - vb : vb - va;
            }
            return orden.asc
                ? String(va).localeCompare(String(vb))
                : String(vb).localeCompare(String(va));
        });
        return copia;
    }, [datos, orden]);

    // Calcular la página actual
    const totalPaginas = Math.max(1, Math.ceil(ordenados.length / porPagina));
    const paginaActual = Math.min(pagina, totalPaginas);
    const inicio = (paginaActual - 1) * porPagina;
    const visibles = ordenados.slice(inicio, inicio + porPagina);

    const cambiarOrden = (campo) => {
        setOrden((o) =>
            o.campo === campo ? { campo, asc: !o.asc } : { campo, asc: true },
        );
    };

    const IconoOrden = ({ campo }) => {
        if (orden.campo !== campo)
            return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-600" />;
        return orden.asc ? (
            <ChevronUp className="w-3.5 h-3.5 text-gold" />
        ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gold" />
        );
    };

    if (datos.length === 0) {
        return <div className="text-center py-16 text-gray-400">{vacioTexto}</div>;
    }

    return (
        <div className="bg-ink-card border border-line rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-line text-gray-400 text-sm">
                            {columnas.map((col) => (
                                <th
                                    key={col.campo}
                                    className={`px-6 py-4 font-medium ${col.oculta || ""} ${col.ordenable !== false
                                            ? "cursor-pointer select-none hover:text-white"
                                            : ""
                                        } ${col.alinear === "right" ? "text-right" : ""}`}
                                    onClick={() =>
                                        col.ordenable !== false &&
                                        col.campo &&
                                        cambiarOrden(col.campo)
                                    }
                                >
                                    <span
                                        className={`inline-flex items-center gap-1.5 ${col.alinear === "right" ? "justify-end w-full" : ""}`}
                                    >
                                        {col.titulo}
                                        {col.ordenable !== false && col.campo && (
                                            <IconoOrden campo={col.campo} />
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibles.map((fila, i) => (
                            <tr
                                key={fila.id ?? i}
                                className="border-b border-line/50 hover:bg-ink-soft/50 transition-colors"
                            >
                                {columnas.map((col) => (
                                    <td
                                        key={col.campo}
                                        className={`px-6 py-4 text-gray-300 ${col.oculta || ""} ${col.alinear === "right" ? "text-right" : ""
                                            }`}
                                    >
                                        {col.render ? col.render(fila) : fila[col.campo]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pie: selector de cantidad + paginación */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-line">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Mostrar</span>
                    <select
                        value={porPagina}
                        onChange={(e) => {
                            setPorPagina(Number(e.target.value));
                            setPagina(1);
                        }}
                        className="bg-ink border border-line rounded-lg px-2 py-1 text-white focus:outline-none focus:border-gold"
                    >
                        {[10, 20, 50, 100].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                    <span>de {ordenados.length}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPagina((p) => Math.max(1, p - 1))}
                        disabled={paginaActual === 1}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-ink-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-400">
                        Página {paginaActual} de {totalPaginas}
                    </span>
                    <button
                        onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                        disabled={paginaActual === totalPaginas}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-ink-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Tabla;
