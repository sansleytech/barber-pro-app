"""Script puntual: crea una organización de prueba con un usuario dueño."""
import crear_tablas
from app.db.session import SessionLocal
from app.models.organizacion import Organizacion, UsuarioOrganizacion
from app.core.security import hashear_password

db = SessionLocal()

org = Organizacion(nombre="Cadena de prueba")
db.add(org)
db.flush()

dueno = UsuarioOrganizacion(
    id_organizacion=org.id_organizacion,
    nombre_usuario="duenocadena",
    email="prueba@ejemplo.com",
    password_hash=hashear_password("cadena123"),
)
db.add(dueno)
db.commit()

print(f"Organización creada: id={org.id_organizacion}")
print(f"Usuario: duenocadena / cadena123")

db.close()