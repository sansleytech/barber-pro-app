import { useState, useEffect } from "react";
import { Trash2, ImagePlus, Star, FolderPlus, X } from "lucide-react";
import api from "../api/cliente";
import SubirImagen from "../components/SubirImagen";
import { useUI } from "../context/UIContext";

function Galeria() {
  const { confirmar, avisar } = useUI();
  const [fotos, setFotos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Form de nueva foto
  const [nuevaUrl, setNuevaUrl] = useState("");
  const [titulo, setTitulo] = useState("");
  const [categoriaSel, setCategoriaSel] = useState("");
  const [destacado, setDestacado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Crear categoría
  const [nombreCategoria, setNombreCategoria] = useState("");

  // Filtro de la grilla
  const [filtroCat, setFiltroCat] = useState("");

  const cargar = async () => {
    setCargando(true);
    try {
      const [resFotos, resCat] = await Promise.all([
        api.get("/galeria"),
        api.get("/categorias-galeria"),
      ]);
      setFotos(resFotos.data);
      setCategorias(resCat.data);
    } catch {
      avisar("No se pudo cargar la galería", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  // Nombre de una categoría por su id
  const nombreCat = (id) => {
    const c = categorias.find((x) => x.id_categoria_galeria === id);
    return c ? c.nombre : null;
  };

  const crearCategoria = async () => {
    if (!nombreCategoria.trim()) {
      avisar("Escribí un nombre para la categoría", "info");
      return;
    }
    try {
      await api.post("/categorias-galeria", {
        nombre: nombreCategoria.trim(),
        orden: categorias.length,
      });
      setNombreCategoria("");
      cargar();
      avisar("Categoría creada", "exito");
    } catch {
      avisar("No se pudo crear la categoría", "error");
    }
  };

  const borrarCategoria = (cat) => {
    confirmar({
      titulo: "Eliminar categoría",
      mensaje: `¿Eliminar la categoría "${cat.nombre}"? Las fotos no se borran, solo quedan sin categoría.`,
      textoConfirmar: "Eliminar",
      onConfirmar: async () => {
        try {
          await api.delete(`/categorias-galeria/${cat.id_categoria_galeria}`);
          if (filtroCat === String(cat.id_categoria_galeria)) setFiltroCat("");
          cargar();
          avisar("Categoría eliminada", "exito");
        } catch {
          avisar("No se pudo eliminar la categoría", "error");
        }
      },
    });
  };

  const agregar = async () => {
    if (!nuevaUrl) {
      avisar("Primero subí una imagen", "info");
      return;
    }
    setGuardando(true);
    try {
      await api.post("/galeria", {
        url: nuevaUrl,
        titulo: titulo || null,
        id_categoria_galeria: categoriaSel ? Number(categoriaSel) : null,
        destacado: destacado,
        orden: fotos.length,
      });
      setNuevaUrl("");
      setTitulo("");
      setCategoriaSel("");
      setDestacado(false);
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

  // Marcar/desmarcar destacado desde la grilla
  const toggleDestacado = async (foto) => {
    try {
      await api.patch(`/galeria/${foto.id_foto}`, { destacado: !foto.destacado });
      cargar();
    } catch {
      avisar("No se pudo actualizar", "error");
    }
  };

  // Fotos filtradas por categoría
  const fotosMostradas = filtroCat
    ? fotos.filter((f) => String(f.id_categoria_galeria) === filtroCat)
    : fotos;

  const inputClase =
    "w-full bg-ink border border-line rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Galería</h1>
        <p className="text-gray-400">Fotos de cortes que se muestran en el portal público</p>
      </div>

      {/* Gestión de categorías */}
      <div className="bg-ink-card border border-line rounded-2xl p-5 mb-6">
        <h2 className="text-white font-semibold mb-4">Categorías</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={nombreCategoria}
            onChange={(e) => setNombreCategoria(e.target.value)}
            placeholder="Ej: Cortes, Barba, Tintes..."
            className={inputClase}
            onKeyDown={(e) => e.key === "Enter" && crearCategoria()}
          />
          <button
            onClick={crearCategoria}
            className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors whitespace-nowrap"
          >
            <FolderPlus className="w-4 h-4" />
            Crear
          </button>
        </div>
        {categorias.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <span
                key={cat.id_categoria_galeria}
                className="inline-flex items-center gap-1.5 bg-ink border border-line rounded-full px-3 py-1.5 text-sm text-gray-300"
              >
                {cat.nombre}
                <button
                  onClick={() => borrarCategoria(cat)}
                  className="text-gray-500 hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Agregar nueva foto */}
      <div className="bg-ink-card border border-line rounded-2xl p-5 mb-6">
        <h2 className="text-white font-semibold mb-4">Agregar foto</h2>
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
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
              className={inputClase}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-300 mb-1.5">Categoría</label>
            <select
              value={categoriaSel}
              onChange={(e) => setCategoriaSel(e.target.value)}
              className={inputClase}
            >
              <option value="">Sin categoría</option>
              {categorias.map((cat) => (
                <option key={cat.id_categoria_galeria} value={cat.id_categoria_galeria}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer whitespace-nowrap pb-2.5">
            <input
              type="checkbox"
              checked={destacado}
              onChange={(e) => setDestacado(e.target.checked)}
              className="w-4 h-4 accent-yellow-400"
            />
            Destacado
          </label>
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

      {/* Filtro por categoría */}
      {categorias.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFiltroCat("")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtroCat === "" ? "bg-gold text-ink" : "bg-ink-card text-gray-400 border border-line"
            }`}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id_categoria_galeria}
              onClick={() => setFiltroCat(String(cat.id_categoria_galeria))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filtroCat === String(cat.id_categoria_galeria)
                  ? "bg-gold text-ink"
                  : "bg-ink-card text-gray-400 border border-line"
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Lista de fotos */}
      {cargando ? (
        <div className="text-center py-16 text-gray-500">Cargando galería...</div>
      ) : fotosMostradas.length === 0 ? (
        <div className="bg-ink-card border border-line rounded-2xl p-12 text-center">
          <ImagePlus className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">
            {fotos.length === 0 ? "Todavía no hay fotos. Agregá la primera arriba." : "No hay fotos en esta categoría."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotosMostradas.map((f) => (
            <div key={f.id_foto} className="group relative bg-ink-card border border-line rounded-xl overflow-hidden">
              <img src={f.url} alt={f.titulo || "Corte"} className="w-full h-40 object-cover" />
              <div className="p-2">
                {f.titulo && <div className="text-sm text-white truncate">{f.titulo}</div>}
                {nombreCat(f.id_categoria_galeria) && (
                  <div className="text-xs text-gray-500">{nombreCat(f.id_categoria_galeria)}</div>
                )}
              </div>
              {/* Botón destacado */}
              <button
                onClick={() => toggleDestacado(f)}
                className={`absolute top-2 left-2 rounded-lg p-1.5 transition-colors ${
                  f.destacado ? "bg-gold text-ink" : "bg-black/50 text-white opacity-0 group-hover:opacity-100"
                }`}
                title={f.destacado ? "Quitar de destacados" : "Marcar como destacado"}
              >
                <Star className={`w-4 h-4 ${f.destacado ? "fill-ink" : ""}`} />
              </button>
              {/* Botón borrar */}
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
