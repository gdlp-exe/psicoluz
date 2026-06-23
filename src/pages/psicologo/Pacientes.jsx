// src/pages/psicologo/Pacientes.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, X, User, Phone, Calendar, ChevronRight, FileText, BookOpen } from "lucide-react";
import { Layout } from "./Dashboard";

const T = { teal:"#00AFC1", orange:"#F7931E", dark:"#222222", gray:"#6b7280" };
const EXP_ESTADO = {
  activo:     { bg:"#f0fdfe", color:T.teal    },
  en_espera:  { bg:"#fff7ed", color:T.orange  },
  suspendido: { bg:"#faf5ff", color:"#7c3aed" },
  alta:       { bg:"#f0fdf4", color:"#16a34a" },
  archivado:  { bg:"#f3f4f6", color:"#6b7280" },
};

export default function Pacientes() {
  const [psicologoId, setPsicologoId] = useState(null);
  const [pacientes, setPacientes]     = useState([]);
  const [busqueda, setBusqueda]       = useState("");
  const [loading, setLoading]         = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);   // paciente abierto
  const [expediente, setExpediente]   = useState(null);
  const [modalNuevo, setModalNuevo]   = useState(false);
  const [tab, setTab]                 = useState("info");   // info | expediente | citas
  const [citasPac, setCitasPac]       = useState([]);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  const [form, setForm] = useState({
    nombres:"", apellidos:"", fecha_nacimiento:"", genero:"masculino",
    cedula:"", contacto_emergencia:"", telefono_emergencia:"",
    colegio:"", grado_escolar:"",
    // Expediente inicial
    motivo_consulta:""
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { data:{ user } } = await supabase.auth.getUser();
    const { data: psi } = await supabase.from("psicologo").select("id").eq("perfil_id", user.id).single();
    if (!psi) return;
    setPsicologoId(psi.id);
    cargarPacientes(psi.id);
  };

  const cargarPacientes = async (pid) => {
    setLoading(true);
    const { data } = await supabase
      .from("paciente")
      .select("id, nombres, apellidos, fecha_nacimiento, genero, colegio, grado_escolar, created_at, expediente(id, estado, numero_expediente)")
      .eq("psicologo_id", pid)
      .order("apellidos");
    setPacientes(data ?? []);
    setLoading(false);
  };

  const abrirPaciente = async (pac) => {
    setSeleccionado(pac);
    setTab("info");
    setExpediente(null);
    setCitasPac([]);
    // Cargar expediente
    const { data: exp } = await supabase
      .from("expediente")
      .select("*")
      .eq("paciente_id", pac.id)
      .maybeSingle();
    setExpediente(exp);
    // Cargar citas recientes
    const { data: citas } = await supabase
      .from("cita")
      .select("id, fecha_inicio, estado, modalidad")
      .eq("paciente_id", pac.id)
      .order("fecha_inicio", { ascending: false })
      .limit(8);
    setCitasPac(citas ?? []);
  };

  // ── Crear paciente + expediente ─────────────────────────────
  const crearPaciente = async () => {
    setError("");
    if (!form.nombres || !form.apellidos || !form.fecha_nacimiento || !form.contacto_emergencia || !form.telefono_emergencia) {
      setError("Completa los campos obligatorios."); return;
    }
    if (!form.motivo_consulta) { setError("El motivo de consulta es requerido para abrir el expediente."); return; }
    setSaving(true);

    // 1. Insertar paciente
    const { data: nuevoPac, error: errPac } = await supabase.from("paciente").insert({
      psicologo_id:        psicologoId,
      nombres:             form.nombres.trim(),
      apellidos:           form.apellidos.trim(),
      fecha_nacimiento:    form.fecha_nacimiento,
      genero:              form.genero,
      cedula:              form.cedula || null,
      contacto_emergencia: form.contacto_emergencia,
      telefono_emergencia: form.telefono_emergencia,
      colegio:             form.colegio || null,
      grado_escolar:       form.grado_escolar || null,
      tutor_id:            null,   // se puede asignar después
    }).select().single();

    if (errPac) { setError(errPac.message); setSaving(false); return; }

    // 2. Crear expediente automáticamente
    const { error: errExp } = await supabase.from("expediente").insert({
      paciente_id:          nuevoPac.id,
      psicologo_id:         psicologoId,
      motivo_consulta:      form.motivo_consulta.trim(),
      numero_expediente:    `EXP-${new Date().getFullYear()}-${Math.floor(Math.random()*999999).toString().padStart(6,"0")}`,
    });

    if (errExp) { setError(errExp.message); setSaving(false); return; }

    setSaving(false);
    setModalNuevo(false);
    setForm({ nombres:"", apellidos:"", fecha_nacimiento:"", genero:"masculino", cedula:"", contacto_emergencia:"", telefono_emergencia:"", colegio:"", grado_escolar:"", motivo_consulta:"" });
    cargarPacientes(psicologoId);
  };

  // ── Filtro de búsqueda local ─────────────────────────────────
  const filtrados = pacientes.filter(p =>
    `${p.nombres} ${p.apellidos}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const edad = fn => Math.floor((Date.now() - new Date(fn)) / 31557600000);

  const ESTADO_CITA = { programada:"#f97316", confirmada:T.teal, completada:"#16a34a", cancelada:"#dc2626", no_asistio:"#7c3aed" };

  return (
    <Layout current="pacientes">
      <div className="flex flex-col lg:flex-row gap-6 h-full">

        {/* ── Panel izquierdo: lista ── */}
        <div className="lg:w-80 flex-shrink-0 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black" style={{ fontFamily:"Poppins", color:T.dark }}>Pacientes</h1>
              <p className="text-xs" style={{ color:T.gray }}>{pacientes.length} registrados</p>
            </div>
            <motion.button onClick={() => setModalNuevo(true)} whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold shadow-md"
              style={{ background:`linear-gradient(135deg,${T.orange},#e07810)` }}>
              <Plus size={14}/> Nuevo
            </motion.button>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:T.gray }}/>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all bg-white"
              style={{ fontFamily:"Nunito" }}/>
          </div>

          {/* Lista */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex-1" style={{ maxHeight:"calc(100vh - 220px)", overflowY:"auto" }}>
            {loading
              ? <div className="py-10 text-center text-sm" style={{ color:T.gray }}>Cargando...</div>
              : filtrados.length === 0
                ? <div className="py-10 text-center text-sm" style={{ color:T.gray }}>Sin resultados</div>
                : filtrados.map((p, i) => {
                  const exp = p.expediente?.[0];
                  const est = exp ? EXP_ESTADO[exp.estado] : null;
                  const activo = seleccionado?.id === p.id;
                  return (
                    <motion.button key={p.id} onClick={() => abrirPaciente(p)}
                      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                      className="w-full text-left flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 transition-all"
                      style={{ background: activo ? `${T.teal}08` : "white", borderLeft: activo ? `3px solid ${T.teal}` : "3px solid transparent" }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                        style={{ background:`linear-gradient(135deg,${T.teal},#008C99)` }}>
                        {p.nombres[0]}{p.apellidos[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate" style={{ color:T.dark }}>{p.apellidos}, {p.nombres}</div>
                        <div className="text-xs" style={{ color:T.gray }}>{edad(p.fecha_nacimiento)} años · {p.grado_escolar || "—"}</div>
                      </div>
                      {est && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                          style={{ background:est.bg, color:est.color }}>{exp.estado}</span>
                      )}
                    </motion.button>
                  );
                })
            }
          </div>
        </div>

        {/* ── Panel derecho: detalle ── */}
        <div className="flex-1">
          {!seleccionado
            ? <div className="h-full flex flex-col items-center justify-center text-center" style={{ color:T.gray }}>
                <User size={40} className="mb-3 opacity-30"/>
                <p className="text-sm font-medium">Selecciona un paciente para ver su información</p>
              </div>
            : (
              <motion.div key={seleccionado.id} initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} className="h-full flex flex-col gap-4">
                {/* Header paciente */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0"
                    style={{ background:`linear-gradient(135deg,${T.teal},#008C99)` }}>
                    {seleccionado.nombres[0]}{seleccionado.apellidos[0]}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-black" style={{ fontFamily:"Poppins", color:T.dark }}>
                      {seleccionado.nombres} {seleccionado.apellidos}
                    </h2>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color:T.gray }}>
                      <span><Calendar size={11} className="inline mr-1"/>{edad(seleccionado.fecha_nacimiento)} años</span>
                      <span className="capitalize">{seleccionado.genero}</span>
                      {seleccionado.colegio && <span><BookOpen size={11} className="inline mr-1"/>{seleccionado.colegio}</span>}
                      {expediente && (
                        <span className="px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: EXP_ESTADO[expediente.estado]?.bg, color: EXP_ESTADO[expediente.estado]?.color }}>
                          {expediente.numero_expediente} · {expediente.estado}
                        </span>
                      )}
                    </div>
                  </div>
                  <a href={`/psicologo/citas?paciente=${seleccionado.id}`}
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold"
                    style={{ background:`linear-gradient(135deg,${T.orange},#e07810)` }}>
                    <Calendar size={13}/> Nueva cita
                  </a>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1">
                  {[["info","Información"],["expediente","Expediente"],["citas","Historial de citas"]].map(([key,label]) => (
                    <button key={key} onClick={() => setTab(key)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ background: tab===key ? T.teal : "transparent", color: tab===key ? "white" : T.gray }}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Contenido tab */}
                <AnimatePresence mode="wait">
                  <motion.div key={tab} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1" style={{ overflowY:"auto", maxHeight:"calc(100vh - 360px)" }}>

                    {tab === "info" && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Dato label="Nombres completos"  value={`${seleccionado.nombres} ${seleccionado.apellidos}`}/>
                        <Dato label="Fecha de nacimiento" value={new Date(seleccionado.fecha_nacimiento).toLocaleDateString("es-NI",{day:"numeric",month:"long",year:"numeric"})}/>
                        <Dato label="Edad"               value={`${edad(seleccionado.fecha_nacimiento)} años`}/>
                        <Dato label="Género"             value={seleccionado.genero}/>
                        <Dato label="Cédula"             value={seleccionado.cedula || "No registrada"}/>
                        <Dato label="Colegio"            value={seleccionado.colegio || "—"}/>
                        <Dato label="Grado escolar"      value={seleccionado.grado_escolar || "—"}/>
                        <Dato label="Contacto emergencia" value={seleccionado.contacto_emergencia}/>
                        <Dato label="Teléfono emergencia" value={seleccionado.telefono_emergencia}/>
                        <Dato label="Registrado el"      value={new Date(seleccionado.created_at).toLocaleDateString("es-NI")}/>
                      </div>
                    )}

                    {tab === "expediente" && (
                      expediente
                        ? <div className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                              <Dato label="Número de expediente" value={expediente.numero_expediente}/>
                              <Dato label="Estado"               value={expediente.estado}/>
                              <Dato label="Abierto el"           value={new Date(expediente.created_at).toLocaleDateString("es-NI")}/>
                              {expediente.fecha_alta && <Dato label="Fecha de alta" value={new Date(expediente.fecha_alta).toLocaleDateString("es-NI")}/>}
                            </div>
                            <Dato label="Motivo de consulta"          value={expediente.motivo_consulta}  block/>
                            <Dato label="Antecedentes médicos"        value={expediente.antecedentes_medicos || "Sin registrar"} block/>
                            <Dato label="Medicación actual"           value={expediente.medicacion_actual  || "Sin registrar"} block/>
                            <Dato label="Objetivos terapéuticos"      value={expediente.objetivos_terapeuticos || "Sin registrar"} block/>
                            {Array.isArray(expediente.diagnosticos) && expediente.diagnosticos.length > 0 && (
                              <div>
                                <p className="text-xs font-bold mb-2" style={{ color:T.gray }}>Diagnósticos</p>
                                <div className="space-y-1">
                                  {expediente.diagnosticos.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background:`${T.teal}08` }}>
                                      <span className="text-xs font-black" style={{ color:T.teal }}>{d.codigo}</span>
                                      <span className="text-xs" style={{ color:T.dark }}>{d.descripcion}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        : <div className="py-10 text-center" style={{ color:T.gray }}>
                            <FileText size={32} className="mx-auto mb-2 opacity-30"/>
                            <p className="text-sm">Sin expediente abierto</p>
                          </div>
                    )}

                    {tab === "citas" && (
                      citasPac.length === 0
                        ? <div className="py-10 text-center" style={{ color:T.gray }}>
                            <Calendar size={32} className="mx-auto mb-2 opacity-30"/>
                            <p className="text-sm">Sin citas registradas</p>
                          </div>
                        : <div className="space-y-2">
                            {citasPac.map(c => (
                              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background:"#f8fffe" }}>
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ESTADO_CITA[c.estado] ?? T.gray }}/>
                                <div className="flex-1 text-sm" style={{ color:T.dark }}>
                                  {new Date(c.fecha_inicio).toLocaleString("es-NI",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
                                </div>
                                <span className="text-xs capitalize" style={{ color:T.gray }}>{c.modalidad}</span>
                                <span className="text-xs capitalize font-semibold" style={{ color: ESTADO_CITA[c.estado] ?? T.gray }}>{c.estado}</span>
                              </div>
                            ))}
                          </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )
          }
        </div>
      </div>

      {/* ── Modal nuevo paciente ── */}
      <AnimatePresence>
        {modalNuevo && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background:"rgba(0,0,0,0.45)", backdropFilter:"blur(4px)" }}>
            <motion.div initial={{ scale:0.94, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.94 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h3 className="font-black text-base" style={{ fontFamily:"Poppins", color:T.dark }}>Nuevo paciente</h3>
                <button onClick={() => setModalNuevo(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
                  <X size={15} style={{ color:T.gray }}/>
                </button>
              </div>
              <div className="p-5 space-y-4">
                <Section title="Datos personales">
                  <div className="grid grid-cols-2 gap-3">
                    <FInput label="Nombres *"   value={form.nombres}   onChange={set("nombres")}/>
                    <FInput label="Apellidos *" value={form.apellidos} onChange={set("apellidos")}/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FInput label="Fecha de nacimiento *" type="date" value={form.fecha_nacimiento} onChange={set("fecha_nacimiento")}/>
                    <FSelect label="Género *" value={form.genero} onChange={set("genero")}>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="no_binario">No binario</option>
                      <option value="prefiero_no_decir">Prefiero no decir</option>
                      <option value="otro">Otro</option>
                    </FSelect>
                  </div>
                  <FInput label="Cédula" value={form.cedula} onChange={set("cedula")} placeholder="Opcional"/>
                </Section>

                <Section title="Información educativa">
                  <div className="grid grid-cols-2 gap-3">
                    <FInput label="Colegio"       value={form.colegio}       onChange={set("colegio")}/>
                    <FInput label="Grado escolar" value={form.grado_escolar} onChange={set("grado_escolar")}/>
                  </div>
                </Section>

                <Section title="Contacto de emergencia">
                  <div className="grid grid-cols-2 gap-3">
                    <FInput label="Nombre *"    value={form.contacto_emergencia} onChange={set("contacto_emergencia")}/>
                    <FInput label="Teléfono *"  value={form.telefono_emergencia} onChange={set("telefono_emergencia")} type="tel"/>
                  </div>
                </Section>

                <Section title="Expediente clínico inicial">
                  <FTextarea label="Motivo de consulta *" value={form.motivo_consulta} onChange={set("motivo_consulta")}
                    placeholder="Describe brevemente el motivo de consulta..." rows={3}/>
                </Section>

                {error && <p className="text-xs text-red-500 font-semibold">⚠️ {error}</p>}

                <div className="flex gap-2 pt-1">
                  <button onClick={() => setModalNuevo(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold" style={{ color:T.gray }}>Cancelar</button>
                  <motion.button onClick={crearPaciente} disabled={saving} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                    className="flex-1 py-3 rounded-xl text-white text-sm font-bold shadow-md"
                    style={{ background:`linear-gradient(135deg,${T.teal},#008C99)`, opacity:saving?0.7:1 }}>
                    {saving ? "Registrando..." : "Registrar paciente"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

// ── Helpers UI ─────────────────────────────────────────────────
const ESTADO_CITA = { programada:"#f97316", confirmada:"#00AFC1", completada:"#16a34a", cancelada:"#dc2626", no_asistio:"#7c3aed" };

function Dato({ label, value, block=false }) {
  return (
    <div className={block ? "sm:col-span-2" : ""}>
      <p className="text-xs font-bold mb-0.5" style={{ color:"#9ca3af" }}>{label}</p>
      <p className="text-sm font-semibold capitalize" style={{ color:T.dark, whiteSpace: block?"pre-wrap":"normal" }}>{value || "—"}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide mb-3 pb-1 border-b border-gray-100" style={{ color:T.teal }}>{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FInput({ label, type="text", value, onChange, placeholder="" }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1" style={{ color:"#374151" }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
        style={{ fontFamily:"Nunito" }}/>
    </div>
  );
}

function FSelect({ label, value, onChange, children }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1" style={{ color:"#374151" }}>{label}</label>
      <select value={value} onChange={onChange}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 bg-white transition-all"
        style={{ fontFamily:"Nunito" }}>
        {children}
      </select>
    </div>
  );
}

function FTextarea({ label, value, onChange, placeholder, rows=3 }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1" style={{ color:"#374151" }}>{label}</label>
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 resize-none transition-all"
        style={{ fontFamily:"Nunito" }}/>
    </div>
  );
}