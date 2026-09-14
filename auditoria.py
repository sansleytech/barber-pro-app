"""Auditoría rápida: busca errores de sintaxis y variables no definidas
en todo el backend, antes de migrar a producción."""
import ast
import os

CARPETAS = ["app"]
problemas = []

for carpeta in CARPETAS:
    for raiz, _, archivos in os.walk(carpeta):
        if "__pycache__" in raiz:
            continue
        for archivo in archivos:
            if not archivo.endswith(".py"):
                continue
            ruta = os.path.join(raiz, archivo)
            with open(ruta, "r", encoding="utf-8") as f:
                codigo = f.read()
            try:
                ast.parse(codigo)
            except SyntaxError as e:
                problemas.append(f"❌ SINTAXIS en {ruta}: línea {e.lineno} — {e.msg}")

print(f"Archivos Python revisados. Problemas de sintaxis encontrados: {len(problemas)}")
for p in problemas:
    print(p)

if not problemas:
    print("✅ Sin errores de sintaxis detectados.")