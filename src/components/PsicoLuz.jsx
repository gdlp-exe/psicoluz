import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Heart, Brain, BookOpen, MessageCircle, Activity, ChevronDown, Star, Phone, MapPin, Clock, Menu, X, ArrowRight, CheckCircle, Users, Award, Smile, ChevronRight, ChevronLeft, Play, PlayIcon} from "lucide-react";

// ─── Google Fonts ───────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Nunito:wght@400;500;600;700&family=Great+Vibes&display=swap";
document.head.appendChild(fontLink);

// ─── Constants ───────────────────────────────────────────────────────────────
const COLORS = {
  teal: "#00AFC1",
  tealDark: "#008C99",
  orange: "#F7931E",
  white: "#F9F9F9",
  gray: "#ECECEC",
  dark: "#222222",
};



const SERVICES = [
  { id: 1, icon: Brain, title: "Psicología Infantil", desc: "Apoyo emocional y conductual para que tu hijo desarrolle herramientas que lo acompañen toda la vida.", color: "#00AFC1", bg: "from-cyan-50 to-teal-50" },
  { id: 2, icon: BookOpen, title: "Pedagogía", desc: "Intervención educativa personalizada que potencia las capacidades únicas de cada niño.", color: "#F7931E", bg: "from-orange-50 to-amber-50" },
  { id: 3, icon: Star, title: "Reforzamiento Escolar", desc: "Acompañamiento académico especializado para fortalecer el aprendizaje y la confianza escolar.", color: "#00AFC1", bg: "from-cyan-50 to-sky-50" },
  { id: 4, icon: MessageCircle, title: "Logopedia", desc: "Evaluación y tratamiento de dificultades en el lenguaje, habla y comunicación.", color: "#F7931E", bg: "from-orange-50 to-yellow-50" },
  { id: 5, icon: Activity, title: "Fisioterapia", desc: "Estimulación y rehabilitación motora para el pleno desarrollo físico del niño.", color: "#00AFC1", bg: "from-teal-50 to-emerald-50" },
];

const TEAM = [
  { name: "Dra. Sofía Martínez", role: "Psicóloga Infantil", desc: "Comprometida con el bienestar emocional y el desarrollo integral de cada pequeño." },
  { name: "Lic. Andrea López", role: "Pedagoga Especialista", desc: "Apasionada por descubrir y potenciar las capacidades únicas de cada niño." },
  { name: "Lic. Guadalupe Ruiz", role: "Logopeda", desc: "Dedicado a abrir puertas de comunicación para cada niño con paciencia y amor." },
  { name: "Lic. María Flores", role: "Fisioterapeuta", desc: "Con manos expertas y corazón generoso guía el desarrollo motor infantil." },
];

const TESTIMONIALS = [
  { text: "Mi hijo llegó con muchos miedos y en PsicoLuz encontró un lugar donde se siente seguro y amado. Los cambios han sido increíbles.", author: "Laura M.", role: "Mamá de Mateo, 7 años", stars: 5 },
  { text: "El equipo es extraordinariamente profesional y humano. Por fin encontré un lugar donde realmente escuchan a mi hijo.", author: "Roberto C.", role: "Papá de Valeria, 9 años", stars: 5 },
  { text: "Gracias a PsicoLuz mi hija mejoró muchísimo en la escuela y sobre todo recuperó su confianza. Son maravillosos.", author: "Ana P.", role: "Mamá de Sofía, 6 años", stars: 5 },
  { text: "El acompañamiento que recibimos fue más allá de lo esperado. Siento que cuidan a mi hijo como si fuera de ellos.", author: "Miguel T.", role: "Papá de Diego, 8 años", stars: 5 },
];

const FAQS = [
  { q: "¿A partir de qué edad atienden a los niños?", a: "Atendemos desde los 2 años hasta los 16 años. Cada etapa del desarrollo tiene su equipo especializado." },
  { q: "¿Cómo es el proceso de valoración inicial?", a: "La valoración inicial incluye una entrevista con los padres, observación del niño y aplicación de pruebas especializadas según el área de interés." },
  { q: "¿Cuánto tiempo dura cada sesión?", a: "Las sesiones tienen una duración de 45 a 60 minutos, dependiendo del tipo de terapia y la edad del niño." },
  { q: "¿Trabajan con seguros médicos?", a: "Actualmente trabajamos con varios seguros médicos. Contáctanos para verificar la cobertura de tu póliza específica." },
  { q: "¿Puedo acompañar a mi hijo durante las sesiones?", a: "En las primeras sesiones los padres participan activamente. Luego el terapeuta indicará cuándo es beneficioso la presencia de los padres." },
];

const STATS = [
  { value: 70, suffix: "+", label: "Familias atendidas" },
  { value: 12, suffix: "+", label: "Años de experiencia" },
  { value: 8, suffix: "", label: "Especialistas certificados" },
  { value: 98, suffix: "%", label: "Satisfacción familiar!" },
];

// ─── Animated Counter ────────────────────────────────────────────────────────
function Counter({ value, suffix }) {
  const [count, setCount] = useState(0);
  const ref = useRef();
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = value / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 25);
    return () => clearInterval(timer);
  }, [inView, value]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Blob Background ─────────────────────────────────────────────────────────
function AnimatedBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[0,1,2].map(i => (
        <motion.div key={i}
          className="absolute rounded-full opacity-20 blur-3xl"
          style={{ background: i % 2 === 0 ? COLORS.teal : COLORS.orange, width: `${280+i*80}px`, height: `${280+i*80}px`, left: `${i*30}%`, top: `${i*15}%` }}
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 8+i*2, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── Floating Particles ──────────────────────────────────────────────────────
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({length: 18}).map((_, i) => (
        <motion.div key={i}
          className="absolute rounded-full"
          style={{ width: `${4+Math.random()*8}px`, height: `${4+Math.random()*8}px`, background: i%3===0 ? COLORS.orange : COLORS.teal, left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, opacity: 0.15+Math.random()*0.2 }}
          animate={{ y: [-10, 10, -10], x: [-5, 5, -5], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 3+Math.random()*4, repeat: Infinity, ease: "easeInOut", delay: Math.random()*3 }}
        />
      ))}
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = ["Servicios", "Equipo", "Galería", "Testimonios", "Contacto"];

  const goTo = (path) => {
    window.location.href = path;
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg shadow-teal-100/50"
          : "bg-transparent"
      }`}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
            style={{
              background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.tealDark})`,
            }}
          >
            <img
              src="/loguito.png"
              alt="PsicoLuz Logo"
              className="w-7 h-7 object-contain"
            />
          </div>

          <div>
            <span
              className="font-black text-xl tracking-tight"
              style={{
                fontFamily: "Poppins",
                color: scrolled ? COLORS.dark : "white",
              }}
            >
              Psico<span style={{ color: COLORS.orange }}>Luz</span>
            </span>

            <div
              className="text-xs"
              style={{
                color: scrolled ? COLORS.teal : "rgba(255,255,255,0.7)",
                fontFamily: "Nunito",
              }}
            >
              Centro Psicopedagógico
            </div>
          </div>
        </motion.div>

        {/* Links desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="text-sm font-semibold transition-colors duration-200 hover:text-orange-400"
              style={{
                fontFamily: "Nunito",
                color: scrolled ? COLORS.dark : "white",
              }}
            >
              {l}
            </a>
          ))}

          {/* Login button FIX */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => goTo("/login")}
            className="px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${COLORS.orange}, #e07810)`,
              fontFamily: "Poppins",
            }}
          >
            Login
          </motion.button>
        </div>

        {/* Mobile button */}
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          style={{ color: scrolled ? COLORS.dark : "white" }}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/98 backdrop-blur-md border-t border-teal-100 px-6 py-4 flex flex-col gap-4"
          >
            {links.map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                onClick={() => setOpen(false)}
                className="font-semibold py-2 border-b border-gray-100"
                style={{ fontFamily: "Nunito", color: COLORS.dark }}
              >
                {l}
              </a>
            ))}

            {/* Mobile login FIX */}
            <button
              className="mt-2 py-3 rounded-full font-bold text-white"
              onClick={() => goTo("/login")}
              style={{
                background: COLORS.orange,
                fontFamily: "Poppins",
              }}
            >
              Login
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.tealDark} 0%, ${COLORS.teal} 50%, #00c9d4 100%)` }}>
      <AnimatedBlobs />
      <Particles />
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 grid md:grid-cols-2 gap-12 items-center w-full">
        {/* Left */}
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6" style={{ background: "rgba(255,255,255,0.15)", color: "white", fontFamily: "Nunito", backdropFilter: "blur(10px)" }}>
              <Heart size={12} fill="currentColor" /> Centro Psicopedagógico · Managua
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight text-white" style={{ fontFamily: "Poppins" }}>
              Un lugar donde<br />tu hijo{" "}
              <span style={{ fontFamily: "Great Vibes", color: COLORS.orange, fontSize: "1.15em", fontWeight: 400 }}>se siente seguro</span>
            </h1>
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}
            className="text-lg md:text-xl leading-relaxed text-white/90 max-w-lg" style={{ fontFamily: "Nunito" }}>
            En PsicoLuz acompañamos el desarrollo infantil con amor, paciencia y atención profesional especializada. Cada niño es único y merece ser visto así.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7 }} className="flex flex-col sm:flex-row gap-4">
            <motion.button whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${COLORS.orange}80` }} whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white font-bold text-lg shadow-2xl"
              style={{ background: `linear-gradient(135deg, ${COLORS.orange}, #e07810)`, fontFamily: "Poppins" }}>
              Agendar valoración <ArrowRight size={18} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.03, background: "rgba(255,255,255,0.15)" }} whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-lg border-2 border-white/60 text-white transition-all"
              style={{ fontFamily: "Poppins", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
              <Play size={16} /> Conocer servicios
            </motion.button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="flex items-center gap-6 pt-4">
            {[["70+","Familias"],["12+","Años"],["98%","Satisfacción"]].map(([v,l]) => (
              <div key={l} className="text-center">
                <div className="text-2xl font-black text-white" style={{ fontFamily: "Poppins" }}>{v}</div>
                <div className="text-xs text-white/70" style={{ fontFamily: "Nunito" }}>{l}</div>
              </div>
            ))}
          </motion.div>
        </div>
        {/* Right image card */}
        <motion.div initial={{ opacity: 0, x: 50, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.4, duration: 0.9 }} className="relative flex justify-center">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-30" style={{ background: COLORS.orange }} />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20" style={{ aspectRatio: "4/5" }}>
              <img src="/grande.jpg" alt="Niño sonriendo feliz" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-teal-900/40 to-transparent" />
            </div>
            {/* Floating badge */}
            <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.tealDark})` }}>
                <Heart size={18} fill="white" color="white" />
              </div>
              <div>
                <div className="text-xs font-bold" style={{ color: COLORS.dark, fontFamily: "Poppins" }}>Atención Integral</div>
                <div className="text-xs" style={{ color: COLORS.teal, fontFamily: "Nunito" }}>Con amor y vocación</div>
              </div>
            </motion.div>
            <motion.div animate={{ y: [4, -4, 4] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-white rounded-2xl p-3 shadow-2xl flex items-center gap-2">
              <div className="flex -space-x-1">{[0,1,2].map(i=><div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden"><img src={`https://i.pravatar.cc/40?img=${i+10}`} alt="" className="w-full h-full object-cover"/></div>)}</div>
              <div className="text-xs font-bold" style={{ fontFamily: "Poppins", color: COLORS.dark }}>+70 familias</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
      <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
        <ChevronDown size={28} color="white" opacity={0.6} />
      </motion.div>
    </section>
  );
}

// ─── Trust Section ───────────────────────────────────────────────────────────
function TrustSection() {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="servicios"
      className="py-24 relative overflow-hidden"
      style={{ background: COLORS.white }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${COLORS.teal}, ${COLORS.orange}, ${COLORS.teal})`,
        }}
      />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: COLORS.orange, fontFamily: "Nunito" }}
          >
            Nuestra filosofía
          </span>

          <h2
            className="text-4xl md:text-5xl font-black mt-2"
            style={{ fontFamily: "Poppins", color: COLORS.dark }}
          >
            Cada niño <span style={{ color: COLORS.teal }}>nos importa</span>
          </h2>

          <p
            className="text-gray-500 mt-4 max-w-xl mx-auto text-lg"
            style={{ fontFamily: "Nunito" }}
          >
            Construimos vínculos de confianza con las familias porque sabemos
            que dejar a tu hijo en nuestras manos es un acto de amor.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Services Section ────────────────────────────────────────────────────────
function ServicesSection() {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const images = [
    "/psicologia.jpg",
    "/pedagogia.jpg",
    "reforzamiento.jpg",
    "/logopedia.jpg",
    "/fisioterapia.jpg",
  ];
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #f0fdfe 0%, white 100%)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.teal, fontFamily: "Nunito" }}>Lo que ofrecemos</span>
          <h2 className="text-4xl md:text-5xl font-black mt-2" style={{ fontFamily: "Poppins", color: COLORS.dark }}>
            Nuestros <span style={{ color: COLORS.orange }}>servicios</span>
          </h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto text-lg" style={{ fontFamily: "Nunito" }}>Atención integral para el desarrollo pleno de tu hijo desde los primeros años hasta la adolescencia.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 50 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -10 }} className="group rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-400 bg-white">
                <div className="relative h-52 overflow-hidden">
                  <img src={images[i]} alt={s.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 opacity-60 group-hover:opacity-50 transition-opacity duration-300" style={{ background: `linear-gradient(to top, ${s.color}cc, transparent)` }} />
                  <div className="absolute bottom-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "white" }}>
                    <Icon size={20} style={{ color: s.color }} />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-black text-xl mb-2" style={{ fontFamily: "Poppins", color: COLORS.dark }}>{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4" style={{ fontFamily: "Nunito" }}>{s.desc}</p>
                  <button className="flex items-center gap-1.5 text-sm font-bold transition-colors duration-200 hover:gap-3" style={{ color: s.color, fontFamily: "Poppins" }}>
                  </button>
                </div>
              </motion.div>
            );
          })}
          {/* CTA card */}
          <motion.div initial={{ opacity: 0, y: 50 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5, duration: 0.6 }}
            className="rounded-3xl p-8 flex flex-col justify-center items-center text-center text-white shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${COLORS.tealDark}, ${COLORS.teal})` }}>
            <Heart size={40} fill="white" color="white" className="mb-4 opacity-90" />
            <h3 className="font-black text-2xl mb-3" style={{ fontFamily: "Poppins" }}>¿No sabes por dónde empezar?</h3>
            <p className="text-white/80 mb-6 text-sm" style={{ fontFamily: "Nunito" }}>Contáctanos y te ayudamos a encontrar el servicio ideal para tu hijo.</p>
         <motion.a
  href="https://wa.me/50586577616?text=Hola%20PsicoLuz,%20me%20gustaría%20recibir%20información."
  target="_blank"
  rel="noopener noreferrer"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.97 }}
  className="px-6 py-3 bg-white rounded-full font-bold text-sm shadow-lg inline-flex items-center justify-center"
  style={{ color: COLORS.tealDark, fontFamily: "Poppins" }}
>
  ¡Consultar ahora!
</motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats Section ───────────────────────────────────────────────────────────
function StatsSection() {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section ref={ref} className="py-20 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.tealDark} 0%, ${COLORS.teal} 100%)` }}>
      <Particles />
      <div className="relative z-10 max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {STATS.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: i * 0.15, duration: 0.6 }}>
            <div className="text-5xl font-black text-white mb-2" style={{ fontFamily: "Poppins" }}>
              <Counter value={s.value} suffix={s.suffix} />
            </div>
            <div className="text-white/75 font-semibold text-sm" style={{ fontFamily: "Nunito" }}>{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Team Section ────────────────────────────────────────────────────────────
function TeamSection() {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const imgs = ["/equipo1.jpg","/equipo2.jpg","/equipo3.jpg","/equipo4.jpg"];
  return (
    <section id="equipo" className="py-24" style={{ background: COLORS.white }}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.orange, fontFamily: "Nunito" }}>Quiénes somos</span>
          <h2 className="text-4xl md:text-5xl font-black mt-2" style={{ fontFamily: "Poppins", color: COLORS.dark }}>
            Nuestro <span style={{ color: COLORS.teal }}>equipo</span>
          </h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto text-lg" style={{ fontFamily: "Nunito" }}>Profesionales apasionados por el desarrollo infantil con formación de alto nivel y corazón generoso.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {TEAM.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.12, duration: 0.6 }}
              whileHover={{ y: -8 }} className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-gray-100">
              <div className="relative h-60 overflow-hidden bg-gradient-to-br from-teal-50 to-cyan-100">
                <img src={imgs[i]} alt={m.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-6">
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: COLORS.orange, fontFamily: "Nunito" }}>{m.role}</div>
                <h3 className="font-black text-lg mb-2" style={{ fontFamily: "Poppins", color: COLORS.dark }}>{m.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "Nunito" }}>{m.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Emotional Section ───────────────────────────────────────────────────────
function EmotionalSection() {
  const ref = useRef();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <section ref={ref} className="py-28 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f0fdfe 0%, #fff7ed 100%)" }}>
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8 }}>
          <span className="text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.teal, fontFamily: "Nunito" }}>Nuestra esencia</span>
          <h2 className="text-4xl md:text-5xl font-black mt-3 mb-6 leading-tight" style={{ fontFamily: "Poppins", color: COLORS.dark }}>
            Profesionales con manos expertas y{" "}
            <span style={{ fontFamily: "Great Vibes", color: COLORS.orange, fontSize: "1.2em", fontWeight: 400 }}>corazones humanos</span>
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed mb-8" style={{ fontFamily: "Nunito" }}>
            Cada sesión es mucho más que una intervención clínica. Es un momento de encuentro, de confianza, de construcción. Vemos al niño completo, con sus talentos, sus retos, su historia.
          </p>
          <div className="space-y-4">
            {["Evaluaciones completas e individualizadas","Seguimiento continuo del progreso","Comunicación constante con la familia","Ambiente seguro, cálido y estimulante"].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.tealDark})` }}>
                  <CheckCircle size={14} color="white" />
                </div>
                <span className="text-gray-600 font-medium" style={{ fontFamily: "Nunito" }}>{t}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <motion.div style={{ y }} initial={{ opacity: 0, x: 40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8 }} className="relative">
          <div className="absolute -inset-4 rounded-[2.5rem] blur-2xl opacity-20" style={{ background: COLORS.teal }} />
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl" style={{ aspectRatio: "3/3" }}>
            <img src="/familia.jpg" alt="Especialista con niño" className="w-full h-full object-cover" />
          </div>
          <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -bottom-5 -left-5 bg-white rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              {[0,1,2,3,4].map(i => <Star key={i} size={14} fill={COLORS.orange} color={COLORS.orange} />)}
            </div>
            <div className="text-xs font-bold" style={{ fontFamily: "Poppins", color: COLORS.dark }}>Calificación promedio</div>
            <div className="text-xs" style={{ color: COLORS.teal, fontFamily: "Nunito" }}>Basado en 500+ reseñas</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── How We Work ─────────────────────────────────────────────────────────────
function HowWeWork() {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const steps = [
    { n: "01", icon: Phone, title: "Primer contacto", desc: "Nos llamas o escribes. Te escuchamos y agendamos una valoración inicial sin compromiso." },
    { n: "02", icon: Users, title: "Valoración integral", desc: "Nuestros especialistas evalúan a tu hijo de manera completa, con amor y profesionalismo." },
    { n: "03", icon: BookOpen, title: "Plan personalizado", desc: "Diseñamos un plan de atención a la medida de las necesidades únicas de tu hijo." },
    { n: "04", icon: Heart, title: "Acompañamiento continuo", desc: "Trabajamos juntos, en equipo con la familia, para lograr los mejores resultados posibles." },
  ];
  return (
    <section className="py-24" style={{ background: COLORS.white }}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.teal, fontFamily: "Nunito" }}>Proceso de atención</span>
          <h2 className="text-4xl md:text-5xl font-black mt-2" style={{ fontFamily: "Poppins", color: COLORS.dark }}>
            ¿Cómo <span style={{ color: COLORS.orange }}>trabajamos?</span>
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-10 left-16 right-16 h-0.5" style={{ background: `linear-gradient(90deg, ${COLORS.teal}, ${COLORS.orange})` }} />
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.15, duration: 0.6 }} className="text-center relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg relative z-10 border-4 border-white" style={{ background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.tealDark})` }}>
                  <Icon size={28} color="white" />
                </div>
                <div className="text-xs font-black mb-2" style={{ color: COLORS.orange, fontFamily: "Poppins" }}>{s.n}</div>
                <h3 className="font-black text-lg mb-2" style={{ fontFamily: "Poppins", color: COLORS.dark }}>{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "Nunito" }}>{s.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Gallery ─────────────────────────────────────────────────────────────────
function Gallery() {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const imgs = [
    { src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80", span: "col-span-1 row-span-2" },
    { src: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&q=80", span: "col-span-1 row-span-1" },
    { src: "https://images.unsplash.com/photo-1551966775-a4ddc8df052b?w=400&q=80", span: "col-span-1 row-span-1" },
    { src: "https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?w=400&q=80", span: "col-span-1 row-span-1" },
    { src: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&q=80", span: "col-span-1 row-span-1" },
    { src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80", span: "col-span-1 row-span-2" },
  ];
  return (
    <section id="galería" className="py-24" style={{ background: "linear-gradient(180deg, #f0fdfe 0%, white 100%)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-14">
          <span className="text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.orange, fontFamily: "Nunito" }}>Nuestro espacio</span>
          <h2 className="text-4xl md:text-5xl font-black mt-2" style={{ fontFamily: "Poppins", color: COLORS.dark }}>
            Momentos <span style={{ color: COLORS.teal }}>reales</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-3 gap-4 auto-rows-48">
          {imgs.map((img, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02 }} className={`relative overflow-hidden rounded-2xl group ${img.span} min-h-48`}>
              <img src={img.src} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ background: `${COLORS.teal}80` }}>
                <Heart size={32} fill="white" color="white" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const [idx, setIdx] = useState(0);
  const ref = useRef();
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <section id="testimonios" className="py-24 relative overflow-hidden" style={{ background: COLORS.white }}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-14">
          <span className="text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.teal, fontFamily: "Nunito" }}>Lo que dicen</span>
          <h2 className="text-4xl md:text-5xl font-black mt-2" style={{ fontFamily: "Poppins", color: COLORS.dark }}>
            Familias que <span style={{ color: COLORS.orange }}>confían en nosotros</span>
          </h2>
        </motion.div>
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div key={idx} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl p-10 shadow-2xl border border-gray-100 text-center max-w-3xl mx-auto">
              <div className="flex justify-center gap-1 mb-6">
                {[0,1,2,3,4].map(i => <Star key={i} size={20} fill={COLORS.orange} color={COLORS.orange} />)}
              </div>
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-8 italic" style={{ fontFamily: "Nunito" }}>"{TESTIMONIALS[idx].text}"</p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2" style={{ borderColor: COLORS.teal }}>
                  <img src={`https://i.pravatar.cc/80?img=${idx+20}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <div className="font-black" style={{ fontFamily: "Poppins", color: COLORS.dark }}>{TESTIMONIALS[idx].author}</div>
                  <div className="text-sm" style={{ color: COLORS.teal, fontFamily: "Nunito" }}>{TESTIMONIALS[idx].role}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center gap-2 mt-8">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                style={{ background: i === idx ? COLORS.teal : COLORS.gray, transform: i === idx ? "scale(1.4)" : "scale(1)" }} />
            ))}
          </div>
          <div className="flex justify-center gap-4 mt-6">
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => setIdx(p => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ borderColor: COLORS.teal, color: COLORS.teal }}>
              <ChevronLeft size={18} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => setIdx(p => (p + 1) % TESTIMONIALS.length)}
              className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: COLORS.teal, color: "white" }}>
              <ChevronRight size={18} />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState(null);
  const ref = useRef();
  const inView = useInView(ref, { once: true });
  return (
    <section className="py-24" style={{ background: "linear-gradient(180deg, #fff7ed 0%, white 100%)" }}>
      <div className="max-w-3xl mx-auto px-6">
        <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-14">
          <span className="text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.orange, fontFamily: "Nunito" }}>Preguntas frecuentes</span>
          <h2 className="text-4xl md:text-5xl font-black mt-2" style={{ fontFamily: "Poppins", color: COLORS.dark }}>
            Resolvemos tus <span style={{ color: COLORS.teal }}>dudas</span>
          </h2>
        </motion.div>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08, duration: 0.5 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <button className="w-full text-left p-6 flex items-center justify-between gap-4 font-bold" style={{ fontFamily: "Poppins", color: COLORS.dark }}
                onClick={() => setOpen(open === i ? null : i)}>
                {f.q}
                <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronDown size={20} style={{ color: COLORS.teal, flexShrink: 0 }} />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                    className="px-6 pb-5 text-gray-500 text-sm leading-relaxed" style={{ fontFamily: "Nunito" }}>
                    {f.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Final ───────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="py-28 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.tealDark} 0%, ${COLORS.teal} 50%, #00c9d4 100%)` }}>
      <AnimatedBlobs />
      <Particles />
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <div className="text-6xl mb-6">💛</div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "Poppins" }}>
            Tu hijo merece un espacio donde pueda crecer{" "}
            <span style={{ fontFamily: "Great Vibes", color: COLORS.orange, fontSize: "1.15em", fontWeight: 400 }}>feliz y seguro</span>
          </h2>
          <p className="text-white/85 text-xl mb-10 max-w-2xl mx-auto" style={{ fontFamily: "Nunito" }}>
            Da el primer paso hoy. Nuestro equipo está listo para acompañarte en este camino.
          </p>
          <motion.button
            whileHover={{ scale: 1.07, boxShadow: `0 0 50px ${COLORS.orange}80` }}
            whileTap={{ scale: 0.96 }}
            animate={{ boxShadow: [`0 0 0px ${COLORS.orange}00`, `0 0 30px ${COLORS.orange}60`, `0 0 0px ${COLORS.orange}00`] }}
            transition={{ boxShadow: { duration: 2, repeat: Infinity }, scale: { duration: 0.2 } }}
            className="inline-flex items-center gap-3 px-12 py-5 rounded-full text-white font-black text-xl shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${COLORS.orange}, #e07810)`, fontFamily: "Poppins" }}>
            Contáctanos ahora <ArrowRight size={22} />
          </motion.button>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-white/80 text-sm" style={{ fontFamily: "Nunito" }}>
            <span className="flex items-center gap-2"><Phone size={16} /> +505 8657-7616</span>
            <span className="flex items-center gap-2"><MapPin size={16} /> Managua, Nicaragua</span>
            <span className="flex items-center gap-2"><Clock size={16} /> Lun–Vie 8am–6pm</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer id="contacto" className="py-16" style={{ background: COLORS.dark }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.tealDark})` }}>
                <Heart size={20} fill="white" color="white" />
              </div>
              <span className="font-black text-2xl" style={{ fontFamily: "Poppins", color: "white" }}>Psico<span style={{ color: COLORS.orange }}>Luz</span></span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6 text-sm" style={{ fontFamily: "Nunito" }}>
              Centro Psicopedagógico Infantil comprometido con el desarrollo integral, emocional y educativo de cada niño.
            </p>
            <div className="flex gap-3">
              {[PlayIcon, PlayIcon, PlayIcon].map((Icon, i) => (
                <motion.a key={i} href="#" whileHover={{ scale: 1.15, y: -2 }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  <Icon size={16} color={COLORS.teal} />
                </motion.a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-black text-sm uppercase tracking-wider mb-4 text-white" style={{ fontFamily: "Poppins" }}>Servicios</h4>
            <ul className="space-y-2">
              {["Psicología Infantil","Pedagogía","Reforzamiento Escolar","Logopedia","Fisioterapia"].map(s => (
                <li key={s}><a href="#" className="text-gray-400 text-sm hover:text-teal-400 transition-colors" style={{ fontFamily: "Nunito" }}>{s}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-black text-sm uppercase tracking-wider mb-4 text-white" style={{ fontFamily: "Poppins" }}>Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin size={14} style={{ color: COLORS.teal, marginTop: 2, flexShrink: 0 }} />
                <p className="text-gray-400 text-sm" style={{ fontFamily: "Nunito" }}>Del portón de plaza el sol 2c al sur 1c arriba frente a Optima Cargo, Managua, Nicaragua</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} style={{ color: COLORS.orange }} />
                <a href="tel:+50586577616" className="text-gray-400 text-sm hover:text-orange-400 transition-colors" style={{ fontFamily: "Nunito" }}>+505 8657-7616</a>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: COLORS.teal }} />
                <p className="text-gray-400 text-sm" style={{ fontFamily: "Nunito" }}>Lun–Vie: 8:00am – 6:00pm<br />Sáb: 8:00am – 12:00pm</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-xs" style={{ fontFamily: "Nunito" }}>© 2025 PsicoLuz. Todos los derechos reservados.</p>
          <p className="text-gray-600 text-xs" style={{ fontFamily: "Nunito" }}>Hecho con <span style={{ color: COLORS.orange }}>♥</span> en Managua, Nicaragua</p>
        </div>
      </div>
    </footer>
  );
}

// ─── WhatsApp Floating Button ─────────────────────────────────────────────────
function WhatsApp() {
  return (
    <motion.a href="https://wa.me/50586577616" target="_blank" rel="noopener noreferrer"
      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2, type: "spring" }}
      whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl text-white"
      style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}>
      <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="white" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </motion.div>
    </motion.a>
  );
}

// ─── Loader ───────────────────────────────────────────────────────────────────
function Loader({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${COLORS.tealDark}, ${COLORS.teal})` }}>
      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.8, type: "spring" }}
        className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl mb-6"
        style={{ background: "white" }}>
        <Heart size={36} fill={COLORS.teal} color={COLORS.teal} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}>
        <span className="text-3xl font-black text-white" style={{ fontFamily: "Poppins" }}>Psico<span style={{ color: COLORS.orange }}>Luz</span></span>
      </motion.div>
      <motion.div initial={{ width: 0 }} animate={{ width: "200px" }} transition={{ delay: 0.8, duration: 1.2, ease: "easeInOut" }}
        className="h-1 rounded-full mt-8 overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
        <div className="h-full w-full" style={{ background: COLORS.orange }} />
      </motion.div>
    </motion.div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function PsicoLuz() {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative" style={{ fontFamily: "Nunito", background: COLORS.white }}>
      <AnimatePresence>{!loaded && <Loader onDone={() => setLoaded(true)} />}</AnimatePresence>
      {loaded && (
        <>
          <Navbar />
          <Hero />
          <TrustSection />
          <ServicesSection />
          <StatsSection />
          <TeamSection />
          <EmotionalSection />
          <HowWeWork />
          <Gallery />
          <Testimonials />
          <FAQ />
          <CTASection />
          <Footer />
          <WhatsApp />
        </>
      )}
    </div>
  );
}