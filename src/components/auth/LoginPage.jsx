// ============================================================
// src/pages/auth/LoginPage.jsx
// DECISIÓN TÉCNICA:
//   • El formulario NO usa <form onSubmit> nativo para no
//     depender del submit del browser (mejor control de UX).
//   • Los errores se muestran siempre con mensajes genéricos
//     (anti user-enumeration — OWASP A07).
//   • El campo de contraseña tiene toggle de visibilidad pero
//     NO autocomplete="off" (OWASP recomienda permitir password
//     managers — ASVS 2.1.11).
//   • Se previene doble submit con flag isSubmitting.
//   • Diseño: split layout igual al hero de la landing
//     (turquesa + naranja, tipografía emocional Poppins/Inter).
// ============================================================

import { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { signIn, validateEmail, validatePassword } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

// ─── Animaciones ─────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const shakeVariants = {
  shake: {
    x: [0, -10, 10, -8, 8, -4, 4, 0],
    transition: { duration: 0.5 },
  },
};

// ─── Componente ──────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { rol } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  // Validación en tiempo real (solo tras primer blur)
  const [touched, setTouched] = useState({});

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, field === 'email' ? email : password);
  };

  const validateField = (field, value) => {
    let err = null;
    if (field === 'email') err = validateEmail(value);
    if (field === 'password') err = validatePassword(value);
    setErrors((prev) => ({ ...prev, [field]: err }));
    return err;
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setGlobalError('');
    // Validar todos los campos
    const emailErr = validateField('email', email);
    const passErr = validateField('password', password);
    setTouched({ email: true, password: true });

    if (emailErr || passErr) {
      setShakeTrigger((n) => n + 1);
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await signIn({ email, password });

    if (error) {
      setGlobalError(error.message);
      setShakeTrigger((n) => n + 1);
      setIsSubmitting(false);
      return;
    }

    // Redirigir al destino guardado o al dashboard por rol
    const from = location.state?.from?.pathname;
    if (from && from !== '/login') {
      navigate(from, { replace: true });
    } else {
      // Rol ya lo tendrá el contexto tras onAuthStateChange
      // Navegar al dashboard genérico; el RoleGuard redirigirá
      navigate('/dashboard', { replace: true });
    }
  }, [email, password, isSubmitting, location, navigate]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="min-h-screen flex bg-[#F9F9F9]">
      {/* ── Panel izquierdo: decorativo ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#00AFC1] via-[#008C99] to-[#006B75]">
        {/* Blobs decorativos */}
        <motion.div
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/10"
          animate={{ scale: [1, 1.08, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#F7931E]/20"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {/* Contenido del panel */}
        <div className="relative z-10 flex flex-col justify-center px-14 text-white">
          {/* Logo */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="flex items-center gap-3 mb-12"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-xl font-black text-white">P</span>
            </div>
            <span className="text-2xl font-black tracking-tight">PsicoLuz</span>
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="text-sm font-medium text-white/60 uppercase tracking-widest mb-4"
          >
            Centro Psicopedagógico
          </motion.p>

          <motion.h2
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="text-5xl font-black leading-tight mb-6"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Un espacio de{' '}
            <span className="relative">
              <span
                className="text-[#F7931E]"
                style={{ fontFamily: '"Great Vibes", cursive' }}
              >
                esperanza
              </span>
            </span>
            {' '}y cuidado
          </motion.h2>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.3}
            className="text-white/80 text-lg leading-relaxed max-w-sm"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Cada inicio de sesión es un paso hacia el bienestar de tu hijo.
            Gracias por confiar en PsicoLuz.
          </motion.p>

          {/* Badges de confianza */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.4}
            className="mt-12 flex flex-col gap-3"
          >
            {[
              '✦ Información 100% confidencial',
              '✦ Acceso seguro con cifrado',
              '✦ Sesión protegida automáticamente',
            ].map((badge) => (
              <div
                key={badge}
                className="flex items-center gap-2 text-sm text-white/70"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {badge}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="w-full max-w-md"
        >
          {/* Header móvil (logo solo visible en mobile) */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-[#00AFC1] flex items-center justify-center">
              <span className="text-lg font-black text-white">P</span>
            </div>
            <span className="text-xl font-black text-[#222222]">PsicoLuz</span>
          </div>

          <div className="mb-8">
            <h1
              className="text-3xl font-black text-[#222222] mb-2"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Bienvenido de vuelta
            </h1>
            <p className="text-[#666] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          {/* Error global */}
          <AnimatePresence>
            {globalError && (
              <motion.div
                key="global-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {globalError}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formulario */}
          <motion.div
            key={shakeTrigger}
            variants={shakeVariants}
            animate={shakeTrigger > 0 && (globalError || errors.email || errors.password) ? 'shake' : ''}
            className="space-y-5"
          >
            {/* Campo Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-[#222222] mb-2"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaa]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) validateField('email', e.target.value);
                  }}
                  onBlur={() => handleBlur('email')}
                  onKeyDown={handleKeyDown}
                  placeholder="tu@correo.com"
                  className={`
                    w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm bg-white
                    text-[#222222] placeholder-[#bbb] outline-none
                    transition-all duration-200
                    focus:border-[#00AFC1] focus:ring-2 focus:ring-[#00AFC1]/20
                    ${errors.email && touched.email
                      ? 'border-red-400 ring-2 ring-red-100'
                      : 'border-[#ECECEC]'
                    }
                  `}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                />
              </div>
              <AnimatePresence>
                {errors.email && touched.email && (
                  <motion.p
                    id="email-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                    role="alert"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Campo Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-[#222222]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Contraseña
                </label>
                <Link
                  to="/auth/recuperar-contrasena"
                  className="text-xs text-[#00AFC1] hover:text-[#008C99] font-medium transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  tabIndex={0}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaa]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) validateField('password', e.target.value);
                  }}
                  onBlur={() => handleBlur('password')}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className={`
                    w-full pl-11 pr-12 py-3.5 rounded-xl border text-sm bg-white
                    text-[#222222] placeholder-[#bbb] outline-none
                    transition-all duration-200
                    focus:border-[#00AFC1] focus:ring-2 focus:ring-[#00AFC1]/20
                    ${errors.password && touched.password
                      ? 'border-red-400 ring-2 ring-red-100'
                      : 'border-[#ECECEC]'
                    }
                  `}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#00AFC1] transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && touched.password && (
                  <motion.p
                    id="password-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                    role="alert"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Botón submit */}
            <motion.button
              onClick={handleSubmit}
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className={`
                w-full py-4 rounded-xl font-bold text-sm text-white
                bg-[#F7931E] hover:bg-[#e07f10]
                shadow-lg shadow-[#F7931E]/30
                transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              `}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Ingresando…
                </>
              ) : (
                'Ingresar al sistema'
              )}
            </motion.button>
          </motion.div>

          {/* Footer del form */}
          <p
            className="mt-8 text-center text-xs text-[#999]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            ¿Problemas para ingresar?{' '}
            <a
              href="https://wa.me/50586577616"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00AFC1] hover:underline font-medium"
            >
              Contáctanos por WhatsApp
            </a>
          </p>

          <p
            className="mt-4 text-center text-xs text-[#ccc]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            © {new Date().getFullYear()} PsicoLuz · Managua, Nicaragua
          </p>
        </motion.div>
      </div>
    </div>
  );
}