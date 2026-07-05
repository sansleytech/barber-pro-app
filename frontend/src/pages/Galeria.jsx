import { useState, useEffect } from "react";
import { Trash2, ImagePlus } from "lucide-react";
import api from "../api/cliente";
import SubirImagen from "../components/SubirImagen";
import { useUI } from "../context/UIContext";

function Galeria() {
  const { confirmar, avisar } = useUI();
  const [fotos, setFotos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nuevaUrl, setNuevaUrl] = useState("");
  const [titulo, setTitulo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await api.get("/galeria");
      setFotos(res.data);
    } catch {
      avisar("No se pudo cargar la galería", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const agregar = async () => {
    if (!nuevaUrl) {
      avisar("Primero subí una imagen", "info");
      return;
    }
    setGuardando(true);
    try {
      await api.post("/galeria", { url: nuevaUrl, titulo: titulo || null, orden: fotos.length });
      setNuevaUrl("");
      setTitulo("");
      cargar();
      avisar("Foto agregada a la galería", "exito");
    } catch {
      avisar("No se pudo agregar la foto", "error");
    } finally {
      setGuardando(false);
    }
  };

  const borrar = (id) => {
    confirmar({
      titulo: "Eliminar foto",
      mensaje: "¿Seguro que querés eliminar esta foto de la galería?",
      textoConfirmar: "Eliminar",
      onConfirmar: async () => {
        try {
          await api.delete(`/galeria/${id}`);
          cargar();
          avisar("Foto eliminada", "exito");
        } catch {
          avisar("No se pudo eliminar la foto", "error");
        }
      },
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Galería</h1>
        <p className="text-gray-400">Fotos de cortes que se muestran en el portal público</p>
      </div>

      {/* Agregar nueva foto */}
      <div className="bg-ink-card border border-line rounded-2xl p-5 mb-6">
        <h2 className="text-white font-semibold mb-4">Agregar foto</h2>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <SubirImagen
            valor={nuevaUrl}
            onCambio={(url) => setNuevaUrl(url)}
            etiqueta="Imagen del corte"
          />
          <div className="flex-1">
            <label className="block text-sm text-gray-300 mb-1.5">Título (opcional)</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Fade clásico"
              className="w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <button
            onClick={agregar}
            disabled={guardando || !nuevaUrl}
            className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-5 py-2.5 hover:bg-gold-soft transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <ImagePlus className="w-4 h-4" />
            {guardando ? "Agregando..." : "Agregar"}
          </button>
        </div>
      </div>

      {/* Lista de fotos */}
      {cargando ? (
        <div className="text-center py-16 text-gray-500">Cargando galería...</div>
      ) : fotos.length === 0 ? (
        <div className="bg-ink-card border border-line rounded-2xl p-12 text-center">
          <ImagePlus className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">Todavía no hay fotos. Agregá la primera arriba.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotos.map((f) => (
            <div key={f.id_foto} className="group relative bg-ink-card border border-line rounded-xl overflow-hidden">
              <img src={f.url} alt={f.titulo || "Corte"} className="w-full h-40 object-cover" />
              {f.titulo && (
                <div className="p-2 text-sm text-white truncate">{f.titulo}</div>
              )}
              <button
                onClick={() => borrar(f.id_foto)}
                className="absolute top-2 right-2 bg-red-500/90 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Galeria;
