// src/pages/PortalPaciente.jsx
// Acceso público por número de expediente — sin login requerido
// Variables Supabase: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
// Tablas usadas: expediente, paciente, tarea, nota_clinica, cita, notificacion

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, CheckSquare, Square, Calendar, Bell, Heart,
  Settings, Sun, Moon, Eye, Zap, Smile, ChevronDown,
  ChevronUp, Clock, Star, BookOpen, MessageCircle, X
} from "lucide-react";

// ── Google Fonts ──────────────────────────────────────────────
const _l = document.createElement("link");
_l.rel = "stylesheet";
_l.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Nunito:wght@400;500;600;700&family=Atkinson+Hyperlegible:wght@400;700&family=OpenDyslexic&display=swap";
document.head.appendChild(_l);

// ── Temas de accesibilidad ────────────────────────────────────
const TEMAS = {
  default: {
    label: "Estándar",
    emoji: "🎨",
    bg: "#f8fffe",
    card: "#ffffff",
    text: "#222222",
    textSub: "#6b7280",
    border: "#e5e7eb",
    accent: "#00AFC1",
    accent2: "#F7931E",
    accentBg: "#f0fdfe",
    font: "'Nunito', sans-serif",
  },
  alto_contraste: {
    label: "Alto contraste",
    emoji: "⬛",
    bg: "#000000",
    card: "#111111",
    text: "#ffffff",
    textSub: "#e5e5e5",
    border: "#444444",
    accent: "#ffff00",
    accent2: "#ff9900",
    accentBg: "#1a1a00",
    font: "'Atkinson Hyperlegible', sans-serif",
  },
  suave: {
    label: "Tonos suaves",
    emoji: "🌸",
    bg: "#fdf6f0",
    card: "#fffaf7",
    text: "#3d2b1f",
    textSub: "#8b6e5a",
    border: "#e8d5c4",
    accent: "#c17a4a",
    accent2: "#7cb8a0",
    accentBg: "#fef0e7",
    font: "'Nunito', sans-serif",
  },
  azul_calmado: {
    label: "Azul calmado",
    emoji: "🌊",
    bg: "#f0f4ff",
    card: "#f8faff",
    text: "#1a2344",
    textSub: "#4a5680",
    border: "#c7d2f0",
    accent: "#3b5bdb",
    accent2: "#74c0fc",
    accentBg: "#e7edff",
    font: "'Atkinson Hyperlegible', sans-serif",
  },
  sin_distracciones: {
    label: "Sin distracciones",
    emoji: "🧘",
    bg: "#fafafa",
    card: "#ffffff",
    text: "#1a1a1a",
    textSub: "#555555",
    border: "#e0e0e0",
    accent: "#555555",
    accent2: "#888888",
    accentBg: "#f5f5f5",
    font: "'Atkinson Hyperlegible', sans-serif",
  },
};

const TAMANIOS = {
  normal:  { label:"Normal",  base:15, title:22, card:"1rem" },
  grande:  { label:"Grande",  base:18, title:26, card:"1.1rem" },
  muy_grande: { label:"Muy grande", base:22, title:32, card:"1.2rem" },
};

const ESPACIADOS = {
  normal:  { label:"Normal",  gap:"1rem",  lineH:"1.5" },
  amplio:  { label:"Amplio",  gap:"1.5rem", lineH:"1.9" },
  muy_amplio: { label:"Muy amplio", gap:"2rem", lineH:"2.3" },
};

const PRIORIDAD_LABEL = { urgente:"Urgente 🔴", alta:"Alta 🟠", media:"Media 🟡", baja:"Baja 🟢" };
const ESTADO_TAREA = {
  pendiente:    { label:"Pendiente",  emoji:"⏳" },
  en_progreso:  { label:"En progreso",emoji:"🔄" },
  completada:   { label:"¡Completada!",emoji:"✅" },
  vencida:      { label:"Vencida",    emoji:"⚠️" },
  cancelada:    { label:"Cancelada",  emoji:"❌" },
};

// ═══════════════════════════════════════════════════════════════
export default function PortalPaciente() {
  // Accesibilidad
  const [tema, setTema]         = useState("default");
  const [tamano, setTamano]     = useState("normal");
  const [espaciado, setEspaciado] = useState("normal");
  const [animaciones, setAnim]  = useState(true);
  const [configOpen, setConf]   = useState(false);

  // Estado del portal
  const [numero, setNumero]     = useState("");
  const [buscando, setBuscando] = useState(false);
  const [datos, setDatos]       = useState(null);   // { expediente, paciente, tareas, citas, notas, notifs }
  const [error, setError]       = useState("");
  const [tab, setTab]           = useState("tareas");
  const [tareaAbierta, setTA]   = useState(null);
  const [motivando, setMot]     = useState(false);

  const T  = TEMAS[tema];
  const SZ = TAMANIOS[tamano];
  const SP = ESPACIADOS[espaciado];

  // Frases motivacionales
  const FRASES = [
    "Cada pequeño paso cuenta. ¡Vas muy bien! 🌱",
    "Tú puedes con esto. Tu psicóloga confía en ti. 💪",
    "El progreso no siempre se ve, pero siempre está pasando. ✨",
    "Hoy es un buen día para intentarlo. 🌟",
    "Cada tarea que completas te acerca a tu mejor versión. 🎯",
    "Recuerda respirar. Estás haciendo lo mejor que puedes. 🌬️",
  ];
  const [frase, setFrase] = useState(FRASES[0]);

  const motivar = () => {
    setFrase(FRASES[Math.floor(Math.random() * FRASES.length)]);
    setMot(true); setTimeout(() => setMot(false), 3000);
  };

  // Buscar expediente
  const buscar = async () => {
    if (!numero.trim()) return;
    setBuscando(true); setError(""); setDatos(null);

    // Solo campos que el paciente puede ver
    const { data: exp, error: errExp } = await supabase
      .from("expediente")
      .select("id, numero_expediente, estado, motivo_consulta, created_at, paciente(nombres, apellidos, fecha_nacimiento)")
      .eq("numero_expediente", numero.trim().toUpperCase())
      .single();

    if (errExp || !exp) {
      setError("Número de expediente no encontrado. Verifica que sea correcto.");
      setBuscando(false); return;
    }

    // Cargar datos permitidos en paralelo
    const [tareasR, citasR, notasR, notifsR] = await Promise.all([
      supabase.from("tarea")
        .select("id, titulo, descripcion, fecha_limite, prioridad, estado, fecha_completada, instrucciones")
        .eq("expediente_id", exp.id)
        .order("fecha_limite"),
      supabase.from("cita")
        .select("id, fecha_inicio, fecha_fin, estado, modalidad, link_virtual")
        .eq("paciente_id", exp.paciente?.id ?? "")
        .gte("fecha_inicio", new Date().toISOString())
        .in("estado", ["programada","confirmada"])
        .order("fecha_inicio")
        .limit(5),
      supabase.from("nota_clinica")
        .select("id, sesion_numero, fecha_sesion, resumen_sesion, tareas_asignadas")
        .eq("expediente_id", exp.id)
        .eq("visibilidad", "paciente_tutor")
        .eq("borrador", false)
        .order("sesion_numero", { ascending:false })
        .limit(10),
      // Notificaciones si el paciente tiene perfil (puede ser null)
      supabase.from("notificacion")
        .select("id, titulo, mensaje, estado, prioridad, created_at")
        .is("leida_at", null)
        .order("created_at", { ascending:false })
        .limit(10),
    ]);

    setDatos({
      expediente: exp,
      paciente:   exp.paciente,
      tareas:     tareasR.data ?? [],
      citas:      citasR.data ?? [],
      notas:      notasR.data ?? [],
    });
    setBuscando(false);
  };

  // Completar tarea
  const completarTarea = async (t) => {
    const nuevo = t.estado === "completada" ? "pendiente" : "completada";
    await supabase.from("tarea").update({
      estado: nuevo,
      fecha_completada: nuevo === "completada" ? new Date().toISOString() : null,
    }).eq("id", t.id);
    setDatos(d => ({ ...d, tareas: d.tareas.map(x => x.id===t.id ? { ...x, estado:nuevo } : x) }));
    if (nuevo === "completada") motivar();
  };

  const completadas = datos?.tareas.filter(t => t.estado === "completada").length ?? 0;
  const total       = datos?.tareas.length ?? 0;
  const progreso    = total > 0 ? Math.round((completadas / total) * 100) : 0;

  const edad = fn => Math.floor((Date.now() - new Date(fn)) / 31557600000);

  // CSS variables dinámicas
  const rootStyle = {
    "--bg":      T.bg,
    "--card":    T.card,
    "--text":    T.text,
    "--sub":     T.textSub,
    "--border":  T.border,
    "--accent":  T.accent,
    "--accent2": T.accent2,
    "--abg":     T.accentBg,
    fontFamily:  T.font,
    fontSize:    SZ.base,
    lineHeight:  SP.lineH,
    background:  T.bg,
    minHeight:   "100vh",
    color:       T.text,
    transition:  "background 0.3s, color 0.3s",
  };

  const MV = animaciones ? { initial:{opacity:0,y:12}, animate:{opacity:1,y:0} } : {};
  const cardStyle = { background:T.card, border:`1px solid ${T.border}`, borderRadius:"1.25rem", padding:"1.25rem" };

  return (
    <div style={rootStyle}>
      {/* ── Navbar ── */}
      <nav style={{ background:T.card, borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, zIndex:40 }}>
        <div style={{ maxWidth:"720px", margin:"0 auto", padding:"0.75rem 1.25rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:"0.5rem", textDecoration:"none" }}>
            <div style={{ width:32, height:32, borderRadius:10, background:`linear-gradient(135deg,${T.accent},${T.accent}cc)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Heart size={16} fill="white" color="white"/>
            </div>
            <span style={{ fontFamily:"Poppins", fontWeight:800, fontSize:SZ.title*0.8, color:T.text }}>
              Psico<span style={{ color:T.accent2 }}>Luz</span>
            </span>
          </a>
          <button onClick={() => setConf(p=>!p)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:10, border:`1px solid ${T.border}`, background:"transparent", cursor:"pointer", color:T.textSub, fontSize:13, fontWeight:600 }}>
            <Settings size={15}/> Accesibilidad
          </button>
        </div>
      </nav>

      {/* ── Panel accesibilidad ── */}
      <AnimatePresence>
        {configOpen && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            style={{ position:"fixed", top:56, right:16, zIndex:50, width:300, ...cardStyle, boxShadow:"0 8px 32px rgba(0,0,0,0.12)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
              <span style={{ fontFamily:"Poppins", fontWeight:700, color:T.text }}>Personalización</span>
              <button onClick={() => setConf(false)} style={{ background:"transparent", border:"none", cursor:"pointer", color:T.textSub }}><X size={16}/></button>
            </div>

            <ConfigSection title="Tema de colores" theme={T}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.4rem" }}>
                {Object.entries(TEMAS).map(([k,v]) => (
                  <button key={k} onClick={() => setTema(k)}
                    style={{ padding:"6px 8px", borderRadius:8, border:`2px solid ${tema===k?T.accent:T.border}`, background:v.bg, cursor:"pointer", fontSize:11, fontWeight:600, color:v.text, display:"flex", alignItems:"center", gap:4 }}>
                    {v.emoji} {v.label}
                  </button>
                ))}
              </div>
            </ConfigSection>

            <ConfigSection title="Tamaño de texto" theme={T}>
              <div style={{ display:"flex", gap:"0.4rem" }}>
                {Object.entries(TAMANIOS).map(([k,v]) => (
                  <button key={k} onClick={() => setTamano(k)}
                    style={{ flex:1, padding:"5px 0", borderRadius:8, border:`2px solid ${tamano===k?T.accent:T.border}`, background:tamano===k?T.accentBg:"transparent", cursor:"pointer", fontSize:12, fontWeight:700, color:tamano===k?T.accent:T.textSub }}>
                    {v.label}
                  </button>
                ))}
              </div>
            </ConfigSection>

            <ConfigSection title="Espaciado" theme={T}>
              <div style={{ display:"flex", gap:"0.4rem" }}>
                {Object.entries(ESPACIADOS).map(([k,v]) => (
                  <button key={k} onClick={() => setEspaciado(k)}
                    style={{ flex:1, padding:"5px 0", borderRadius:8, border:`2px solid ${espaciado===k?T.accent:T.border}`, background:espaciado===k?T.accentBg:"transparent", cursor:"pointer", fontSize:12, fontWeight:700, color:espaciado===k?T.accent:T.textSub }}>
                    {v.label}
                  </button>
                ))}
              </div>
            </ConfigSection>

            <ConfigSection title="Animaciones" theme={T}>
              <button onClick={() => setAnim(p=>!p)}
                style={{ padding:"6px 14px", borderRadius:8, border:`2px solid ${T.border}`, background:animaciones?T.accentBg:"transparent", cursor:"pointer", fontSize:12, fontWeight:700, color:animaciones?T.accent:T.textSub }}>
                {animaciones ? "✨ Activas" : "⛔ Desactivadas"}
              </button>
            </ConfigSection>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Contenido principal ── */}
      <div style={{ maxWidth:"720px", margin:"0 auto", padding:"2rem 1.25rem" }}>

        {!datos ? (
          /* ── Pantalla de búsqueda ── */
          <motion.div {...MV} style={{ textAlign:"center" }}>
            <div style={{ width:72, height:72, borderRadius:20, background:`linear-gradient(135deg,${T.accent},${T.accent}cc)`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1.5rem" }}>
              <BookOpen size={32} color="white"/>
            </div>
            <h1 style={{ fontFamily:"Poppins", fontWeight:800, fontSize:SZ.title, color:T.text, marginBottom:"0.5rem" }}>
              Tu portal de seguimiento
            </h1>
            <p style={{ color:T.textSub, fontSize:SZ.base, marginBottom:"2rem", maxWidth:400, margin:"0 auto 2rem" }}>
              Ingresa tu número de expediente para ver tus tareas, citas y el seguimiento de tu proceso terapéutico.
            </p>
            <div style={{ ...cardStyle, maxWidth:420, margin:"0 auto", display:"flex", flexDirection:"column", gap:"1rem" }}>
              <div style={{ display:"flex", gap:"0.75rem" }}>
                <input
                  value={numero}
                  onChange={e => setNumero(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && buscar()}
                  placeholder="Ej: EXP-2024-000123"
                  style={{ flex:1, padding:"14px 16px", borderRadius:12, border:`2px solid ${error?`#ef4444`:T.border}`, background:T.bg, color:T.text, fontSize:SZ.base, fontFamily:T.font, outline:"none" }}
                  autoFocus
                />
              </div>
              {error && <p style={{ color:"#ef4444", fontSize:13, fontWeight:600, margin:0 }}>⚠️ {error}</p>}
              <motion.button onClick={buscar} disabled={buscando} whileHover={animaciones?{scale:1.02}:{}} whileTap={animaciones?{scale:0.97}:{}}
                style={{ padding:"14px", borderRadius:12, background:`linear-gradient(135deg,${T.accent},${T.accent}cc)`, color:"white", fontFamily:"Poppins", fontWeight:700, fontSize:SZ.base, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:buscando?0.7:1 }}>
                {buscando ? "Buscando..." : <><Search size={18}/> Ver mi expediente</>}
              </motion.button>
              <p style={{ color:T.textSub, fontSize:12, textAlign:"center", margin:0 }}>
                Tu número de expediente te lo proporciona tu psicóloga. Formato: EXP-YYYY-XXXXXX
              </p>
            </div>
          </motion.div>

        ) : (
          /* ── Portal del paciente ── */
          <motion.div {...MV} style={{ display:"flex", flexDirection:"column", gap:SP.gap }}>

            {/* Bienvenida */}
            <div style={{ ...cardStyle, background:`linear-gradient(135deg,${T.accent}18,${T.accent2}10)`, borderColor:T.accent+"33" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.75rem" }}>
                <div>
                  <p style={{ fontSize:13, color:T.accent, fontWeight:700, margin:"0 0 4px" }}>¡Hola!</p>
                  <h2 style={{ fontFamily:"Poppins", fontWeight:800, fontSize:SZ.title, color:T.text, margin:"0 0 4px" }}>
                    {datos.paciente?.nombres} {datos.paciente?.apellidos}
                  </h2>
                  <p style={{ color:T.textSub, fontSize:13, margin:0 }}>
                    Expediente {datos.expediente.numero_expediente} · {datos.expediente.estado} · {edad(datos.paciente?.fecha_nacimiento)} años
                  </p>
                </div>
                <button onClick={() => { setDatos(null); setNumero(""); }} style={{ padding:"6px 14px", borderRadius:10, border:`1px solid ${T.border}`, background:"transparent", cursor:"pointer", fontSize:12, fontWeight:600, color:T.textSub }}>
                  Salir
                </button>
              </div>
            </div>

            {/* Barra de progreso de tareas */}
            {total > 0 && (
              <motion.div {...MV} style={cardStyle}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
                  <span style={{ fontWeight:700, color:T.text }}>Mi progreso</span>
                  <span style={{ fontFamily:"Poppins", fontWeight:800, color:T.accent, fontSize:SZ.base*1.1 }}>{progreso}%</span>
                </div>
                <div style={{ height:12, borderRadius:99, background:T.border, overflow:"hidden" }}>
                  <motion.div
                    initial={{ width:0 }} animate={{ width:`${progreso}%` }} transition={{ duration:0.8, ease:"easeOut" }}
                    style={{ height:"100%", borderRadius:99, background:`linear-gradient(90deg,${T.accent},${T.accent2})` }}/>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:"0.5rem", fontSize:12, color:T.textSub }}>
                  <span>{completadas} de {total} tareas completadas</span>
                  {progreso === 100 && <span style={{ color:"#16a34a", fontWeight:700 }}>¡Todo listo! 🎉</span>}
                </div>
              </motion.div>
            )}

            {/* Botón motivacional */}
            <AnimatePresence>
              {motivando && (
                <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
                  style={{ ...cardStyle, textAlign:"center", background:`linear-gradient(135deg,${T.accent2}18,${T.accent}10)`, borderColor:T.accent2+"44" }}>
                  <p style={{ fontFamily:"Poppins", fontWeight:700, fontSize:SZ.base*1.1, color:T.text, margin:0 }}>{frase}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs */}
            <div style={{ display:"flex", gap:"0.25rem", background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:4 }}>
              {[
                { key:"tareas",  label:"Mis tareas",  emoji:"✅", count: datos.tareas.filter(t=>t.estado!=="completada").length },
                { key:"citas",   label:"Mis citas",   emoji:"📅", count: datos.citas.length },
                { key:"notas",   label:"Mis notas",   emoji:"📝", count: datos.notas.length },
              ].map(({ key, label, emoji, count }) => (
                <button key={key} onClick={() => setTab(key)}
                  style={{ flex:1, padding:"10px 4px", borderRadius:10, border:"none", cursor:"pointer", fontWeight:700, fontSize:Math.max(11, SZ.base*0.78), fontFamily:T.font, transition:"all 0.2s",
                    background: tab===key ? T.accent : "transparent",
                    color: tab===key ? "white" : T.textSub,
                  }}>
                  {emoji} {label}
                  {count > 0 && <span style={{ marginLeft:4, background:tab===key?"rgba(255,255,255,0.3)":T.accentBg, color:tab===key?"white":T.accent, borderRadius:99, padding:"1px 6px", fontSize:10, fontWeight:800 }}>{count}</span>}
                </button>
              ))}
            </div>

            {/* ── Tab Tareas ── */}
            <AnimatePresence mode="wait">
              {tab === "tareas" && (
                <motion.div key="tareas" {...MV} style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                  {datos.tareas.length === 0
                    ? <EmptyState emoji="✅" msg="No tienes tareas asignadas aún." T={T}/>
                    : datos.tareas.map((t, i) => {
                      const est  = ESTADO_TAREA[t.estado] ?? ESTADO_TAREA.pendiente;
                      const done = t.estado === "completada";
                      const vencida = t.estado === "vencida";
                      return (
                        <motion.div key={t.id} initial={animaciones?{opacity:0,y:8}:{}} animate={animaciones?{opacity:1,y:0}:{}} transition={{ delay:i*0.05 }}>
                          <div style={{ ...cardStyle, borderLeft:`4px solid ${done?"#16a34a":vencida?"#ef4444":PRIOCOLOR_HEX[t.prioridad]??T.accent}`, opacity:done?0.75:1 }}>
                            <div style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem" }}>
                              {/* Checkbox */}
                              <button onClick={() => completarTarea(t)}
                                style={{ marginTop:2, background:"transparent", border:"none", cursor:"pointer", color:done?"#16a34a":T.border, flexShrink:0, padding:0 }}
                                aria-label={done?"Marcar incompleta":"Marcar completa"}>
                                {done ? <CheckSquare size={22} style={{ color:"#16a34a" }}/> : <Square size={22} style={{ color:T.accent }}/>}
                              </button>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap" }}>
                                  <span style={{ fontWeight:700, color:T.text, textDecoration:done?"line-through":"none", fontSize:SZ.base }}>{t.titulo}</span>
                                  <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:done?"#f0fdf4":vencida?"#fef2f2":T.accentBg, color:done?"#16a34a":vencida?"#ef4444":T.accent }}>{est.emoji} {est.label}</span>
                                </div>
                                <p style={{ color:T.textSub, fontSize:SZ.base*0.85, margin:"0.35rem 0 0", lineHeight:SP.lineH }}>{t.descripcion}</p>
                                {t.instrucciones && (
                                  <details style={{ marginTop:"0.5rem" }}>
                                    <summary style={{ cursor:"pointer", fontSize:12, fontWeight:600, color:T.accent }}>Ver instrucciones</summary>
                                    <p style={{ color:T.text, fontSize:SZ.base*0.85, marginTop:"0.35rem", lineHeight:SP.lineH, whiteSpace:"pre-wrap" }}>{t.instrucciones}</p>
                                  </details>
                                )}
                                <div style={{ display:"flex", gap:"0.75rem", marginTop:"0.5rem", flexWrap:"wrap" }}>
                                  <span style={{ fontSize:11, color:T.textSub, display:"flex", alignItems:"center", gap:3 }}>
                                    <Clock size={11}/> Vence {new Date(t.fecha_limite).toLocaleDateString("es-NI",{day:"numeric",month:"long"})}
                                  </span>
                                  <span style={{ fontSize:11, fontWeight:700, color:PRIOCOLOR_HEX[t.prioridad]??T.accent }}>
                                    {PRIORIDAD_LABEL[t.prioridad]}
                                  </span>
                                  {t.fecha_completada && done && (
                                    <span style={{ fontSize:11, color:"#16a34a", fontWeight:600 }}>
                                      ✓ Completada {new Date(t.fecha_completada).toLocaleDateString("es-NI")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  }
                  {/* Botón motivacional */}
                  <button onClick={motivar}
                    style={{ padding:"12px", borderRadius:12, border:`2px dashed ${T.accent}44`, background:"transparent", cursor:"pointer", color:T.accent, fontWeight:700, fontSize:SZ.base*0.9, fontFamily:T.font, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <Smile size={16}/> ¿Necesitas motivación? ¡Tócame!
                  </button>
                </motion.div>
              )}

              {/* ── Tab Citas ── */}
              {tab === "citas" && (
                <motion.div key="citas" {...MV} style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                  {datos.citas.length === 0
                    ? <EmptyState emoji="📅" msg="No tienes citas próximas programadas." T={T}/>
                    : datos.citas.map((c, i) => (
                      <motion.div key={c.id} initial={animaciones?{opacity:0,y:8}:{}} animate={animaciones?{opacity:1,y:0}:{}} transition={{ delay:i*0.06 }}
                        style={{ ...cardStyle }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                          <div style={{ width:46, height:46, borderRadius:12, background:T.accentBg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <span style={{ fontSize:11, fontWeight:700, color:T.accent }}>{new Date(c.fecha_inicio).toLocaleDateString("es-NI",{month:"short"}).toUpperCase()}</span>
                            <span style={{ fontFamily:"Poppins", fontWeight:800, fontSize:18, color:T.accent, lineHeight:1 }}>{new Date(c.fecha_inicio).getDate()}</span>
                          </div>
                          <div style={{ flex:1 }}>
                            <p style={{ fontWeight:700, color:T.text, margin:"0 0 2px", fontSize:SZ.base }}>
                              {new Date(c.fecha_inicio).toLocaleString("es-NI",{weekday:"long",hour:"2-digit",minute:"2-digit"})}
                              {" — "}
                              {new Date(c.fecha_fin).toLocaleTimeString("es-NI",{hour:"2-digit",minute:"2-digit"})}
                            </p>
                            <p style={{ color:T.textSub, fontSize:13, margin:0, textTransform:"capitalize" }}>
                              {c.modalidad === "virtual" ? "📹 Sesión virtual" : "🏢 Sesión presencial"} · {c.estado}
                            </p>
                          </div>
                        </div>
                        {c.link_virtual && (
                          <a href={c.link_virtual} target="_blank" rel="noopener noreferrer"
                            style={{ display:"flex", alignItems:"center", gap:6, marginTop:"0.75rem", padding:"10px 14px", borderRadius:10, background:T.accentBg, color:T.accent, fontWeight:700, fontSize:13, textDecoration:"none" }}>
                            📹 Unirse a la videollamada
                          </a>
                        )}
                      </motion.div>
                    ))
                  }
                </motion.div>
              )}

              {/* ── Tab Notas compartidas ── */}
              {tab === "notas" && (
                <motion.div key="notas" {...MV} style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                  <div style={{ ...cardStyle, background:T.accentBg, borderColor:T.accent+"33" }}>
                    <p style={{ margin:0, fontSize:13, color:T.accent, fontWeight:600 }}>
                      📝 Estas notas fueron compartidas contigo por tu psicóloga para que puedas leer el resumen de tus sesiones.
                    </p>
                  </div>
                  {datos.notas.length === 0
                    ? <EmptyState emoji="📝" msg="Aún no hay notas compartidas contigo." T={T}/>
                    : datos.notas.map((n, i) => (
                      <motion.div key={n.id} initial={animaciones?{opacity:0,y:8}:{}} animate={animaciones?{opacity:1,y:0}:{}} transition={{ delay:i*0.06 }}
                        style={cardStyle}>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.75rem" }}>
                          <div style={{ width:36, height:36, borderRadius:10, background:T.accentBg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Poppins", fontWeight:800, color:T.accent, flexShrink:0 }}>
                            {n.sesion_numero}
                          </div>
                          <div>
                            <p style={{ fontWeight:700, color:T.text, margin:0 }}>Sesión #{n.sesion_numero}</p>
                            <p style={{ color:T.textSub, fontSize:12, margin:0 }}>
                              {new Date(n.fecha_sesion).toLocaleDateString("es-NI",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                            </p>
                          </div>
                        </div>
                        {n.resumen_sesion && (
                          <div style={{ marginBottom:"0.5rem" }}>
                            <p style={{ fontSize:11, fontWeight:700, color:T.textSub, margin:"0 0 4px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Resumen</p>
                            <p style={{ color:T.text, fontSize:SZ.base*0.9, margin:0, lineHeight:SP.lineH }}>{n.resumen_sesion}</p>
                          </div>
                        )}
                        {n.tareas_asignadas && (
                          <div style={{ padding:"0.6rem 0.75rem", borderRadius:10, background:T.accentBg, marginTop:"0.5rem" }}>
                            <p style={{ fontSize:11, fontWeight:700, color:T.accent, margin:"0 0 4px" }}>📋 Tareas de esta sesión</p>
                            <p style={{ color:T.text, fontSize:SZ.base*0.85, margin:0, lineHeight:SP.lineH }}>{n.tareas_asignadas}</p>
                          </div>
                        )}
                      </motion.div>
                    ))
                  }
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div style={{ textAlign:"center", paddingTop:"1rem", color:T.textSub, fontSize:12 }}>
              <p style={{ margin:0 }}>PsicoLuz · Centro Psicopedagógico · Managua, Nicaragua</p>
              <p style={{ margin:"4px 0 0" }}>📞 +505 8657-7616</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────
const PRIOCOLOR_HEX = { urgente:"#ef4444", alta:"#f97316", media:"#F7931E", baja:"#16a34a" };

function ConfigSection({ title, theme:T, children }) {
  return (
    <div style={{ marginBottom:"1rem" }}>
      <p style={{ fontSize:11, fontWeight:700, color:T.textSub, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 0.5rem" }}>{title}</p>
      {children}
    </div>
  );
}

function EmptyState({ emoji, msg, T }) {
  return (
    <div style={{ textAlign:"center", padding:"3rem 1rem", color:T.textSub }}>
      <div style={{ fontSize:40, marginBottom:"0.75rem" }}>{emoji}</div>
      <p style={{ fontWeight:600, margin:0 }}>{msg}</p>
    </div>
  );
}