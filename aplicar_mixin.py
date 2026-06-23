"""Script para aplicar TenantMixin a todos los modelos multi-tenant."""
import os
import re

CARPETA = "app/models"
EXCLUIR = {"barberia.py", "plan.py", "mixins.py", "usuario.py", "__init__.py"}

import_mixin = "from app.models.mixins import TenantMixin"

modificados = []
for archivo in os.listdir(CARPETA):
    if not archivo.endswith(".py") or archivo in EXCLUIR:
        continue
    ruta = os.path.join(CARPETA, archivo)
    with open(ruta, encoding="utf-8") as f:
        contenido = f.read()

    if "TenantMixin" in contenido:
        continue

    if "from app.db.session import Base" in contenido:
        contenido = contenido.replace(
            "from app.db.session import Base",
            "from app.db.session import Base\n" + import_mixin,
        )
    else:
        print(f"  AVISO {archivo}: no encontre import de Base, lo salto")
        continue

    nuevo = re.sub(r"class (\w+)\(Base\):", r"class \1(Base, TenantMixin):", contenido)

    if nuevo == contenido:
        print(f"  AVISO {archivo}: no encontre 'class X(Base):'")
        continue

    with open(ruta, "w", encoding="utf-8") as f:
        f.write(nuevo)
    modificados.append(archivo)
    print(f"  OK {archivo}")

print(f"\nModificados {len(modificados)} archivos.")
