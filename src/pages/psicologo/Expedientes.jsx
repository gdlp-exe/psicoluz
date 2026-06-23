// src/pages/psicologo/Expedientes.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, X, Search, ChevronDown, ChevronUp,
  Save, Lock, Unlock, Paperclip, CheckSquare, Brain,
  AlertCircle, Clock, User, BookOpen, Edit3, Trash2
} from "lucide-react";
import { Layout } from "./Dashboard";

const T = { teal:"#00AFC1", orange:"#F7931E", dark:"#222222", gray:"#6b7280" };

const TABS = [
  { key:"resumen",     label:"Resumen"      },
  { key:"notas",       label:"Notas"        },
  { key:"evaluaciones",label:"Evaluaciones" },
  { key:"tareas",      label:"Tareas"       },
  { key:"archivos",    label:"Archivos"     },
];

const VISIBILIDAD = {
  solo_psicologo:  { label:"Solo psicóloga",   color:"#7c3aed", bg:"#faf5ff" },
  equipo_clinico:  { label:"Equipo clínico",    color:T.teal,    bg:"#f0fdfe" },
  paciente_tutor:  { label:"Paciente / Tutor",  color:"#16a34a", bg:"#f0fdf4" },
};
const PRIOCOLOR = { urgente:"#ef4444", alta:"#f97316", media:T.orange, baja:"#16a34a" };
const EVAL_TIPO = ["psicologica","pedagogica","del_lenguaje","motora","socioemocional","inicial","seguimiento","alta"];
const EXP_ESTADO = { activo:"#00AFC1", en_espera:"#f97316", suspendido:"#7c3aed", alta:"#16a34a", archivado:"#6b7280" };

// ── Helpers UI (internos) ─────────────────────────────────────
const Label = ({ children }) => <label className="block text-xs font-bold mb-1" style={{ color:"#374151" }}>{children}</label>;
const FInput = ({ label, type="text", value, onChange, placeholder="", disabled=false }) => (
  <div><Label>{label}</Label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all disabled:bg-gray-50 disabled:text-gray-400"
      style={{ fontFamily:"Nunito" }}/></div>
);
const FTextarea = ({ label, value, onChange, rows=3, placeholder="", disabled=false }) => (
  <div><Label>{label}</Label>
    <textarea value={value} onChange={onChange} rows={rows} placeholder={placeholder} disabled={disabled}
      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 resize-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
      style={{ fontFamily:"Nunito" }}/></div>
);
const FSelect = ({ label, value, onChange, children, disabled=false }) => (
  <div><Label>{label}</Label>
    <select value={value} onChange={onChange} disabled={disabled}
      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 bg-white focus:ring-2 focus:ring-teal-100 transition-all disabled:bg-gray-50"
      style={{ fontFamily:"Nunito" }}>{children}</select></div>
);
const Pill = ({ label, color, bg }) => (
  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ color, background:bg }}>{label}</span>
);
const Spinner = () => (
  <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin inline-block"
    style={{ borderColor:`${T.teal}30`, borderTopColor:T.teal }}/>
);

function Modal({ title, onClose, children, wide=false }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,0.45)", backdropFilter:"blur(4px)" }}>
      <motion.div initial={{ scale:0.94, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.94 }}
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide?"max-w-2xl":"max-w-lg"} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-black text-base" style={{ fontFamily:"Poppins", color:T.dark }}>{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
            <X size={15} style={{ color:T.gray }}/></button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function Expedientes() {
  const [psicologoId, setPsi]     = useState(null);
  const [lista, setLista]         = useState([]);
  const [busqueda, setBusqueda]   = useState("");
  const [seleccionado, setSel]    = useState(null);
  const [tab, setTab]             = useState("resumen");
  const [loading, setLoading]     = useState(true);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { data:{ user } } = await supabase.auth.getUser();
    const { data: psi } = await supabase.from("psicologo").select("id").eq("perfil_id", user.id).single();
    if (!psi) return;
    setPsi(psi.id);
    cargar(psi.id);
  };

  const cargar = async (pid) => {
    setLoading(true);
    const { data } = await supabase
      .from("expediente")
      .select(`id, numero_expediente, estado, motivo_consulta, created_at,
               paciente(id, nombres, apellidos, fecha_nacimiento, genero)`)
      .eq("psicologo_id", pid)
      .order("created_at", { ascending: false });
    setLista(data ?? []);
    setLoading(false);
  };

  const abrirExpediente = async (exp) => {
    setSel({ ...exp, _loaded: false });
    setTab("resumen");
    // Cargar datos completos
    const { data } = await supabase
      .from("expediente").select("*").eq("id", exp.id).single();
    setSel({ ...exp, ...data, _loaded: true });
  };

  const filtrados = lista.filter(e =>
    `${e.paciente?.nombres} ${e.paciente?.apellidos} ${e.numero_expediente}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const edad = fn => Math.floor((Date.now() - new Date(fn)) / 31557600000);

  return (
    <Layout current="expedientes">
      <div className="flex gap-6 h-full">

        {/* ── Lista ── */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          <div>
            <h1 className="text-xl font-black" style={{ fontFamily:"Poppins", color:T.dark }}>Expedientes</h1>
            <p className="text-xs" style={{ color:T.gray }}>{lista.length} expedientes</p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:T.gray }}/>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar paciente..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 bg-white transition-all"
              style={{ fontFamily:"Nunito" }}/>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1"
            style={{ maxHeight:"calc(100vh - 200px)", overflowY:"auto" }}>
            {loading
              ? <div className="py-10 text-center"><Spinner/></div>
              : filtrados.length === 0
                ? <div className="py-10 text-center text-sm" style={{ color:T.gray }}>Sin expedientes</div>
                : filtrados.map((e, i) => {
                  const activo = seleccionado?.id === e.id;
                  const color  = EXP_ESTADO[e.estado] ?? T.gray;
                  return (
                    <motion.button key={e.id} onClick={() => abrirExpediente(e)}
                      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}
                      className="w-full text-left px-4 py-3.5 border-b border-gray-50 last:border-0 flex items-center gap-3 transition-all"
                      style={{ background: activo ? `${T.teal}08` : "white", borderLeft: activo ? `3px solid ${T.teal}` : "3px solid transparent" }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                        style={{ background:`linear-gradient(135deg,${T.teal},#008C99)` }}>
                        {e.paciente?.nombres?.[0]}{e.paciente?.apellidos?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate" style={{ color:T.dark }}>
                          {e.paciente?.apellidos}, {e.paciente?.nombres}
                        </div>
                        <div className="text-xs" style={{ color:T.gray }}>{e.numero_expediente}</div>
                      </div>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:color }}/>
                    </motion.button>
                  );
                })
            }
          </div>
        </div>

        {/* ── Detalle ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {!seleccionado
            ? <div className="flex-1 flex flex-col items-center justify-center" style={{ color:T.gray }}>
                <FileText size={44} className="mb-3 opacity-25"/>
                <p className="text-sm font-medium">Selecciona un expediente</p>
              </div>
            : <ExpedienteDetalle
                key={seleccionado.id}
                expediente={seleccionado}
                psicologoId={psicologoId}
                tab={tab} setTab={setTab}
                onUpdate={exp => setSel(s => ({ ...s, ...exp }))}
                onReload={() => cargar(psicologoId)}
              />
          }
        </div>
      </div>
    </Layout>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETALLE DEL EXPEDIENTE
// ═══════════════════════════════════════════════════════════════
function ExpedienteDetalle({ expediente: exp, psicologoId, tab, setTab, onUpdate, onReload }) {
  const [editando, setEditando] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [campos, setCampos]     = useState({});
  const sc = k => e => setCampos(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    setCampos({
      estado:                 exp.estado ?? "activo",
      motivo_consulta:        exp.motivo_consulta ?? "",
      antecedentes_medicos:   exp.antecedentes_medicos ?? "",
      medicacion_actual:      exp.medicacion_actual ?? "",
      objetivos_terapeuticos: exp.objetivos_terapeuticos ?? "",
    });
    setEditando(false);
  }, [exp.id]);

  const guardar = async () => {
    setSaving(true);
    const { data } = await supabase.from("expediente")
      .update({ ...campos, updated_at: new Date().toISOString() })
      .eq("id", exp.id).select().single();
    setSaving(false);
    setEditando(false);
    onUpdate(data);
  };

  const edad = fn => Math.floor((Date.now() - new Date(fn)) / 31557600000);
  const color = EXP_ESTADO[exp.estado] ?? T.gray;

  return (
    <motion.div key={exp.id} initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0"
              style={{ background:`linear-gradient(135deg,${T.teal},#008C99)` }}>
              {exp.paciente?.nombres?.[0]}{exp.paciente?.apellidos?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-black" style={{ fontFamily:"Poppins", color:T.dark }}>
                {exp.paciente?.nombres} {exp.paciente?.apellidos}
              </h2>
              <div className="flex flex-wrap gap-2 mt-1 items-center">
                <span className="text-xs" style={{ color:T.gray }}>
                  {edad(exp.paciente?.fecha_nacimiento)} años · {exp.paciente?.genero}
                </span>
                <span className="text-xs font-bold" style={{ color:T.gray }}>{exp.numero_expediente}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold capitalize"
                  style={{ background:`${color}15`, color }}>
                  {exp.estado}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {editando
              ? <>
                  <button onClick={() => setEditando(false)} className="px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200" style={{ color:T.gray }}>Cancelar</button>
                  <motion.button onClick={guardar} disabled={saving} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-xs font-bold shadow"
                    style={{ background:`linear-gradient(135deg,${T.teal},#008C99)` }}>
                    {saving ? <Spinner/> : <><Save size={13}/> Guardar</>}
                  </motion.button>
                </>
              : <motion.button onClick={() => setEditando(true)} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-xs font-bold shadow"
                  style={{ background:`linear-gradient(135deg,${T.orange},#e07810)` }}>
                  <Edit3 size={13}/> Editar
                </motion.button>
            }
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: tab===key ? T.teal : "transparent", color: tab===key ? "white" : T.gray }}>
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
          className="flex-1 overflow-auto" style={{ maxHeight:"calc(100vh - 380px)" }}>

          {tab === "resumen"      && <TabResumen exp={exp} editando={editando} campos={campos} sc={sc}/>}
          {tab === "notas"        && <TabNotas       expedienteId={exp.id} psicologoId={psicologoId}/>}
          {tab === "evaluaciones" && <TabEvaluaciones expedienteId={exp.id} psicologoId={psicologoId}/>}
          {tab === "tareas"       && <TabTareas       expedienteId={exp.id} psicologoId={psicologoId}/>}
          {tab === "archivos"     && <TabArchivos     expedienteId={exp.id} psicologoId={psicologoId}/>}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── TAB RESUMEN ─────────────────────────────────────────────
function TabResumen({ exp, editando, campos, sc }) {
  const [diag, setDiag]       = useState([]);
  const [modalDiag, setMDiag] = useState(false);
  const [nd, setNd]           = useState({ codigo:"", descripcion:"" });

  useEffect(() => { setDiag(exp.diagnosticos ?? []); }, [exp.id]);

  const agregarDiag = async () => {
    if (!nd.codigo || !nd.descripcion) return;
    const nuevo = [...diag, { ...nd, fecha: new Date().toISOString().split("T")[0] }];
    await supabase.from("expediente").update({ diagnosticos: nuevo }).eq("id", exp.id);
    setDiag(nuevo); setNd({ codigo:"", descripcion:"" }); setMDiag(false);
  };
  const eliminarDiag = async (i) => {
    const nuevo = diag.filter((_,idx) => idx !== i);
    await supabase.from("expediente").update({ diagnosticos: nuevo }).eq("id", exp.id);
    setDiag(nuevo);
  };

  return (
    <div className="space-y-4">
      {/* Datos clínicos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-xs font-black uppercase tracking-wide pb-1 border-b border-gray-100" style={{ color:T.teal }}>Información clínica</p>
        {editando
          ? <>
              <FSelect label="Estado del expediente" value={campos.estado} onChange={sc("estado")}>
                {Object.keys(EXP_ESTADO).map(k => <option key={k} value={k}>{k}</option>)}
              </FSelect>
              <FTextarea label="Motivo de consulta" value={campos.motivo_consulta} onChange={sc("motivo_consulta")} rows={3}/>
              <FTextarea label="Antecedentes médicos" value={campos.antecedentes_medicos} onChange={sc("antecedentes_medicos")} rows={3}/>
              <FTextarea label="Medicación actual" value={campos.medicacion_actual} onChange={sc("medicacion_actual")} rows={2}/>
              <FTextarea label="Objetivos terapéuticos" value={campos.objetivos_terapeuticos} onChange={sc("objetivos_terapeuticos")} rows={3}/>
            </>
          : <div className="grid sm:grid-cols-2 gap-4">
              {[
                ["Motivo de consulta",     exp.motivo_consulta],
                ["Antecedentes médicos",   exp.antecedentes_medicos],
                ["Medicación actual",      exp.medicacion_actual],
                ["Objetivos terapéuticos", exp.objetivos_terapeuticos],
                ["Apertura",               exp.created_at ? new Date(exp.created_at).toLocaleDateString("es-NI") : null],
                ["Última actualización",   exp.updated_at ? new Date(exp.updated_at).toLocaleDateString("es-NI") : null],
              ].map(([k, v]) => (
                <div key={k} className={k.length > 20 ? "sm:col-span-2" : ""}>
                  <p className="text-xs font-bold mb-0.5" style={{ color:"#9ca3af" }}>{k}</p>
                  <p className="text-sm" style={{ color:T.dark }}>{v || <span style={{ color:"#d1d5db" }}>Sin registrar</span>}</p>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Diagnósticos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black uppercase tracking-wide" style={{ color:T.teal }}>Diagnósticos</p>
          <button onClick={() => setMDiag(true)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg"
            style={{ background:`${T.orange}15`, color:T.orange }}>
            <Plus size={12}/> Agregar
          </button>
        </div>
        {diag.length === 0
          ? <p className="text-sm text-center py-4" style={{ color:"#d1d5db" }}>Sin diagnósticos registrados</p>
          : <div className="space-y-2">
              {diag.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background:`${T.teal}06` }}>
                  <span className="text-xs font-black px-2 py-0.5 rounded-lg" style={{ background:`${T.teal}15`, color:T.teal }}>{d.codigo}</span>
                  <span className="flex-1 text-sm" style={{ color:T.dark }}>{d.descripcion}</span>
                  <span className="text-xs" style={{ color:T.gray }}>{d.fecha}</span>
                  <button onClick={() => eliminarDiag(i)} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={13}/></button>
                </div>
              ))}
            </div>
        }
      </div>

      <AnimatePresence>
        {modalDiag && (
          <Modal title="Agregar diagnóstico" onClose={() => setMDiag(false)}>
            <div className="space-y-3">
              <FInput label="Código (CIE-10 / DSM-5) *" value={nd.codigo} onChange={e => setNd(p=>({...p,codigo:e.target.value}))} placeholder="Ej: F90.0"/>
              <FTextarea label="Descripción *" value={nd.descripcion} onChange={e => setNd(p=>({...p,descripcion:e.target.value}))} rows={2} placeholder="Ej: Trastorno por déficit de atención con hiperactividad"/>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setMDiag(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold" style={{ color:T.gray }}>Cancelar</button>
                <button onClick={agregarDiag} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background:`linear-gradient(135deg,${T.teal},#008C99)` }}>Guardar</button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TAB NOTAS CLÍNICAS ───────────────────────────────────────
function TabNotas({ expedienteId, psicologoId }) {
  const [notas, setNotas]   = useState([]);
  const [modal, setModal]   = useState(false);
  const [abierta, setAbierta] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sesionNum, setSesionNum] = useState(1);

  const EMPTY = { visibilidad:"solo_psicologo", resumen_sesion:"", observaciones_clinicas:"", notas_privadas:"", tareas_asignadas:"", duracion_minutos:"60", modalidad:"presencial" };
  const [form, setForm] = useState(EMPTY);
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => { cargar(); }, [expedienteId]);

  const cargar = async () => {
    const { data } = await supabase.from("nota_clinica")
      .select("id, sesion_numero, fecha_sesion, visibilidad, borrador, resumen_sesion, duracion_minutos, created_at")
      .eq("expediente_id", expedienteId).order("sesion_numero", { ascending:false });
    setNotas(data ?? []);
    setSesionNum((data?.length ?? 0) + 1);
  };

  const cargarDetalle = async (id) => {
    const { data } = await supabase.from("nota_clinica").select("*").eq("id", id).single();
    setAbierta(data);
  };

  const crear = async () => {
    setSaving(true);
   await supabase.from("nota_clinica").insert({
  expediente_id:          expedienteId,
  psicologo_id:           psicologoId,
  sesion_numero:          sesionNum,
  fecha_sesion:           new Date().toISOString(),
  visibilidad:            form.visibilidad,
  resumen_sesion:         form.resumen_sesion      || null,
  observaciones_clinicas: form.observaciones_clinicas || null,
  notas_privadas:         form.notas_privadas      || null,
  tareas_asignadas:       form.tareas_asignadas    || null,
  duracion_minutos:       parseInt(form.duracion_minutos) || 60,
  modalidad:              form.modalidad,
  borrador:               true,
});
    setSaving(false); setModal(false); setForm(EMPTY); cargar();
  };

  const cerrarNota = async (id) => {
    await supabase.from("nota_clinica").update({ borrador:false, updated_at:new Date().toISOString() }).eq("id", id);
    setAbierta(p => ({ ...p, borrador:false }));
    cargar();
  };

  const vis = n => VISIBILIDAD[n.visibilidad] ?? {};

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <motion.button onClick={() => setModal(true)} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow"
          style={{ background:`linear-gradient(135deg,${T.teal},#008C99)` }}>
          <Plus size={13}/> Nueva nota
        </motion.button>
      </div>

      {notas.length === 0
        ? <Empty msg="Sin notas clínicas"/>
        : notas.map((n, i) => (
          <motion.button key={n.id} onClick={() => cargarDetalle(n.id)}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
            className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-teal-200 transition-all flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                style={{ background:`${T.teal}12`, color:T.teal }}>
                {n.sesion_numero}
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color:T.dark }}>Sesión #{n.sesion_numero}</div>
                <div className="text-xs mt-0.5" style={{ color:T.gray }}>
                  {new Date(n.fecha_sesion).toLocaleDateString("es-NI",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
                  {n.duracion_minutos && ` · ${n.duracion_minutos} min`}
                </div>
                {n.resumen_sesion && <p className="text-xs mt-1 line-clamp-1" style={{ color:T.gray }}>{n.resumen_sesion}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Pill {...vis(n)}/>
              {n.borrador
                ? <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background:"#fff7ed", color:T.orange }}>Borrador</span>
                : <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background:"#f0fdf4", color:"#16a34a" }}>Cerrada</span>
              }
            </div>
          </motion.button>
        ))
      }

      {/* Modal nueva nota */}
      <AnimatePresence>
        {modal && (
          <Modal title={`Nueva nota — Sesión #${sesionNum}`} onClose={() => setModal(false)} wide>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FSelect label="Visibilidad" value={form.visibilidad} onChange={sf("visibilidad")}>
                  {Object.entries(VISIBILIDAD).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </FSelect>
                <FSelect label="Modalidad" value={form.modalidad} onChange={sf("modalidad")}>
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                </FSelect>
              </div>
              <FInput label="Duración (minutos)" type="number" value={form.duracion_minutos} onChange={sf("duracion_minutos")}/>
              <FTextarea label="Resumen de sesión" value={form.resumen_sesion} onChange={sf("resumen_sesion")} rows={3} placeholder="¿Qué trabajaron hoy?"/>
              <FTextarea label="Observaciones clínicas" value={form.observaciones_clinicas} onChange={sf("observaciones_clinicas")} rows={3}/>
              <FTextarea label="Notas privadas (solo tú)" value={form.notas_privadas} onChange={sf("notas_privadas")} rows={2} placeholder="Hipótesis, impresiones internas..."/>
              <FTextarea label="Tareas asignadas al paciente" value={form.tareas_asignadas} onChange={sf("tareas_asignadas")} rows={2}/>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold" style={{ color:T.gray }}>Cancelar</button>
                <motion.button onClick={crear} disabled={saving} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
                  style={{ background:`linear-gradient(135deg,${T.teal},#008C99)` }}>
                  {saving ? <Spinner/> : "Guardar nota"}
                </motion.button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Drawer detalle nota */}
      <AnimatePresence>
        {abierta && (
          <Modal title={`Sesión #${abierta.sesion_numero}`} onClose={() => setAbierta(null)} wide>
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Pill {...VISIBILIDAD[abierta.visibilidad]}/>
                {abierta.borrador
                  ? <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background:"#fff7ed", color:T.orange }}>Borrador</span>
                  : <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background:"#f0fdf4", color:"#16a34a" }}>Cerrada</span>
                }
                <span className="text-xs" style={{ color:T.gray }}>
                  {new Date(abierta.fecha_sesion).toLocaleDateString("es-NI",{weekday:"long",day:"numeric",month:"long"})}
                  {abierta.duracion_minutos && ` · ${abierta.duracion_minutos} min`}
                </span>
              </div>
              {[
                ["Resumen de sesión",       abierta.resumen_sesion],
                ["Observaciones clínicas",  abierta.observaciones_clinicas],
                ["Notas privadas",          abierta.notas_privadas],
                ["Tareas asignadas",        abierta.tareas_asignadas],
              ].map(([k, v]) => v ? (
                <div key={k} className="p-3 rounded-xl" style={{ background:`${T.teal}06` }}>
                  <p className="text-xs font-bold mb-1" style={{ color:T.teal }}>{k}</p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color:T.dark }}>{v}</p>
                </div>
              ) : null)}
              {abierta.borrador && (
                <motion.button onClick={() => cerrarNota(abierta.id)} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2"
                  style={{ background:`linear-gradient(135deg,#16a34a,#15803d)` }}>
                  <Lock size={14}/> Cerrar nota definitivamente
                </motion.button>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TAB EVALUACIONES ────────────────────────────────────────
function TabEvaluaciones({ expedienteId, psicologoId }) {
  const [evals, setEvals]   = useState([]);
  const [modal, setModal]   = useState(false);
  const [saving, setSaving] = useState(false);
  const EMPTY = { tipo:"inicial", nombre_prueba:"", interpretacion:"", recomendaciones:"" };
  const [form, setForm]     = useState(EMPTY);
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => { cargar(); }, [expedienteId]);
  const cargar = async () => {
    const { data } = await supabase.from("evaluacion")
      .select("id, tipo, nombre_prueba, fecha_aplicacion, firmada, interpretacion")
      .eq("expediente_id", expedienteId).order("fecha_aplicacion", { ascending:false });
    setEvals(data ?? []);
  };

  const crear = async () => {
    setSaving(true);
    await supabase.from("evaluacion").insert({
      expediente_id: expedienteId, psicologo_id: psicologoId,
      fecha_aplicacion: new Date().toISOString(), ...form,
    });
    setSaving(false); setModal(false); setForm(EMPTY); cargar();
  };

  const firmar = async (id) => {
    await supabase.from("evaluacion").update({ firmada:true, updated_at:new Date().toISOString() }).eq("id", id);
    cargar();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <motion.button onClick={() => setModal(true)} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow"
          style={{ background:`linear-gradient(135deg,${T.orange},#e07810)` }}>
          <Plus size={13}/> Nueva evaluación
        </motion.button>
      </div>
      {evals.length === 0 ? <Empty msg="Sin evaluaciones"/> : evals.map((ev, i) => (
        <motion.div key={ev.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:`${T.orange}12` }}>
              <Brain size={17} style={{ color:T.orange }}/>
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color:T.dark }}>{ev.nombre_prueba}</div>
              <div className="text-xs mt-0.5 capitalize" style={{ color:T.gray }}>
                {ev.tipo.replace(/_/g," ")} · {new Date(ev.fecha_aplicacion).toLocaleDateString("es-NI")}
              </div>
              {ev.interpretacion && <p className="text-xs mt-1 line-clamp-1" style={{ color:T.gray }}>{ev.interpretacion}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {ev.firmada
              ? <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background:"#f0fdf4", color:"#16a34a" }}>Firmada</span>
              : <button onClick={() => firmar(ev.id)} className="text-xs px-2 py-0.5 rounded-full font-bold border transition-colors hover:bg-teal-50"
                  style={{ borderColor:T.teal, color:T.teal }}>
                  Firmar
                </button>
            }
          </div>
        </motion.div>
      ))}
      <AnimatePresence>
        {modal && (
          <Modal title="Nueva evaluación" onClose={() => setModal(false)} wide>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FSelect label="Tipo *" value={form.tipo} onChange={sf("tipo")}>
                  {EVAL_TIPO.map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                </FSelect>
                <FInput label="Nombre de la prueba *" value={form.nombre_prueba} onChange={sf("nombre_prueba")} placeholder="Ej: WISC-V, Vineland"/>
              </div>
              <FTextarea label="Interpretación de resultados" value={form.interpretacion} onChange={sf("interpretacion")} rows={3}/>
              <FTextarea label="Recomendaciones" value={form.recomendaciones} onChange={sf("recomendaciones")} rows={3}/>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold" style={{ color:T.gray }}>Cancelar</button>
                <motion.button onClick={crear} disabled={saving} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
                  style={{ background:`linear-gradient(135deg,${T.orange},#e07810)` }}>
                  {saving ? <Spinner/> : "Guardar evaluación"}
                </motion.button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TAB TAREAS ───────────────────────────────────────────────
function TabTareas({ expedienteId, psicologoId }) {
  const [tareas, setTareas] = useState([]);
  const [modal, setModal]   = useState(false);
  const [saving, setSaving] = useState(false);
  const EMPTY = { titulo:"", descripcion:"", fecha_limite:"", prioridad:"media" };
  const [form, setForm]     = useState(EMPTY);
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => { cargar(); }, [expedienteId]);
  const cargar = async () => {
    const { data } = await supabase.from("tarea")
      .select("id, titulo, descripcion, fecha_limite, prioridad, estado, fecha_completada")
      .eq("expediente_id", expedienteId).order("fecha_limite");
    setTareas(data ?? []);
  };

  const crear = async () => {
    if (!form.titulo || !form.descripcion || !form.fecha_limite) return;
    setSaving(true);
    await supabase.from("tarea").insert({ expediente_id:expedienteId, asignada_por:psicologoId, ...form });
    setSaving(false); setModal(false); setForm(EMPTY); cargar();
  };

  const toggleEstado = async (t) => {
    const nuevo = t.estado === "completada" ? "pendiente" : "completada";
    await supabase.from("tarea").update({ estado:nuevo, fecha_completada: nuevo==="completada"?new Date().toISOString():null }).eq("id", t.id);
    cargar();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <motion.button onClick={() => setModal(true)} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow"
          style={{ background:`linear-gradient(135deg,${T.teal},#008C99)` }}>
          <Plus size={13}/> Nueva tarea
        </motion.button>
      </div>
      {tareas.length === 0 ? <Empty msg="Sin tareas asignadas"/> : tareas.map((t, i) => {
        const done = t.estado === "completada";
        return (
          <motion.div key={t.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
            <button onClick={() => toggleEstado(t)} className="mt-0.5 flex-shrink-0 transition-colors"
              style={{ color: done ? "#16a34a" : "#d1d5db" }}>
              <CheckSquare size={18}/>
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold" style={{ color: done ? "#9ca3af" : T.dark, textDecoration: done?"line-through":"none" }}>{t.titulo}</div>
              <div className="text-xs mt-0.5 line-clamp-1" style={{ color:T.gray }}>{t.descripcion}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs" style={{ color:T.gray }}>
                  <Clock size={10} className="inline mr-0.5"/>
                  {new Date(t.fecha_limite).toLocaleDateString("es-NI")}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background:`${PRIOCOLOR[t.prioridad]}15`, color:PRIOCOLOR[t.prioridad] }}>
                  {t.prioridad}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
      <AnimatePresence>
        {modal && (
          <Modal title="Nueva tarea terapéutica" onClose={() => setModal(false)}>
            <div className="space-y-3">
              <FInput label="Título *" value={form.titulo} onChange={sf("titulo")} placeholder="Ej: Registro de emociones diario"/>
              <FTextarea label="Descripción *" value={form.descripcion} onChange={sf("descripcion")} rows={3} placeholder="Instrucciones detalladas para el paciente..."/>
              <div className="grid grid-cols-2 gap-3">
                <FInput label="Fecha límite *" type="date" value={form.fecha_limite} onChange={sf("fecha_limite")}/>
                <FSelect label="Prioridad" value={form.prioridad} onChange={sf("prioridad")}>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </FSelect>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold" style={{ color:T.gray }}>Cancelar</button>
                <motion.button onClick={crear} disabled={saving} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
                  style={{ background:`linear-gradient(135deg,${T.teal},#008C99)` }}>
                  {saving ? <Spinner/> : "Asignar tarea"}
                </motion.button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TAB ARCHIVOS ─────────────────────────────────────────────
function TabArchivos({ expedienteId, psicologoId }) {
  const [archivos, setArchivos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [visible, setVisible]   = useState(false);

  useEffect(() => { cargar(); }, [expedienteId]);
  const cargar = async () => {
    const { data } = await supabase.from("archivo")
      .select("id, nombre_original, tipo, mime_type, tamano_bytes, visible_paciente, created_at")
      .eq("expediente_id", expedienteId).order("created_at", { ascending:false });
    setArchivos(data ?? []);
  };

  const subir = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setSubiendo(true);
    const ext    = file.name.split(".").pop();
    const nombre = `${expedienteId}/${Date.now()}.${ext}`;
    const { error: errUp } = await supabase.storage.from("expedientes").upload(nombre, file);
    if (!errUp) {
      await supabase.from("archivo").insert({
        expediente_id:   expedienteId,
        subido_por:      (await supabase.auth.getUser()).data.user.id,
        nombre_original: file.name,
        storage_path:    nombre,
        tipo:            "otro",
        mime_type:       file.type || "application/octet-stream",
        tamano_bytes:    file.size,
        visible_paciente: visible,
      });
      cargar();
    }
    setSubiendo(false);
    e.target.value = "";
  };

  const descargar = async (a) => {
    const { data } = await supabase.storage.from("expedientes").createSignedUrl(a.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const toggleVisible = async (a) => {
    await supabase.from("archivo").update({ visible_paciente: !a.visible_paciente }).eq("id", a.id);
    cargar();
  };

  const fmt = b => b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`;
  const iconColor = { "application/pdf":"#ef4444", "image/jpeg":"#3b82f6", "image/png":"#3b82f6" };

  return (
    <div className="space-y-3">
      {/* Upload */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer text-xs font-bold transition-colors hover:bg-teal-50"
            style={{ background:`${T.teal}10`, color:T.teal }}>
            <Paperclip size={14}/> {subiendo ? "Subiendo..." : "Subir archivo"}
            <input type="file" className="hidden" onChange={subir} accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.mp3,.wav,.mp4"/>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color:T.gray }}>
            <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} className="rounded"/>
            Visible para el paciente
          </label>
          <span className="text-xs" style={{ color:"#d1d5db" }}>PDF, imágenes, Word, audio, video · máx 100MB</span>
        </div>
      </div>

      {archivos.length === 0 ? <Empty msg="Sin archivos adjuntos"/> : archivos.map((a, i) => (
        <motion.div key={a.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background:`${iconColor[a.mime_type]??T.teal}12` }}>
            <Paperclip size={16} style={{ color: iconColor[a.mime_type] ?? T.teal }}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate" style={{ color:T.dark }}>{a.nombre_original}</div>
            <div className="text-xs" style={{ color:T.gray }}>
              {fmt(a.tamano_bytes)} · {new Date(a.created_at).toLocaleDateString("es-NI")}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => toggleVisible(a)} title={a.visible_paciente?"Ocultar al paciente":"Mostrar al paciente"}
              className="transition-colors" style={{ color: a.visible_paciente ? "#16a34a" : "#d1d5db" }}>
              {a.visible_paciente ? <Unlock size={15}/> : <Lock size={15}/>}
            </button>
            <button onClick={() => descargar(a)}
              className="px-3 py-1 rounded-lg text-xs font-bold transition-colors hover:bg-teal-50"
              style={{ color:T.teal }}>Abrir</button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function Empty({ msg }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center" style={{ color:"#d1d5db" }}>
      <FileText size={32} className="mx-auto mb-2"/>
      <p className="text-sm font-medium">{msg}</p>
    </div>
  );
}