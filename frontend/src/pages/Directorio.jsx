import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const api = axios.create({ baseURL: "http://localhost:8000" });

// Ícono personalizado en dorado, en vez del pin azul por defecto de Leaflet.
const iconoBarberia = new L.DivIcon({
  html: `<div style="
    width: 28px; height: 28px; border-radius: 50%;
    background: #facc15; border: 3px solid #0a0a0a;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Fórmula de Haversine: distancia real en km entre dos coordenadas.
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function Directorio() {
  const [barberias, setBarberias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ubicacionUsuario, setUbicacionUsuario] = useState(null);
  const [errorUbicacion, setErrorUbicacion] = useState("");

  useEffect(() => {
    api.get("/directorio/barberias")
      .then((res) => setBarberias(res.data))
      .finally(() => setCargando(false));
  }, []);

  const pedirUbicacion = () => {
    setErrorUbicacion("");
    if (!navigator.geolocation) {
      setErrorUbicacion("Tu navegador no soporta geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUbicacionUsuario({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setErrorUbicacion("No pudimos acceder a tu ubicación. Podés seguir viendo el mapa igual.")
    );
  };

  // Centro del mapa: Colombia en general, o el promedio de las barberías si hay datos.
  const centroDefault = [4.5709, -74.2973]; // Colombia, centrado

  const barberiasConDistancia = barberias
    .map((b) => ({
      ...b,
      distanciaKm: ubicacionUsuario
        ? calcularDistanciaKm(ubicacionUsuario.lat, ubicacionUsuario.lng, Number(b.latitud), Number(b.longitud))
        : null,
    }))
    .sort((a, b) => {
      if (a.distanciaKm == null || b.distanciaKm == null) return 0;
      return a.distanciaKm - b.distanciaKm;
    });

  if (cargando) {
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-gray-400">Cargando barberías…</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-['Fraunces'] font-bold text-3xl sm:text-4xl mb-2">Encontrá tu barbería</h1>
            <p className="text-gray-400">{barberias.length} barbería{barberias.length !== 1 ? "s" : ""} registrada{barberias.length !== 1 ? "s" : ""} en Barber Pro</p>
          </div>
          {!ubicacionUsuario && (
            <button onClick={pedirUbicacion} className="bg-yellow-400 text-neutral-950 font-semibold rounded-lg px-5 py-2.5 hover:bg-yellow-300 transition-colors">
              Usar mi ubicación
            </button>
          )}
        </div>

        {errorUbicacion && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
            {errorUbicacion}
          </div>
        )}

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
          {/* MAPA */}
          <div className="rounded-2xl overflow-hidden border border-white/10 h-[500px] lg:h-[650px]">
            <MapContainer center={ubicacionUsuario ? [ubicacionUsuario.lat, ubicacionUsuario.lng] : centroDefault} zoom={ubicacionUsuario ? 12 : 6} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {barberias.map((b) => (
                <Marker key={b.subdominio} position={[Number(b.latitud), Number(b.longitud)]} icon={iconoBarberia}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{b.nombre}</p>
                      {b.direccion && <p className="text-gray-600">{b.direccion}</p>}
                      <Link to={`/portal/${b.subdominio}`} className="text-yellow-600 underline">
                        Ver portal
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* LISTA */}
          <div className="flex flex-col gap-3 max-h-[650px] overflow-y-auto pr-1">
            {barberiasConDistancia.map((b) => (
              <Link
                key={b.subdominio}
                to={`/portal/${b.subdominio}`}
                className="bg-neutral-900 border border-white/10 rounded-2xl p-5 hover:border-yellow-400/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-['Fraunces'] font-semibold text-lg">{b.nombre}</p>
                    {b.direccion && <p className="text-gray-400 text-sm mt-1">{b.direccion}</p>}
                    {b.telefono && <p className="text-gray-500 text-xs mt-1">{b.telefono}</p>}
                  </div>
                  {b.distanciaKm != null && (
                    <span className="font-['IBM_Plex_Mono'] text-yellow-400 text-sm whitespace-nowrap">
                      {b.distanciaKm < 1 ? `${Math.round(b.distanciaKm * 1000)} m` : `${b.distanciaKm.toFixed(1)} km`}
                    </span>
                  )}
                </div>
              </Link>
            ))}
            {barberias.length === 0 && (
              <p className="text-gray-500 text-center py-10">Todavía no hay barberías con ubicación cargada.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Directorio;