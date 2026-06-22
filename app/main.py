"""Punto de entrada de la aplicación FastAPI. Aquí se crea la instancia de FastAPI y se definen las rutas principales."""
from fastapi import FastAPI

app = FastAPI(
    title="Barber Pro App",
    description="Sistema de gestión de turnos para barbería",
    version="1.0.0",
)


@app.get("/")
def inicio():
    return {"mensaje": "Barber Pro App funcionando 💈"}