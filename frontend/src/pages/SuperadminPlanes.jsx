import { useState, useEffect } from "react";
import { Plus, Pencil, X, Check } from "lucide-react";
import api from "../api/cliente";
import { useUI } from "../context/UIContext";

function formatoPrecio(valor) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(valor || 0);
}

const VACIO = {
  nombre: "",
  descripcion: "",
  precio_mensual: "",
  precio_anterior: "",
  max_barberos: "",
  permite_whatsapp: false,
  permite_pagos_online: false,
  permite_reportes: true,
  permite_inventario: false,
  permite_qr: false,
  orden: 0,
};

function SuperadminPlanes() {
  const { avisar } = useUI();
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null); // id_plan, o "nuevo"
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    api.get("/superadmin/planes").then((r) => setPlanes(r.data)).finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const abrirEditor = (plan) => {
    if (plan) {
      setForm({
        nombre: plan.nombre,
        descripcion: plan.descripcion || "",
        precio_mensual: plan.precio_mensual,
        precio_anterior: plan.precio_anterior || "",
        max_barberos: plan.max_barberos ?? "",
        permite_whatsapp: plan.permite_whatsapp,
        permite_pagos_online: plan.permite_pagos_online,
        permite_reportes: plan.permite_reportes,
        permite_inventario: plan.permite_inventario,
        permite_qr: plan.permite_qr,
        orden: plan.orden,
      });
      setEditando(plan.id_plan);
    } else {
      setForm(VACIO);
      setEditando("nuevo");
    }
  };

  const cerrarEditor = () => {
    setEditando(null);
    setForm(VACIO);
  };

  const guardar = async () => {
    setGuardando(true);
    const datos = {
      ...form,
      precio_mensual: Number(form.precio_mensual),
      precio_anterior: form.precio_anterior === "" ? null : Number(form.precio_anterior),
      max_barberos: form.max_barberos === "" ? null : Number(form.max_barberos),
    };
    try {
      if (editando === "nuevo") {
        await api.post("/superadmin/planes", datos);
        avisar("Plan creado correctamente", "exito");
      } else {
        await api.patch(`/superadmin/planes/${editando}`, datos);
        avisar("Plan actualizado correctamente", "exito");
      }
      cerrarEditor();
      cargar();
    } catch (err) {
      avisar(err.response?.data?.detail || "No se pudo guardar el plan", "error");
    } finally {
      setGuardando(false);
    }
  };

  const setCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  if (cargando) return <div className="text-center py-20 text-gray-500">Cargando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Planes</h1>
          <p className="text-gray-500 text-sm">Precios y funciones disponibles para las barberías</p>
        </div>
        <button
          onClick={() => abrirEditor(null)}
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold text-sm rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo plan
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {planes.map((plan) => (
          <div key={plan.id_plan} className="bg-ink-card border border-line rounded-2xl p-5">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-white font-semibold">{plan.nombre}</h3>
              <button onClick={() => abrirEditor(plan)} className="text-gray-500 hover:text-gold transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            {plan.descripcion && <p className="text-gray-500 text-xs mb-3">{plan.descripcion}</p>}
            <div className="mb-4">
              {plan.precio_anterior && Number(plan.precio_anterior) > Number(plan.precio_mensual) && (
                <span className="text-gray-600 text-sm line-through mr-2">{formatoPrecio(plan.precio_anterior)}</span>
              )}
              <span className="text-2xl font-bold text-white">{formatoPrecio(plan.precio_mensual)}</span>
              <span className="text-gray-500 text-xs"> /mes</span>
            </div>
            <div className="text-xs text-gray-500 mb-1">{plan.max_barberos ? `Hasta ${plan.max_barberos} barbero(s)` : "Barberos ilimitados"}</div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {plan.permite_reportes && <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded-full">Reportes</span>}
              {plan.permite_qr && <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded-full">QR</span>}
              {plan.permite_whatsapp && <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded-full">WhatsApp</span>}
              {plan.permite_inventario && <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded-full">Inventario</span>}
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={cerrarEditor}>
          <div className="bg-ink-card border border-line rounded-2xl shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={cerrarEditor} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white font-semibold text-lg mb-5">{editando === "nuevo" ? "Nuevo plan" : "Editar plan"}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Nombre</label>
                <input value={form.nombre} onChange={(e) => setCampo("nombre", e.target.value)} className="w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Descripción breve</label>
                <input value={form.descripcion} onChange={(e) => setCampo("descripcion", e.target.value)} className="w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Precio mensual (COP)</label>
                  <input type="number" value={form.precio_mensual} onChange={(e) => setCampo("precio_mensual", e.target.value)} className="w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Precio anterior (opcional)</label>
                  <input type="number" value={form.precio_anterior} onChange={(e) => setCampo("precio_anterior", e.target.value)} placeholder="Para mostrar tachado" className="w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold placeholder-gray-600" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Máximo de barberos (vacío = ilimitado)</label>
                <input type="number" value={form.max_barberos} onChange={(e) => setCampo("max_barberos", e.target.value)} className="w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-gold" />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">Funciones incluidas</label>
                <div className="space-y-2">
                  {[
                    { campo: "permite_reportes", label: "Reportes" },
                    { campo: "permite_qr", label: "Códigos QR" },
                    { campo: "permite_whatsapp", label: "Notificaciones automáticas (WhatsApp)" },
                    { campo: "permite_inventario", label: "Inventario y ventas" },
                    { campo: "permite_pagos_online", label: "Pagos online" },
                  ].map(({ campo, label }) => (
                    <label key={campo} className="flex items-center gap-2.5 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setCampo(campo, !form[campo])}
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${form[campo] ? "bg-gold border-gold" : "border-line"}`}
                      >
                        {form[campo] && <Check className="w-3.5 h-3.5 text-ink" />}
                      </button>
                      <span className="text-sm text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={guardar}
                disabled={guardando || !form.nombre || !form.precio_mensual}
                className="w-full bg-gold text-ink font-semibold rounded-lg py-3 hover:bg-gold-soft transition-colors disabled:opacity-50 mt-2"
              >
                {guardando ? "Guardando..." : "Guardar plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperadminPlanes;