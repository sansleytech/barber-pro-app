"""Geocodificación de direcciones (búsqueda de coordenadas), vía Nominatim
(OpenStreetMap) — gratis, sin necesitar una API key de Google."""

import requests
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/geocodificar", tags=["Geocodificación"])

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
# Nominatim exige identificar la app con un User-Agent real, no genérico.
HEADERS = {"User-Agent": "BarberProApp/1.0 (contacto: sansley.tech-sol@outlook.com)"}


@router.get("")
def buscar_direccion(q: str):
    """Busca una dirección y devuelve hasta 5 coincidencias con su
    latitud/longitud, para que el usuario elija la correcta."""
    texto = (q or "").strip()
    if len(texto) < 4:
        raise HTTPException(status_code=400, detail="Escribí al menos 4 caracteres")

    try:
        respuesta = requests.get(
            NOMINATIM_URL,
            params={
                "q": texto,
                "format": "json",
                "addressdetails": 1,
                "limit": 5,
                "countrycodes": "co",  # quitá esta línea si operás fuera de Colombia
            },
            headers=HEADERS,
            timeout=10,
        )
        respuesta.raise_for_status()
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="No se pudo buscar la dirección, intentá de nuevo")

    resultados = respuesta.json()
    return [
        {
            "direccion": r.get("display_name"),
            "latitud": r.get("lat"),
            "longitud": r.get("lon"),
        }
        for r in resultados
    ]