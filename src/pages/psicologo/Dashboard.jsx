// src/pages/psicologo/Dashboard.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";
import {
  Users, Calendar, ClipboardList, Bell, ChevronRight,
  Clock, CheckCircle, XCircle, AlertCircle, LogOut, Heart,
  BookOpenCheck
} from "lucide-react";

const T = { teal: "#00AFC1", orange: "#F7931E", dark: "#222222", gray: "#6b7280" };
const fade = (i) => ({ initial:{opacity:0,y:16}, animate:{opacity:1,y:0}, transition:{delay:i*0.07,duration:0.4} });

// ── Shared Layout ─────────────────────────────────────────────────────────────
export function Layout({ children, current }) {
  const [perfil, setPerfil] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("perfil").select("*").eq("id", data.user.id).single();
      setPerfil(p);
    });
  }, []);

  const nav = [
    { label: "Dashboard",  href: "/psicologo",          icon: ClipboardList },
    { label: "Pacientes",  href: "/psicologo/pacientes", icon: Users },
    { label: "Citas",      href: "/psicologo/citas",     icon: Calendar },
    { label: "Expedientes", href: "/psicologo/expedientes", icon: BookOpenCheck },
  ];

  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/login"; };

  return (
    <div className="flex min-h-screen" style={{ fontFamily:"Nunito", background:"#f8fffe" }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-teal-50 bg-white" style={{ minHeight:"100vh" }}>
        <div className="flex items-center gap-2 px-6 py-5 border-b border-teal-50">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:`linear-gradient(135deg,${T.teal},#008C99)` }}>
            <Heart size={15} fill="white" color="white"/>
          </div>
          <span className="font-black text-lg" style={{ fontFamily:"Poppins", color:T.dark }}>
            Psico<span style={{ color:T.orange }}>Luz</span>
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ label, href, icon: Icon }) => {
            const active = window.location.pathname === href;
            return (
              <a key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: active ? `linear-gradient(135deg,${T.teal}15,${T.teal}08)` : "transparent",
                  color: active ? T.teal : T.gray,
                  borderLeft: active ? `3px solid ${T.teal}` : "3px solid transparent",
                }}>
                <Icon size={17}/> {label}
              </a>
            );
          })}
        </nav>
        {perfil && (
          <div className="p-4 border-t border-teal-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background:`linear-gradient(135deg,${T.teal},#008C99)` }}>
                {perfil.nombres?.[0]}{perfil.apellidos?.[0]}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-bold truncate" style={{ color:T.dark }}>{perfil.nombres} {perfil.apellidos}</div>
                <div className="text-xs" style={{ color:T.teal }}>{perfil.rol}</div>
              </div>
            </div>
            <button onClick={logout} className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 transition-colors w-full">
              <LogOut size={13}/> Cerrar sesión
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats]   = useState({ pacientes:0, citasHoy:0, pendientes:0, completadas:0 });
  const [citas, setCitas]   = useState([]);
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Obtener psicologo_id
    const { data: psi } = await supabase.from("psicologo").select("id").eq("perfil_id", user.id).single();
    if (!psi) return;
    const pid = psi.id;

    // Estadísticas en paralelo
    const hoy = new Date().toISOString().split("T")[0];
    const [pac, citHoy, citPend, citComp, tareasPend] = await Promise.all([
      supabase.from("paciente").select("id", { count:"exact", head:true }).eq("psicologo_id", pid),
      supabase.from("cita").select("id", { count:"exact", head:true }).eq("psicologo_id", pid).gte("fecha_inicio", hoy+"T00:00:00").lte("fecha_inicio", hoy+"T23:59:59"),
      supabase.from("cita").select("id", { count:"exact", head:true }).eq("psicologo_id", pid).eq("estado","programada"),
      supabase.from("cita").select("id", { count:"exact", head:true }).eq("psicologo_id", pid).eq("estado","completada"),
      supabase.from("tarea").select("id", { count:"exact", head:true }).eq("asignada_por", pid).eq("estado","pendiente"),
    ]);

    setStats({
      pacientes:  pac.count ?? 0,
      citasHoy:   citHoy.count ?? 0,
      pendientes: citPend.count ?? 0,
      completadas: citComp.count ?? 0,
    });

    // Próximas citas
    const { data: proxCitas } = await supabase
      .from("cita")
      .select("id, fecha_inicio, fecha_fin, estado, modalidad, motivo_consulta, paciente(nombres, apellidos)")
      .eq("psicologo_id", pid)
      .gte("fecha_inicio", new Date().toISOString())
      .in("estado", ["programada","confirmada"])
      .order("fecha_inicio", { ascending: true })
      .limit(5);
    setCitas(proxCitas ?? []);

    // Tareas pendientes recientes
    const { data: t } = await supabase
      .from("tarea")
      .select("id, titulo, fecha_limite, prioridad, estado, expediente(paciente(nombres, apellidos))")
      .eq("asignada_por", pid)
      .in("estado", ["pendiente","en_progreso"])
      .order("fecha_limite", { ascending: true })
      .limit(5);
    setTareas(t ?? []);

    setLoading(false);
  };

  const STAT_CARDS = [
    { label:"Mis pacientes",    value: stats.pacientes,  icon: Users,         color: T.teal   },
    { label:"Citas hoy",        value: stats.citasHoy,   icon: Calendar,      color: T.orange },
    { label:"Citas programadas",value: stats.pendientes, icon: Clock,         color: "#8b5cf6" },
    { label:"Completadas",      value: stats.completadas,icon: CheckCircle,   color: "#10b981" },
  ];

  const estadoIcon = { programada: <Clock size={14} color={T.orange}/>, confirmada: <CheckCircle size={14} color="#10b981"/>, completada: <CheckCircle size={14} color={T.teal}/>, cancelada: <XCircle size={14} color="#ef4444"/> };
  const prioColor  = { urgente:"#ef4444", alta:"#f97316", media:T.orange, baja:"#10b981" };

  if (loading) return <Layout current="dashboard"><LoadingScreen /></Layout>;

  return (
    <Layout current="dashboard">
      <motion.div {...fade(0)}>
        <h1 className="text-2xl font-black mb-1" style={{ fontFamily:"Poppins", color:T.dark }}>Dashboard</h1>
        <p className="text-sm mb-7" style={{ color:T.gray }}>
          {new Date().toLocaleDateString("es-NI",{ weekday:"long", year:"numeric", month:"long", day:"numeric" })}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} {...fade(i+1)} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:`${s.color}15` }}>
                  <Icon size={18} style={{ color:s.color }}/>
                </div>
              </div>
              <div className="text-3xl font-black mb-0.5" style={{ fontFamily:"Poppins", color:T.dark }}>{s.value}</div>
              <div className="text-xs font-semibold" style={{ color:T.gray }}>{s.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Próximas citas */}
        <motion.div {...fade(5)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-black text-base" style={{ fontFamily:"Poppins", color:T.dark }}>Próximas citas</h2>
            <a href="/psicologo/citas" className="text-xs font-bold flex items-center gap-1" style={{ color:T.teal }}>
              Ver todas <ChevronRight size={13}/>
            </a>
          </div>
          {citas.length === 0
            ? <Empty msg="No hay citas próximas" />
            : citas.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-teal-50/30 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:`${T.teal}12` }}>
                  <Calendar size={17} style={{ color:T.teal }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color:T.dark }}>
                    {c.paciente?.nombres} {c.paciente?.apellidos}
                  </div>
                  <div className="text-xs" style={{ color:T.gray }}>
                    {new Date(c.fecha_inicio).toLocaleString("es-NI",{weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold">
                  {estadoIcon[c.estado]} <span style={{ color:T.gray }}>{c.modalidad}</span>
                </div>
              </div>
            ))
          }
        </motion.div>

        {/* Tareas pendientes */}
        <motion.div {...fade(6)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-black text-base" style={{ fontFamily:"Poppins", color:T.dark }}>Tareas pendientes</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${T.orange}15`, color:T.orange }}>{tareas.length}</span>
          </div>
          {tareas.length === 0
            ? <Empty msg="Sin tareas pendientes" />
            : tareas.map(t => (
              <div key={t.id} className="flex items-start gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-orange-50/30 transition-colors">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: prioColor[t.prioridad] }}/>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color:T.dark }}>{t.titulo}</div>
                  <div className="text-xs" style={{ color:T.gray }}>
                    {t.expediente?.paciente?.nombres} · Vence {new Date(t.fecha_limite).toLocaleDateString("es-NI")}
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background:`${prioColor[t.prioridad]}15`, color: prioColor[t.prioridad] }}>
                  {t.prioridad}
                </span>
              </div>
            ))
          }
        </motion.div>
      </div>
    </Layout>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor:`${T.teal}40`, borderTopColor:T.teal }}/>
    </div>
  );
}

function Empty({ msg }) {
  return <div className="py-10 text-center text-sm" style={{ color:T.gray }}>{msg}</div>;
}