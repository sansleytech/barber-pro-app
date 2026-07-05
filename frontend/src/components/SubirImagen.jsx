import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import api from "../api/cliente";

/**
 * Componente reutilizable para subir una imagen.
 * Props:
 *  - valor: la URL actual de la imagen (o "")
 *  - onCambio: función que recibe la nueva URL cuando se sube
 *  - etiqueta: texto del label (opcional)
 *  - redondo: si true, muestra el preview circular (para fotos de perfil)
 */
function SubirImagen({ valor, onCambio, etiqueta = "Imagen", redondo = false }) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const seleccionar = () => inputRef.current?.click();

  const alElegir = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setError("");
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onCambio(res.data.url);
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo subir la imagen");
    } finally {
      setSubiendo(false);
      // limpiar el input para poder re-subir el mismo archivo si hace falta
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const quitar = () => onCambio("");

  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1.5">{etiqueta}</label>
      <input ref={inputRef} type="file" accept="image/*" onChange={alElegir} className="hidden" />

      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className={`${redondo ? "rounded-full" : "rounded-xl"} w-20 h-20 bg-ink border border-line flex items-center justify-center overflow-hidden shrink-0`}>
          {valor ? (
            <img src={valor} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-7 h-7 text-gray-600" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button type="button" onClick={seleccionar} disabled={subiendo}
            className="inline-flex items-center gap-2 bg-ink border border-line text-gray-300 hover:text-white hover:border-gold/40 rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50">
            <Upload className="w-4 h-4" />
            {subiendo ? "Subiendo..." : valor ? "Cambiar" : "Subir imagen"}
          </button>
          {valor && (
            <button type="button" onClick={quitar}
              className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
              <X className="w-3 h-3" /> Quitar
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}

export default SubirImagen;
