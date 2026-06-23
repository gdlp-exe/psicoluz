// src/pages/psicologo/Citas.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, X, ChevronLeft, ChevronRight, Clock, Video, MapPin, Check, AlertCircle } from "lucide-react";
import { Layout } from "./Dashboard";

const T = { teal:"#00AFC1", orange:"#F7931E", dark:"#222222", gray:"#6b7280" };

const ESTADO_STYLE = {
  programada:  { bg:"#fff7ed", color:"#f97316", label:"Programada"  },
  confirmada:  { bg:"#f0fdfe", color:T.teal,    label:"Confirmada"  },
  completada:  { bg:"#f0fdf4", color:"#16a34a", label:"Completada"  },
  cancelada:   { bg:"#fef2f2", color:"#dc2626", label:"Cancelada"   },
  no_asistio:  { bg:"#faf5ff", color:"#7c3aed", label:"No asistió"  },
};

export default function Citas() {
  const [psicologoId, setPsicologoId] = useState(null);
  const [citas, setCitas]             = useState([]);
  const [pacientes, setPacientes]     = useState([]);
  const [fecha, setFecha]             = useState(new Date());
  const [modal, setModal]             = useState(false);       // nueva cita
  const [detalle, setDetalle]         = useState(null);        // cita seleccionada
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [vista, setVista]             = useState("semana");    // "semana" | "lista"

  const [form, setForm] = useState({
    paciente_id:"", fecha_inicio:"", fecha_fin:"",
    modalidad:"presencial", motivo_consulta:"", link_virtual:""
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { init(); }, []);
  useEffect(() => { if (psicologoId) cargarCitas(); }, [psicologoId, fecha, vista]);

  const init = async () => {
    const { data:{ user } } = await supabase.auth.getUser();
    const { data: psi } = await supabase.from("psicologo").select("id").eq("perfil_id", user.id).single();
    if (!psi) return;
    setPsicologoId(psi.id);
    // Cargar pacientes para el select
    const { data: pac } = await supabase
      .from("paciente").select("id, nombres, apellidos").eq("psicologo_id", psi.id).order("apellidos");
    setPacientes(pac ?? []);
  };

  const cargarCitas = async () => {
    setLoading(true);
    let desde, hasta;
    if (vista === "semana") {
      const lunes = new Date(fecha);
      lunes.setDate(fecha.getDate() - ((fecha.getDay()||7)-1));
      lunes.setHours(0,0,0,0);
      desde = lunes.toISOString();
      const domingo = new Date(lunes); domingo.setDate(lunes.getDate()+6); domingo.setHours(23,59,59,999);
      hasta = domingo.toISOString();
    } else {
      desde = new Date(fecha.getFullYear(), fecha.getMonth(), 1).toISOString();
      hasta  = new Date(fecha.getFullYear(), fecha.getMonth()+1, 0, 23,59,59).toISOString();
    }
    const { data } = await supabase
      .from("cita")
      .select("*, paciente(nombres, apellidos)")
      .eq("psicologo_id", psicologoId)
      .gte("fecha_inicio", desde)
      .lte("fecha_inicio", hasta)
      .order("fecha_inicio");
    setCitas(data ?? []);
    setLoading(false);
  };

  // ── Crear cita ──────────────────────────────────────────────
  const crearCita = async () => {
    setError("");
    if (!form.paciente_id || !form.fecha_inicio || !form.fecha_fin) {
      setError("Completa los campos obligatorios."); return;
    }
    if (new Date(form.fecha_fin) <= new Date(form.fecha_inicio)) {
      setError("La hora de fin debe ser posterior al inicio."); return;
    }
    setSaving(true);
    const { data:{ user } } = await supabase.auth.getUser();
    const { error: err } = await supabase.from("cita").insert({
      paciente_id:    form.paciente_id,
      psicologo_id:   psicologoId,
      creado_por:     user.id,
      fecha_inicio:   form.fecha_inicio,
      fecha_fin:      form.fecha_fin,
      modalidad:      form.modalidad,
      motivo_consulta: form.motivo_consulta,
      link_virtual:   form.modalidad === "virtual" ? form.link_virtual : null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setModal(false);
    setForm({ paciente_id:"", fecha_inicio:"", fecha_fin:"", modalidad:"presencial", motivo_consulta:"", link_virtual:"" });
    cargarCitas();
  };

  // ── Cambiar estado ──────────────────────────────────────────
  const cambiarEstado = async (id, estado) => {
    await supabase.from("cita").update({ estado, updated_at: new Date().toISOString() }).eq("id", id);
    setCitas(prev => prev.map(c => c.id === id ? {...c, estado} : c));
    setDetalle(prev => prev?.id === id ? {...prev, estado} : prev);
  };

  // ── Semana actual ────────────────────────────────────────────
  const diasSemana = () => {
    const lunes = new Date(fecha);
    lunes.setDate(fecha.getDate() - ((fecha.getDay()||7)-1));
    return Array.from({length:7}, (_,i) => { const d=new Date(lunes); d.setDate(lunes.getDate()+i); return d; });
  };

  const citasDia = dia => citas.filter(c => {
    const d = new Date(c.fecha_inicio);
    return d.getDate()===dia.getDate() && d.getMonth()===dia.getMonth();
  });

  const DIAS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

  return (
    <Layout current="citas">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily:"Poppins", color:T.dark }}>Citas</h1>
          <p className="text-sm" style={{ color:T.gray }}>Gestiona tu agenda de sesiones</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle vista */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
            {["semana","lista"].map(v => (
              <button key={v} onClick={() => setVista(v)}
                className="px-4 py-2 text-xs font-bold capitalize transition-all"
                style={{ background: vista===v ? T.teal : "white", color: vista===v ? "white" : T.gray }}>
                {v}
              </button>
            ))}
          </div>
          <motion.button onClick={() => setModal(true)} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md"
            style={{ background:`linear-gradient(135deg,${T.orange},#e07810)`, fontFamily:"Poppins" }}>
            <Plus size={16}/> Nueva cita
          </motion.button>
        </div>
      </div>

      {/* Navegación de fecha */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => { const d=new Date(fecha); d.setDate(d.getDate()-(vista==="semana"?7:30)); setFecha(d); }}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-teal-50 transition-colors">
          <ChevronLeft size={16} style={{ color:T.gray }}/>
        </button>
        <span className="text-sm font-bold" style={{ color:T.dark }}>
          {vista==="semana"
            ? `Semana del ${diasSemana()[0].toLocaleDateString("es-NI",{day:"numeric",month:"short"})} — ${diasSemana()[6].toLocaleDateString("es-NI",{day:"numeric",month:"short",year:"numeric"})}`
            : fecha.toLocaleDateString("es-NI",{month:"long",year:"numeric"})}
        </span>
        <button onClick={() => { const d=new Date(fecha); d.setDate(d.getDate()+(vista==="semana"?7:30)); setFecha(d); }}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-teal-50 transition-colors">
          <ChevronRight size={16} style={{ color:T.gray }}/>
        </button>
        <button onClick={() => setFecha(new Date())}
          className="px-3 py-1 rounded-lg text-xs font-bold border border-teal-200 transition-colors hover:bg-teal-50"
          style={{ color:T.teal }}>Hoy</button>
      </div>

      {loading
        ? <div className="h-48 flex items-center justify-center"><div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor:`${T.teal}30`, borderTopColor:T.teal }}/></div>
        : vista === "semana" ? <VistasSemana dias={diasSemana()} labels={DIAS} citasDia={citasDia} onSelect={setDetalle}/>
                              : <VistaLista citas={citas} onSelect={setDetalle}/>
      }

      {/* Modal nueva cita */}
      <AnimatePresence>
        {modal && (
          <Modal title="Nueva cita" onClose={() => setModal(false)}>
            <div className="space-y-3">
              <Select label="Paciente *" value={form.paciente_id} onChange={set("paciente_id")}>
                <option value="">Seleccionar paciente</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>)}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Inicio *" type="datetime-local" value={form.fecha_inicio} onChange={set("fecha_inicio")}/>
                <Input label="Fin *"    type="datetime-local" value={form.fecha_fin}    onChange={set("fecha_fin")}/>
              </div>
              <Select label="Modalidad" value={form.modalidad} onChange={set("modalidad")}>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
              </Select>
              {form.modalidad === "virtual" && (
                <Input label="Link de videollamada" value={form.link_virtual} onChange={set("link_virtual")} placeholder="https://meet.google.com/..."/>
              )}
              <Textarea label="Motivo de consulta" value={form.motivo_consulta} onChange={set("motivo_consulta")} rows={2}/>
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold" style={{ color:T.gray }}>Cancelar</button>
                <motion.button onClick={crearCita} disabled={saving} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background:`linear-gradient(135deg,${T.teal},#008C99)`, opacity:saving?0.7:1 }}>
                  {saving ? "Guardando..." : "Agendar cita"}
                </motion.button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Detalle cita */}
      <AnimatePresence>
        {detalle && (
          <Modal title="Detalle de cita" onClose={() => setDetalle(null)}>
            <div className="space-y-3">
              <div className="p-4 rounded-xl" style={{ background:`${T.teal}08` }}>
                <p className="font-black text-base" style={{ color:T.dark }}>
                  {detalle.paciente?.nombres} {detalle.paciente?.apellidos}
                </p>
                <p className="text-sm mt-1" style={{ color:T.gray }}>
                  <Clock size={13} className="inline mr-1"/>
                  {new Date(detalle.fecha_inicio).toLocaleString("es-NI",{weekday:"long",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}
                  {" — "}
                  {new Date(detalle.fecha_fin).toLocaleTimeString("es-NI",{hour:"2-digit",minute:"2-digit"})}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {detalle.modalidad === "virtual" ? <Video size={13}/> : <MapPin size={13}/>}
                  <span className="text-xs capitalize" style={{ color:T.gray }}>{detalle.modalidad}</span>
                  <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: ESTADO_STYLE[detalle.estado]?.bg, color: ESTADO_STYLE[detalle.estado]?.color }}>
                    {ESTADO_STYLE[detalle.estado]?.label}
                  </span>
                </div>
                {detalle.link_virtual && (
                  <a href={detalle.link_virtual} target="_blank" rel="noopener noreferrer"
                    className="mt-2 text-xs font-bold flex items-center gap-1" style={{ color:T.teal }}>
                    <Video size={12}/> Unirse a la videollamada
                  </a>
                )}
                {detalle.motivo_consulta && (
                  <p className="mt-2 text-xs" style={{ color:T.gray }}><strong>Motivo:</strong> {detalle.motivo_consulta}</p>
                )}
              </div>
              {/* Acciones de estado */}
              <p className="text-xs font-bold" style={{ color:T.gray }}>Cambiar estado</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ESTADO_STYLE).map(([est, style]) => (
                  <button key={est} onClick={() => cambiarEstado(detalle.id, est)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
                    style={{
                      background: detalle.estado===est ? style.color : style.bg,
                      color:      detalle.estado===est ? "white"      : style.color,
                      borderColor: style.color,
                    }}>
                    {detalle.estado===est && <Check size={10} className="inline mr-1"/>}
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </Layout>
  );
}

// ── Vista Semana ─────────────────────────────────────────────
function VistasSemana({ dias, labels, citasDia, onSelect }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 border-b border-gray-100">
        {dias.map((d, i) => {
          const hoy = new Date();
          const esHoy = d.getDate()===hoy.getDate() && d.getMonth()===hoy.getMonth();
          return (
            <div key={i} className="p-3 text-center border-r border-gray-50 last:border-0">
              <div className="text-xs font-semibold mb-1" style={{ color:T.gray }}>{labels[i]}</div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm font-black`}
                style={{ background: esHoy ? T.teal : "transparent", color: esHoy ? "white" : T.dark }}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7" style={{ minHeight:"320px" }}>
        {dias.map((d, i) => {
          const cs = citasDia(d);
          return (
            <div key={i} className="border-r border-gray-50 last:border-0 p-1.5 space-y-1">
              {cs.map(c => (
                <motion.button key={c.id} whileHover={{ scale:1.02 }} onClick={() => onSelect(c)}
                  className="w-full text-left p-2 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background:`${T.teal}12`, color:T.dark, borderLeft:`3px solid ${ESTADO_STYLE[c.estado]?.color ?? T.teal}` }}>
                  <div className="font-bold truncate">{c.paciente?.nombres}</div>
                  <div style={{ color:T.gray }}>{new Date(c.fecha_inicio).toLocaleTimeString("es-NI",{hour:"2-digit",minute:"2-digit"})}</div>
                </motion.button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Vista Lista ──────────────────────────────────────────────
function VistaLista({ citas, onSelect }) {
  if (citas.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center" style={{ color:T.gray }}>
      <Calendar size={32} className="mx-auto mb-3 opacity-40"/>
      <p className="text-sm font-medium">No hay citas en este período</p>
    </div>
  );
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {citas.map((c, i) => {
        const st = ESTADO_STYLE[c.estado] ?? {};
        return (
          <motion.button key={c.id} onClick={() => onSelect(c)} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}
            className="w-full text-left flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-teal-50/30 transition-colors">
            <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: st.color }}/>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm" style={{ color:T.dark }}>
                {c.paciente?.nombres} {c.paciente?.apellidos}
              </div>
              <div className="text-xs mt-0.5" style={{ color:T.gray }}>
                {new Date(c.fecha_inicio).toLocaleString("es-NI",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
                {" — "}
                {new Date(c.fecha_fin).toLocaleTimeString("es-NI",{hour:"2-digit",minute:"2-digit"})}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {c.modalidad==="virtual" ? <Video size={14} style={{ color:T.gray }}/> : <MapPin size={14} style={{ color:T.gray }}/>}
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background:st.bg, color:st.color }}>{st.label}</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Componentes UI pequeños ───────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)" }}>
      <motion.div initial={{ scale:0.95, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95, y:20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-black text-base" style={{ fontFamily:"Poppins", color:"#222" }}>{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X size={15} style={{ color:"#6b7280" }}/>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function Input({ label, type="text", value, onChange, placeholder="" }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1" style={{ color:"#374151" }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
        style={{ fontFamily:"Nunito" }}/>
    </div>
  );
}

function Select({ label, value, onChange, children }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1" style={{ color:"#374151" }}>{label}</label>
      <select value={value} onChange={onChange}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all bg-white"
        style={{ fontFamily:"Nunito" }}>
        {children}
      </select>
    </div>
  );
}

function Textarea({ label, value, onChange, rows=3 }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1" style={{ color:"#374151" }}>{label}</label>
      <textarea value={value} onChange={onChange} rows={rows}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all resize-none"
        style={{ fontFamily:"Nunito" }}/>
    </div>
  );
}