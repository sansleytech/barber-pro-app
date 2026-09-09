import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  Pencil,
  Trash2,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";
import api from "../api/cliente";
import { useUI } from "../context/UIContext";
import { useAuth } from "../context/AuthContext";
import Tabla from "../components/Tabla";
import Recibo from "../components/Recibo";

function fechaHoyLocal() {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function Turnos() {
  const { confirmar, avisar } = useUI();
  const { usuario } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [fecha, setFecha] = useState(fechaHoyLocal());
  const [verTodos, setVerTodos] = useState(false);
  const navigate = useNavigate();

  // Recibo del turno completado
  const [reciboAbierto, setReciboAbierto] = useState(false);
  const [turnoParaRecibo, setTurnoParaRecibo] = useState(null);

  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    try {
      const [resT, resC, resB, resS] = await Promise.all([
        api.get("/turnos"),
        api.get("/clientes"),
        api.get("/barberos"),
        api.get("/servicios"),
      ]);
      setTurnos(resT.data);
      setClientes(resC.data);
      setBarberos(resB.data);
      setServicios(resS.data);
    } catch (err) {
      setError("No se pudieron cargar los turnos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const irDia = (delta) => {
    const d = new Date(fecha);
    d.setDate(d.getDate() + delta);
    setFecha(d.toISOString().split("T")[0]);
  };

  const nombreCliente = (id) => {
    const c = clientes.find((x) => x.id_cliente === id);
    return c ? `${c.primer_nombre} ${c.apellidos}` : "Cliente";
  };
  const clienteCompleto = (id) => clientes.find((x) => x.id_cliente === id);
  const nombreBarbero = (id) => {
    const b = barberos.find((x) => x.id_barbero === id);
    return b ? `${b.nombre} ${b.apellido}` : "Barbero";
  };
  const nombresServicios = (lista) => {
    if (!lista || lista.length === 0) return "—";
    return lista
      .map((item) => {
        const s = servicios.find((x) => x.id_servicio === item.id_servicio);
        return s ? s.nombre : "Servicio";
      })
      .join(", ");
  };

  // Arma los ítems del recibo a partir de los servicios del turno
  const itemsDelTurno = (t) => {
    if (!t.servicios || t.servicios.length === 0) {
      return [{ nombre: "Servicio", cantidad: 1, subtotal: t.precio_total || 0 }];
    }
    return t.servicios.map((item) => {
      const s = servicios.find((x) => x.id_servicio === item.id_servicio);
      return {
        nombre: s ? s.nombre : "Servicio",
        cantidad: 1,
        subtotal: s ? Number(s.precio) : 0,
      };
    });
  };

  // Ejecuta el cambio de estado real (backend + recibo si corresponde)
  const aplicarCambioEstado = async (turno, nuevoEstado) => {
    try {
      await api.patch(`/turnos/${turno.id_turno}/estado`, { estado: nuevoEstado });

      if (nuevoEstado === "completado") {
        const cliente = clienteCompleto(turno.id_cliente);
        setTurnoParaRecibo({
          numero: turno.id_turno,
          fecha: `${turno.fecha}T${turno.hora_inicio || "00:00:00"}`,
          cliente: cliente
            ? { nombre: `${cliente.primer_nombre} ${cliente.apellidos}`, documento: cliente.documento }
            : null,
          atendioPor: { nombre: nombreBarbero(turno.id_barbero), rol: "Barbero" },
          items: itemsDelTurno(turno),
          subtotal: turno.precio_total,
          iva: 0,
          total: turno.precio_total,
          metodoPago: turno.metodo_pago,
        });
        setReciboAbierto(true);
      }

      cargarDatos();
    } catch (err) {
      avisar(err.response?.data?.detail || "No se pudo cambiar el estado", "error");
    }
  };

  // Punto de entrada del <select>: si es "completado", pide confirmación
  // primero, porque es un cambio irreversible (el turno queda bloqueado).
  const cambiarEstado = (turno, nuevoEstado) => {
    if (nuevoEstado === "completado") {
      confirmar({
        titulo: "Completar turno",
        mensaje: "¿Seguro que querés marcar este turno como completado? Después no vas a poder cambiar su estado.",
        textoConfirmar: "Sí, completar",
        onConfirmar: () => aplicarCambioEstado(turno, nuevoEstado),
      });
      return;
    }
    aplicarCambioEstado(turno, nuevoEstado);
  };

  const eliminarTurno = (idTurno) => {
    confirmar({
      titulo: "Cancelar turno",
      mensaje: "¿Seguro que querés cancelar este turno?",
      textoConfirmar: "Cancelar turno",
      onConfirmar: async () => {
        try {
          await api.delete(`/turnos/${idTurno}`);
          cargarDatos();
          avisar("Turno cancelado correctamente", "exito");
        } catch (err) {
          avisar(err.response?.data?.detail || "No se pudo cancelar el turno", "error");
        }
      },
    });
  };

  // Arma el link de WhatsApp con la confirmación del turno
  const enviarWhatsApp = (t) => {
    const cliente = clientes.find((x) => x.id_cliente === t.id_cliente);
    if (!cliente || !cliente.telefono) {
      avisar("Este cliente no tiene teléfono cargado", "error");
      return;
    }
    let tel = String(cliente.telefono).replace(/\D/g, "");
    if (tel.length === 10) tel = "57" + tel; // celular colombiano sin código

    const barbero = nombreBarbero(t.id_barbero);
    const serviciosTxt = nombresServicios(t.servicios);
    const mensaje =
      `Hola ${cliente.primer_nombre}, le confirmamos su turno en Barber Pro:\n\n` +
      `📅 Fecha: ${t.fecha}\n` +
      `🕐 Hora: ${formatoHora(t.hora_inicio)}\n` +
      `💈 Barbero: ${barbero}\n` +
      `✂️ Servicio: ${serviciosTxt}\n` +
      `💵 Total: ${formatoPrecio(t.precio_total)}\n\n` +
      `Lo esperamos. ¡Muchas gracias!`;

    const url = `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };

  const estiloEstado = (estado) => {
    const estilos = {
      pendiente: "border-amber-500/40 text-amber-400",
      confirmado: "border-blue-500/40 text-blue-400",
      en_proceso: "border-purple-500/40 text-purple-400",
      completado: "border-emerald-500/40 text-emerald-400",
      cancelado: "border-red-500/40 text-red-400",
      no_asistio: "border-gray-500/40 text-gray-400",
    };
    return estilos[estado] || "border-gray-500/40 text-gray-400";
  };

  const textoEstado = (estado) => {
    const textos = {
      pendiente: "Pendientes",
      confirmado: "Confirmado",
      en_proceso: "En proceso",
      completado: "Completados",
      cancelado: "Cancelado",
      no_asistio: "No asistió",
    };
    return textos[estado] || estado;
  };

  const formatoPrecio = (valor) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor || 0);


  const formatoHora = (hora) => {
    if (!hora) return "—";
    const [h, m] = hora.split(":").map(Number);
    const sufijo = h >= 12 ? "p.m." : "a.m.";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
  };

  const filtrados = turnos.filter((t) => {
    const texto =
      `${nombreCliente(t.id_cliente)} ${nombreBarbero(t.id_barbero)}`.toLowerCase();
    const coincideBusqueda = texto.includes(busqueda.toLowerCase());
    const coincideEstado =
      estadoFiltro === "todos" || t.estado === estadoFiltro;
    const coincideFecha = verTodos || t.fecha === fecha;
    return coincideBusqueda && coincideEstado && coincideFecha;
  });

  const estadosPosibles = [
    "pendiente",
    "confirmado",
    "en_proceso",
    "completado",
    "cancelado",
    "no_asistio",
  ];

  const columnas = [
    {
      campo: "fecha",
      titulo: "Fecha y hora",
      render: (t) => (
        <div>
          <div className="flex items-center gap-1.5 text-white font-medium">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            {t.fecha}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
            <Clock className="w-3 h-3" />
            {formatoHora(t.hora_inicio)} - {formatoHora(t.hora_fin)}
          </div>
        </div>
      ),
    },
    {
      campo: "id_cliente",
      titulo: "Cliente",
      render: (t) => (
        <span className="inline-flex items-center gap-1.5 text-gray-200">
          <User className="w-3.5 h-3.5 text-gray-500" />
          {nombreCliente(t.id_cliente)}
        </span>
      ),
    },
    {
      campo: "id_barbero",
      titulo: "Barbero",
      oculta: "hidden md:table-cell",
      render: (t) => nombreBarbero(t.id_barbero),
    },
    {
      campo: "servicios",
      titulo: "Servicios",
      ordenable: false,
      oculta: "hidden lg:table-cell",
      render: (t) => (
        <span className="text-gray-400 text-sm">
          {nombresServicios(t.servicios)}
        </span>
      ),
    },
    {
      campo: "precio_total",
      titulo: "Total",
      render: (t) => (
        <span className="text-gold font-medium">
          {formatoPrecio(t.precio_total)}
        </span>
      ),
    },
    {
      campo: "estado",
      titulo: "Estado",
      render: (t) =>
        t.estado === "completado" ? (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium border border-emerald-500/40 text-emerald-400"
            title="Turno completado: ya no se puede cambiar"
          >
            <Lock className="w-3.5 h-3.5" />
            Completado
          </span>
        ) : (
          <select
            value={t.estado}
            onChange={(e) => cambiarEstado(t, e.target.value)}
            className={`bg-ink border rounded-lg px-2.5 py-1.5 text-sm font-medium focus:outline-none cursor-pointer ${estiloEstado(t.estado)}`}
          >
            {estadosPosibles.map((est) => (
              <option key={est} value={est} className="bg-ink text-white">
                {textoEstado(est)}
              </option>
            ))}
          </select>
        ),
    },
    {
      campo: "acciones",
      titulo: "Acciones",
      ordenable: false,
      alinear: "right",
      render: (t) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => enviarWhatsApp(t)}
            className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
            title="Confirmar por WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/turnos/editar/${t.id_turno}`)}
            className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => eliminarTurno(t.id_turno)}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Cancelar turno"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const estadosFiltro = ["todos", ...estadosPosibles];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Turnos</h1>
          <p className="text-gray-400">Gestioná la agenda de tu barbería</p>
        </div>
        <button
          onClick={() => navigate("/turnos/nuevo")}
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo turno
        </button>
      </div>

      {/* Navegador de fecha */}
      <div className="flex flex-wrap items-center gap-2 mb-5 bg-ink-card border border-line rounded-2xl px-4 py-3">
        <button
          onClick={() => irDia(-1)}
          disabled={verTodos}
          className="w-9 h-9 rounded-xl bg-ink border border-line text-gray-400 hover:text-gold hover:border-gold/40 transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <input
          type="date"
          value={fecha}
          disabled={verTodos}
          onChange={(e) => setFecha(e.target.value)}
          className="bg-ink border border-line text-white text-sm font-semibold rounded-xl px-3.5 py-2 focus:outline-none focus:border-gold [color-scheme:dark] disabled:opacity-30"
        />
        <button
          onClick={() => irDia(1)}
          disabled={verTodos}
          className="w-9 h-9 rounded-xl bg-ink border border-line text-gray-400 hover:text-gold hover:border-gold/40 transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setVerTodos(false); setFecha(fechaHoyLocal()); }}
          className="px-4 py-2 rounded-full text-xs font-semibold bg-ink border border-line text-gray-300 hover:text-white hover:border-gold/40 transition-colors"
        >
          Hoy
        </button>
        <div className="w-px h-6 bg-line mx-1" />
        <button
          onClick={() => setVerTodos((v) => !v)}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${verTodos
              ? "bg-gold text-ink"
              : "bg-ink border border-line text-gray-300 hover:text-white"
            }`}
        >
          Ver todos
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {estadosFiltro.map((e) => (
          <button
            key={e}
            onClick={() => setEstadoFiltro(e)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${estadoFiltro === e
                ? "bg-gold text-ink"
                : "bg-ink-card border border-line text-gray-300 hover:text-white"
              }`}
          >
            {e === "todos" ? "Todos" : textoEstado(e)}
          </button>
        ))}
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por cliente o barbero..."
          className="w-full bg-ink-card border border-line rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {cargando ? (
        <div className="text-center py-16 text-gray-500">
          Cargando turnos...
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
          {error}
        </div>
      ) : (
        <Tabla
          columnas={columnas}
          datos={filtrados}
          vacioTexto={
            verTodos
              ? (busqueda || estadoFiltro !== "todos" ? "No se encontraron turnos" : "Todavía no hay turnos")
              : `No hay turnos para el ${fecha}`
          }
        />
      )}

      {turnoParaRecibo && (
        <Recibo
          abierto={reciboAbierto}
          onCerrar={() => setReciboAbierto(false)}
          tipo="turno"
          numero={turnoParaRecibo.numero}
          fecha={turnoParaRecibo.fecha}
          cliente={turnoParaRecibo.cliente}
          atendioPor={turnoParaRecibo.atendioPor}
          items={turnoParaRecibo.items}
          subtotal={turnoParaRecibo.subtotal}
          iva={turnoParaRecibo.iva}
          total={turnoParaRecibo.total}
          metodoPago={turnoParaRecibo.metodoPago}
          barberia={{
            nombre: usuario?.barberia,
            nit: usuario?.barberia_nit,
            direccion: usuario?.barberia_direccion,
            telefono: usuario?.barberia_telefono,
            logo_url: usuario?.barberia_logo,
          }}
        />
      )}
    </div>
  );
}

export default Turnos;