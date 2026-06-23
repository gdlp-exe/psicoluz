// src/App.jsx — Enrutamiento completo
// Instalar: npm install @supabase/supabase-js framer-motion lucide-react
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

// Pages
import PsicoLuz  from "./components/PsicoLuz";
import AuthPage  from "./pages/AuthPage";
import Dashboard from "./pages/psicologo/Dashboard";
import Citas     from "./pages/psicologo/Citas";
import Pacientes from "./pages/psicologo/Pacientes";
import Expedientes from "./pages/psicologo/Expedientes";

// Guard: redirige si no hay sesión
function useAuth() {
  const [user, setUser]   = useState(undefined);   // undefined = cargando
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from("perfil").select("rol").eq("id", session.user.id).single();
        setPerfil(data);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, perfil, loading: user === undefined };
}

export default function App() {
  const { user, perfil, loading } = useAuth();
  const path = window.location.pathname;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:"#f8fffe" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor:"#00AFC120", borderTopColor:"#00AFC1" }}/>
    </div>
  );

  // Rutas públicas
  if (path === "/" || path === "")          return <PsicoLuz />;
  if (path.startsWith("/login"))            return <AuthPage mode="login" />;
  if (path.startsWith("/register"))         return <AuthPage mode="register" />;

  // Rutas protegidas — redirigir si no hay sesión
  if (!user) { window.location.href = "/login"; return null; }

  // Rutas del psicólogo
  if (path === "/psicologo")                return <Dashboard />;
  if (path === "/psicologo/citas")          return <Citas />;
  if (path === "/psicologo/pacientes")      return <Pacientes />;
  if (path === "/psicologo/expedientes")    return <Expedientes />;

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <p className="text-2xl font-black" style={{ fontFamily:"Poppins" }}>404 — Página no encontrada</p>
      <a href="/" className="text-sm underline" style={{ color:"#00AFC1" }}>Volver al inicio</a>
    </div>
  );
}

/* ================================================================
   ESTRUCTURA DE CARPETAS FINAL
   ================================================================
   src/
   ├── lib/
   │   └── supabase.js
   ├── components/
   │   └── PsicoLuz.jsx           (landing page)
   ├── pages/
   │   ├── AuthPage.jsx           (login + register)
   │   └── psicologo/
   │       ├── Dashboard.jsx      (stats + próximas citas + tareas)
   │       ├── Citas.jsx          (agenda semana/lista + nueva cita)
   │       └── Pacientes.jsx      (lista + detalle + expediente + crear)
   ├── App.jsx
   ├── main.jsx
   └── index.css

   RUTAS:
   /                    → Landing PsicoLuz
   /login               → Login
   /register            → Registro (paciente/tutor)
   /psicologo           → Dashboard
   /psicologo/citas     → Gestión de citas
   /psicologo/pacientes → Gestión de pacientes

   QUERY PARA ASIGNAR ROL DE PSICÓLOGA (ejecutar en Supabase SQL Editor):
   -----------------------------------------------------------------------
   -- Paso 1: registrarte desde el form web
   -- Paso 2: cambiar el rol
   UPDATE perfil SET rol = 'psicologo' WHERE email = 'tu@email.com';

   -- Paso 3: crear el registro en tabla psicologo
   INSERT INTO psicologo (perfil_id, cedula_profesional, especialidad)
   VALUES (
     (SELECT id FROM perfil WHERE email = 'tu@email.com'),
     'PSI-001',
     'Psicología Infantil'
   );
   ================================================================ */