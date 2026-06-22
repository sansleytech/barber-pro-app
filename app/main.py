"""Punto de entrada de la aplicación FastAPI."""

from fastapi import FastAPI

from app.api import barberos

app = FastAPI(
    title="Barber Pro App",
    description="Sistema de gestión de turnos para barbería",
    version="1.0.0",
)

app.include_router(barberos.router)


@app.get("/")
def inicio():
    return {"mensaje": "Barber Pro App funcionando 💈"}
