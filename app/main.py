"""Punto de entrada de la aplicación FastAPI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    barberos, servicios, clientes, turnos, usuarios,
    auth, horarios, configuracion, categorias, proveedores,
    productos, compras, ventas, caja, valoraciones,
    notificaciones, contenido, acontecimientos, codigos_qr
)

app = FastAPI(
    title="Barber Pro App",
    description="Sistema de gestión de turnos para barbería",
    version="1.0.0",
)

# CORS: permitir que el frontend (React/Vite) consuma la API
origenes_permitidos = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes_permitidos,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(barberos.router)
app.include_router(servicios.router)
app.include_router(clientes.router)
app.include_router(turnos.router)
app.include_router(usuarios.router)
app.include_router(horarios.router)
app.include_router(configuracion.router)
app.include_router(categorias.router)
app.include_router(proveedores.router)
app.include_router(productos.router)
app.include_router(compras.router)
app.include_router(ventas.router)
app.include_router(caja.router)
app.include_router(valoraciones.router)
app.include_router(notificaciones.router)
app.include_router(contenido.router)
app.include_router(acontecimientos.router)
app.include_router(codigos_qr.router)


@app.get("/")
def inicio():
    return {"mensaje": "Barber Pro App funcionando 💈"}
