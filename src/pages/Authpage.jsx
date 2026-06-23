// ============================================================
// src/pages/AuthPage.jsx
// Uso: <AuthPage mode="login" /> o <AuthPage mode="register" />
// ============================================================
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Heart, ArrowRight, User, Lock, Mail, Phone } from "lucide-react";

const T = { teal: "#00AFC1", orange: "#F7931E", dark: "#222222" };

// ── Inyectar Google Fonts ──────────────────────────────────
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Nunito:wght@400;500;600&family=Great+Vibes&display=swap";
document.head.appendChild(link);

export default function AuthPage({ mode = "login" }) {
  const [isLogin, setIsLogin]     = useState(mode === "login");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const [form, setForm] = useState({
    nombres: "", apellidos: "", email: "", telefono: "", password: "", confirm: ""
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // ── Validaciones ──────────────────────────────────────────
  const validate = () => {
    if (!form.email || !form.password) return "Completa todos los campos obligatorios.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Email inválido.";
    if (form.password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (!isLogin) {
      if (!form.nombres.trim() || !form.apellidos.trim()) return "Ingresa tu nombre completo.";
      if (form.password !== form.confirm) return "Las contraseñas no coinciden.";
    }
    return null;
  };

  // ── Login ─────────────────────────────────────────────────
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });
    if (error) throw error;
    // Redirigir según rol
    const { data: perfil } = await supabase
      .from("perfil").select("rol").eq("id", (await supabase.auth.getUser()).data.user.id).single();
    const destino = {
      administrador: "/admin",
      psicologo:     "/psicologo",
      recepcion:     "/recepcion",
      paciente:      "/paciente",
      tutor:         "/paciente",
    }[perfil?.rol] ?? "/";
    window.location.href = destino;
  };

  // ── Register ──────────────────────────────────────────────
  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        data: {                        // ← va a raw_user_meta_data → trigger lo lee
          nombres:   form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          telefono:  form.telefono.trim(),
        }
      }
    });
    if (error) throw error;
    setSuccess("¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.");
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(""); setSuccess("");
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      isLogin ? await handleLogin() : await handleRegister();
    } catch (e) {
      const msgs = {
        "Invalid login credentials":   "Email o contraseña incorrectos.",
        "Email not confirmed":          "Confirma tu correo antes de ingresar.",
        "User already registered":      "Este email ya está registrado.",
        "Password should be at least 6 characters": "La contraseña debe tener al menos 8 caracteres.",
      };
      setError(msgs[e.message] ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Nunito" }}>
      {/* Panel izquierdo — decorativo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-center items-center p-16"
        style={{ background: `linear-gradient(135deg, #008C99 0%, #00AFC1 60%, #00c9d4 100%)` }}>
        {/* Blobs */}
        {[0,1,2].map(i => (
          <motion.div key={i} className="absolute rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: i%2===0 ? T.orange : "white", width: `${200+i*100}px`, height: `${200+i*100}px`, left:`${i*25}%`, top:`${i*20}%` }}
            animate={{ x:[0,30,-20,0], y:[0,-20,15,0] }}
            transition={{ duration: 7+i*2, repeat: Infinity, ease:"easeInOut" }} />
        ))}
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} className="relative z-10 text-center">
          <a href="/" className="flex items-center justify-center gap-3 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-xl">
              <Heart size={28} fill="white" color="white" />
            </div>
            <span className="text-4xl font-black text-white" style={{ fontFamily:"Poppins" }}>
              Psico<span style={{ color: T.orange }}>Luz</span>
            </span>
          </a>
          <h2 className="text-3xl font-black text-white mb-4 leading-tight" style={{ fontFamily:"Poppins" }}>
            Un lugar donde<br />tu hijo{" "}
            <span style={{ fontFamily:"Great Vibes", color:T.orange, fontSize:"1.2em", fontWeight:400 }}>se siente seguro</span>
          </h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-sm mx-auto" style={{ fontFamily:"Nunito" }}>
            Accede a tu portal para gestionar citas, tareas terapéuticas y el progreso de tu hijo.
          </p>
          {/* Badges de confianza */}
          <div className="flex gap-4 justify-center mt-10 flex-wrap">
            {["70+ Familias","12+ Años!!!","98% Satisfacción"].map(b => (
              <div key={b} className="px-4 py-2 rounded-full bg-white/15 backdrop-blur text-white text-sm font-semibold">{b}</div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white">
        <motion.div initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5 }}
          className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:`linear-gradient(135deg,${T.teal},#008C99)` }}>
              <Heart size={20} fill="white" color="white" />
            </div>
            <span className="text-2xl font-black" style={{ fontFamily:"Poppins", color:T.dark }}>
              Psico<span style={{ color:T.orange }}>Luz</span>
            </span>
          </div>

          {/* Toggle login / register */}
          <div className="flex rounded-2xl p-1 mb-8" style={{ background:"#f0fdfe" }}>
            {["Iniciar sesión","Registrarse"].map((label, i) => (
              <button key={label} onClick={() => { setIsLogin(i===0); setError(""); setSuccess(""); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300"
                style={{
                  background:  (i===0) === isLogin ? `linear-gradient(135deg,${T.teal},#008C99)` : "transparent",
                  color:       (i===0) === isLogin ? "white" : T.teal,
                  fontFamily:  "Poppins",
                }}>
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={isLogin?"login":"register"}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
              transition={{ duration:0.25 }}>

              <h1 className="text-2xl font-black mb-1" style={{ fontFamily:"Poppins", color:T.dark }}>
                {isLogin ? "Bienvenido de vuelta" : "Crear cuenta"}
              </h1>
              <p className="text-gray-500 text-sm mb-7" style={{ fontFamily:"Nunito" }}>
                {isLogin
                  ? "Ingresa tus credenciales para acceder al portal."
                  : "Regístrate para acceder al portal de pacientes y tutores."}
              </p>

              <div className="space-y-4">
                {/* Nombre + Apellido (solo register) */}
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field icon={User} placeholder="Nombres *" value={form.nombres} onChange={set("nombres")} />
                    <Field icon={User} placeholder="Apellidos *" value={form.apellidos} onChange={set("apellidos")} />
                  </div>
                )}

                {/* Email */}
                <Field icon={Mail} type="email" placeholder="Correo electrónico *" value={form.email} onChange={set("email")} />

                {/* Teléfono (solo register) */}
                {!isLogin && (
                  <Field icon={Phone} type="tel" placeholder="Teléfono (opcional)" value={form.telefono} onChange={set("telefono")} />
                )}

                {/* Password */}
                <div className="relative">
                  <Field icon={Lock} type={showPass?"text":"password"} placeholder="Contraseña *" value={form.password} onChange={set("password")}
                    extra={
                      <button type="button" onClick={() => setShowPass(p=>!p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-500 transition-colors">
                        {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>
                    } />
                </div>

                {/* Confirmar password (solo register) */}
                {!isLogin && (
                  <Field icon={Lock} type={showPass?"text":"password"} placeholder="Confirmar contraseña *" value={form.confirm} onChange={set("confirm")} />
                )}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    className="mt-4 p-3 rounded-xl text-sm font-medium border"
                    style={{ background:"#fff5f5", borderColor:"#fca5a5", color:"#dc2626", fontFamily:"Nunito" }}>
                    ⚠️ {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    className="mt-4 p-3 rounded-xl text-sm font-medium border"
                    style={{ background:"#f0fdfe", borderColor:T.teal, color:T.teal, fontFamily:"Nunito" }}>
                    ✅ {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Forgot password */}
              {isLogin && (
                <div className="flex justify-end mt-3">
                  <button className="text-sm hover:underline" style={{ color:T.teal, fontFamily:"Nunito" }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              {/* Submit */}
              <motion.button onClick={handleSubmit} disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02, boxShadow: `0 0 25px ${T.orange}60` }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full mt-6 py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-opacity"
                style={{ background:`linear-gradient(135deg,${T.orange},#e07810)`, fontFamily:"Poppins", opacity: loading ? 0.7 : 1 }}>
                {loading
                  ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  : <>{isLogin ? "Entrar al portal" : "Crear mi cuenta"} <ArrowRight size={18}/></>
                }
              </motion.button>

              {/* Aviso para pacientes */}
              {!isLogin && (
                <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed" style={{ fontFamily:"Nunito" }}>
                  Al registrarte, tu cuenta tendrá acceso de <strong>paciente/tutor</strong>.<br/>
                  Los profesionales son registrados directamente por el equipo de PsicoLuz.
                </p>
              )}

              <p className="text-center text-sm text-gray-500 mt-6" style={{ fontFamily:"Nunito" }}>
                {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                <button onClick={() => { setIsLogin(p=>!p); setError(""); setSuccess(""); }}
                  className="font-bold hover:underline" style={{ color:T.teal }}>
                  {isLogin ? "Regístrate gratis" : "Inicia sesión"}
                </button>
              </p>

              <div className="flex items-center gap-3 mt-4">
                <a href="/" className="text-xs text-center w-full hover:underline" style={{ color:"#9ca3af", fontFamily:"Nunito" }}>
                  ← Volver al sitio principal
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// ── Campo reutilizable ─────────────────────────────────────
function Field({ icon: Icon, type="text", placeholder, value, onChange, extra }) {
  return (
    <div className="relative">
      <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm outline-none transition-all duration-200
                   focus:border-teal-400 focus:ring-2 focus:ring-teal-100 bg-gray-50 hover:bg-white"
        style={{ fontFamily:"Nunito", borderColor:"#e5e7eb", color:"#222" }}
        autoComplete="off"
      />
      {extra}
    </div>
  );
}