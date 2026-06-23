"""Adapta recursos simples al patrón multi-tenant automáticamente."""
import os
import re

# Recursos simples y su (modelo, nombre_clase, campo_id)
# Solo los que siguen el patrón CRUD estándar
RECURSOS = {
    "proveedores.py":   ("Proveedor", "id_proveedor"),
    "categorias.py":    ("CategoriaProducto", "id_categoria"),
    "productos.py":     ("Producto", "id_producto"),
    "horarios.py":      ("HorarioBarbero", "id_horario"),
    "valoraciones.py":  ("Valoracion", "id_valoracion"),
    "notificaciones.py":("Notificacion", "id_notificacion"),
    "acontecimientos.py":("Acontecimiento", "id_acontecimiento"),
    "codigos_qr.py":    ("CodigoQR", "id_qr"),
}

CARPETA = "app/api"
respaldo = "app/api/_respaldo_pre_multitenant"
os.makedirs(respaldo, exist_ok=True)

print("Este script es un AYUDANTE. Va a mostrar qué archivos necesitan adaptación.")
print("Por seguridad, NO modifica automáticamente la lógica compleja.\n")

for archivo, (modelo, campo_id) in RECURSOS.items():
    ruta = os.path.join(CARPETA, archivo)
    if not os.path.exists(ruta):
        print(f"  - {archivo}: NO EXISTE, lo salto")
        continue
    with open(ruta, encoding="utf-8") as f:
        contenido = f.read()
    # Diagnóstico: ¿ya tiene multi-tenant?
    if "get_barberia_actual" in contenido:
        print(f"  OK {archivo}: ya está adaptado")
    else:
        print(f"  PENDIENTE {archivo}: modelo={modelo}, id={campo_id}")

print("\nListo el diagnóstico.")
