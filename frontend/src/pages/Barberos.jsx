import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import api from "../api/cliente";
import Tabla from "../components/Tabla";

const Barberos = () => {
    const [barberos, setBarberos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const navigate = useNavigate();

    const cargarBarberos = async () => {
        setCargando(true);
        setError("");
        try {
            const respuesta = await api.get("/barberos");
            setBarberos(respuesta.data);
        } 
        catch (err) {
            setError("No se pudieron cargar los barberos");
        } 
        finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarBarberos();
    }, []);

    const eliminarBarbero = async (id, nombre) => {
        if (!confirm(`¿Seguro que querés desactivar a ${nombre}?`)) return;
        try {
            await api.delete(`/barberos/${id}`);
            cargarBarberos();
        } catch (err) {
            alert("No se pudo desactivar el barbero");
        }
    };

    const filtrados = barberos.filter((b) => {
        const texto = `${b.nombre} ${b.apellido} ${b.telefono} ${b.especialidad || ""}`.toLowerCase();
        return texto.includes(busqueda.toLowerCase());
    });

    const columnas = [
        {
            campo: "nombre",
            titulo: "Nombre completo",
            render: (b) => (
                <span className="text-white font-medium">
                    {b.nombre} {b.apellido}
                </span>
            ),
        },
        {
            campo: "especialidad",
            titulo: "Especialidad",
            render: (b) => b.especialidad || "—",
        },
        { campo: "telefono", titulo: "Teléfono" },
        {
            campo: "email",
            titulo: "Correo",
            oculta: "hidden md:table-cell",
            render: (b) => b.email || "—",
        },
        {
            campo: "fecha_ingreso",
            titulo: "Ingreso",
            oculta: "hidden lg:table-cell",
            render: (b) => b.fecha_ingreso,
        },
        {
            campo: "acciones",
            titulo: "Acciones",
            ordenable: false,
            alinear: "right",
            render: (b) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => navigate(`/barberos/editar/${b.id_barbero}`)}
                        className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => eliminarBarbero(b.id_barbero, b.nombre)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Desactivar"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];
    return (
        <div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Barberos</h1>
                    <p className="text-gray-400"> Gestionsa el equipo de tu barberia</p>
                </div>

                <button
                    onClick={() => navigate("/barberos/nuevo")}
                    className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors1">
                    <Plus className="w-5 h-5" />
                    Nuevo Barbero
                </button>
            </div>

            <div className="relative mb-6 max-w-md">
                <Search className=" absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre, teléfono o especialidad..."
                    className="w-full bg-ink-card border border-line rounded-lg pl-10 pr-4 py-2 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors" />
            </div>
            {cargando ? (
                <div className="text-center py-16 text-gray-500"> Cargando barberos...</div>
            ) :
                error ? (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
                        {error}
                    </div>

                ) : (
                    <Tabla
                        columnas={columnas}
                        datos={filtrados}
                        vacioTexto={busqueda ? "No se encontraron barberos" : "Todavia no hay barberos"}
                    />
                )}
        </div>
    );
};

export default Barberos;
