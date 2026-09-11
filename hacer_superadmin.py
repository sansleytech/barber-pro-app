"""Script puntual: marca a un usuario como super_admin en la base LOCAL."""
import crear_tablas  # solo para que se registren TODOS los modelos antes de consultar
from app.db.session import SessionLocal
from app.models.usuario import Usuario

db = SessionLocal()
usuario = db.query(Usuario).filter(Usuario.nombre_usuario == "tiago").first()

if usuario is None:
    print("No se encontró el usuario 'tiago'")
else:
    usuario.super_admin = True
    db.commit()
    print(f"Listo: {usuario.nombre_usuario} ahora es super_admin")

db.close()