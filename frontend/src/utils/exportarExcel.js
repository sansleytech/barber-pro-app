import * as XLSX from "xlsx";

// Exporta un array de objetos a un archivo .xlsx descargable, en una sola hoja.
// Uso: exportarExcel(compras.map(c => ({ Fecha: c.fecha_compra, Producto: ... })), "compras")
export function exportarExcel(filas, nombreArchivo, nombreHoja = "Datos") {
    if (!filas || filas.length === 0) return;
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);
    XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
}

// Exporta varias tablas en un mismo archivo .xlsx, cada una en su propia hoja.
// Uso: exportarExcelMultiHoja([
//   { nombreHoja: "Ranking", filas: [...] },
//   { nombreHoja: "Servicios", filas: [...] },
// ], "reporte-barberpro")
export function exportarExcelMultiHoja(hojas, nombreArchivo) {
    const libro = XLSX.utils.book_new();
    hojas.forEach(({ nombreHoja, filas }) => {
        if (!filas || filas.length === 0) return;
        const hoja = XLSX.utils.json_to_sheet(filas);
        XLSX.utils.book_append_sheet(libro, hoja, nombreHoja.slice(0, 31)); // Excel limita a 31 caracteres
    });
    XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
}