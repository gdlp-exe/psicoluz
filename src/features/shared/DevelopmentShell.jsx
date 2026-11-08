import { useState } from 'react';
import { BookOpen, ArrowRight, CalendarDays, CheckCircle2, ChevronRight, FolderOpen, Menu, ShieldCheck, X } from 'lucide-react';
import { DEMO_IDENTITIES } from '../expedientes/repository';
import '../expedientes/expedientes.css';

const PROFILE_KEY = 'psicoluz-development-profile';
export function useDevelopmentIdentity() {
  const [identity, update] = useState(() => {
    try { return DEMO_IDENTITIES.find(p => p.id === sessionStorage.getItem(PROFILE_KEY)) || DEMO_IDENTITIES[0]; }
    catch { return DEMO_IDENTITIES[0]; }
  });
  return [identity, next => { update(next); try { sessionStorage.setItem(PROFILE_KEY, next.id); } catch { /* The demo remains usable without session storage. */ } }];
}

export default function DevelopmentShell({ children, identity, onIdentityChange, active, count = 0, production = false, onSignOut }) {
  const [navOpen, setNavOpen] = useState(false); const ContentTag=production ? 'div' : 'main';
  const title = active === 'seguimiento' ? 'Seguimiento' : active === 'agenda' ? 'Agenda y citas' : 'Expedientes';
  return <div className={`exp-app ${active === 'seguimiento' ? 'sf-app' : ''}`}><a href="#exp-content" className="exp-skip">Ir al contenido</a>
    {navOpen && <button className="exp-nav-scrim" aria-label="Cerrar menú" onClick={() => setNavOpen(false)} />}
    <aside className={`exp-sidebar ${navOpen ? 'open' : ''}`}>
      <a href="/" className="exp-brand"><span><img src="/loguito.png" alt="" /></span><div>Psico<b>Luz</b><small>ESPACIO PROFESIONAL</small></div></a>
      <div className="exp-nav-label">GESTIÓN DEL CENTRO</div>
      <nav aria-label="Navegación del sistema">
        <a href={production ? "/personal/expedientes" : "/desarrollo/expedientes"} aria-current={active === 'expedientes' ? 'page' : undefined}><FolderOpen size={20} />Expedientes{active === 'expedientes' && <span>{count}</span>}</a>
        <a href={production ? "/personal/agenda" : "/desarrollo/agenda"} aria-current={active === 'agenda' ? 'page' : undefined}><CalendarDays size={20} />Agenda y citas{active === 'agenda' && <span>{count}</span>}</a>
        {!production && <a href="/desarrollo/seguimiento" aria-current={active === 'seguimiento' ? 'page' : undefined}><CheckCircle2 size={20} />Seguimiento{active === 'seguimiento' && <span>{count}</span>}</a>}
        {!production && <a href="/desarrollo/portal" target="_blank" rel="noopener noreferrer"><BookOpen size={20} />Portal familiar (otra pestaña)</a>}
      </nav>
      <div className="exp-sidebar-note"><ShieldCheck size={26} /><h4>Información del paciente</h4><p>Información organizada para dar continuidad al acompañamiento.</p><i /><i /></div>
      <div className="exp-sidebar-bottom"><span className="exp-person-dot">{identity.name[0]}</span><div><strong>{identity.name}</strong><small>{identity.role === 'psicologa' ? 'Psicóloga responsable' : identity.role === 'administracion' ? 'Administración' : 'Desarrollo'}</small></div></div>
    </aside>
    <div className="exp-main-shell"><header className="exp-header"><div><button className="exp-mobile-menu exp-icon" onClick={() => setNavOpen(true)} aria-label="Abrir menú"><Menu size={22} /></button><span>Mi espacio <ChevronRight size={14} /><strong>{title}</strong></span></div><a href="/" className="exp-home-link">Ver sitio público<ArrowRight size={15} /></a></header>
      {production ? <div className="exp-demo-banner"><span>Sesión de {identity.name} · Agenda conectada</span><button className="exp-secondary" onClick={onSignOut}>Cerrar sesión</button></div> : <div className="exp-demo-banner"><span><i />Vista de desarrollo · Datos ficticios · Sin conexión a Supabase</span><label>Perfil de prueba<select aria-label="Perfil de prueba" value={identity.id} onChange={e => onIdentityChange(DEMO_IDENTITIES.find(p => p.id === e.target.value))}>{DEMO_IDENTITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label></div>}
      <ContentTag className="exp-content" id="exp-content">{children}</ContentTag>
      <footer className="exp-footer">PsicoLuz · Espacio profesional<span>Construido para acompañar mejor.</span></footer>
    </div>
  </div>;
}
