import { lazy, useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { getStaffClient } from './client';
import { createStaffRepository } from './repository';
import { authErrorMessage, STAFF_ROLES } from './contract';
import './auth.css';

const RemoteSeguimientoWorkspace = lazy(() => import('../seguimiento/RemoteSeguimientoWorkspace'));
const RemoteAgendaWorkspace = lazy(() => import('../agenda/RemoteAgendaWorkspace'));
const RegistryWorkspace = lazy(() => import('../registry/RegistryWorkspace'));

const initialPage = () => location.pathname === '/recuperar-acceso' ? 'recover' : location.pathname === '/actualizar-clave' ? 'update' : /^(\/personal|\/psicologo|\/admin|\/recepcion|\/paciente)(\/|$)/.test(location.pathname) ? 'personal' : 'login';

export default function AuthWorkspace({ area = 'account' }) {
  const [setup] = useState(() => { try { return { repository: createStaffRepository(getStaffClient()) }; } catch (e) { return { error: e.message }; } });
  const repository = setup.repository;
  const [page, setPage] = useState(initialPage), [identity, setIdentity] = useState(null), [checking, setChecking] = useState(!!repository), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [refreshing,setRefreshing]=useState(false);
  const identityRef=useRef(identity); identityRef.current=identity;
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirm, setConfirm] = useState(''), [show, setShow] = useState(false);
  const generation = useRef(0), busyRef = useRef(false), mounted = useRef(true), manualLogout = useRef(false), formHeading = useRef(null);
  function navigate(next, path) { setPage(next); history.replaceState(null, '', path); }
  useEffect(() => {
    const old = document.title; document.title = 'Acceso del personal | PsicoLuz';
    return () => { document.title = old; };
  }, []);
  useEffect(() => {
    if (!repository) return;
    mounted.current = true; let timer;
    async function check() {
      if (busyRef.current || manualLogout.current) return;
      const version = ++generation.current; const background=!!identityRef.current; if(background)setRefreshing(true);else {setChecking(true);setIdentity(null);} setError('');
      try { const profile = await repository.identity(); if (mounted.current && generation.current === version) setIdentity(profile); }
      catch (e) { if (mounted.current && generation.current === version) {setIdentity(null);setError(authErrorMessage(e));} }
      finally { if (mounted.current && generation.current === version) {setChecking(false);setRefreshing(false);} }
    }
    check();
    const unsubscribe = repository.subscribe(event => {
      if (busyRef.current) return;
      if (event === 'SIGNED_OUT') { generation.current++; setIdentity(null); setChecking(false); setRefreshing(false); return; }
      clearTimeout(timer); timer = setTimeout(check, 0); // Avoid async Auth calls inside the SDK callback.
    });
    const focus = () => { if (document.visibilityState === 'visible') check(); };
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', focus);
    return () => { mounted.current = false; generation.current++; clearTimeout(timer); unsubscribe(); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus); };
  }, [repository]);
  useEffect(() => {
    if (checking) return;
    if (identity && page !== 'update' && page !== 'recover') navigate('personal', area === 'registry' ? '/personal/expedientes' : area === 'agenda' ? '/personal/agenda' : area==='seguimiento'?'/personal/seguimiento':'/personal');
    else if (!identity && page === 'personal') navigate('login', '/login');
  }, [identity, checking, page, area]);
  useEffect(() => { if (!checking) formHeading.current?.focus(); }, [checking, page]);

  async function submit(e) {
    e.preventDefault(); if (!repository || busyRef.current) return;
    setError(''); setMessage('');
    if (page === 'update' && (password.length < 12 || password !== confirm)) { setError(password.length < 12 ? 'Elegí una contraseña de al menos 12 caracteres.' : 'Las contraseñas no coinciden.'); return; }
    busyRef.current = true; setBusy(true); const version = ++generation.current;
    try {
      if (page === 'recover') { await repository.requestRecovery(email, location.origin + '/actualizar-clave'); if (mounted.current) setMessage('Si el correo tiene una cuenta, recibirás un enlace para recuperar el acceso.'); }
      else if (page === 'update') { await repository.updatePassword(password); if (mounted.current) { manualLogout.current = true; setIdentity(null); navigate('login','/login'); setMessage('Contraseña actualizada. Iniciá sesión con tu nueva contraseña.'); } }
      else { manualLogout.current = false; const profile = await repository.signIn(email, password); if (mounted.current && generation.current === version) { setIdentity(profile); setChecking(false); } }
    } catch (e) { if (mounted.current && generation.current === version) { setIdentity(null); setChecking(false); setError(authErrorMessage(e)); } }
    finally { busyRef.current = false; if (mounted.current) { setBusy(false); setPassword(''); setConfirm(''); } }
  }
  async function signOut() {
    generation.current++; manualLogout.current = true; busyRef.current = true; setBusy(true); setIdentity(null); setChecking(false); setRefreshing(false); setPassword(''); setConfirm(''); setError(''); navigate('login','/login');
    try { await repository.signOut(); if (mounted.current) setMessage('Sesión cerrada.'); }
    catch (e) { if (mounted.current) setError(authErrorMessage(e)); }
    finally { busyRef.current = false; if (mounted.current) setBusy(false); }
  }
  const update = page === 'update', recover = page === 'recover';
  const workspace = identity && !update && !recover && ['registry','agenda','seguimiento'].includes(area);
  return <div className={`au-app${workspace ? ' au-workspace' : ''}`}><a className="au-skip" href="#au-main">Ir al contenido</a>{!workspace && <header className="au-header"><a className="au-logo" href="/" aria-label="PsicoLuz, inicio"><img src="/loguito.png" alt="" /><span>Psico<b>Luz</b></span></a><a href="/expediente">Acceso para familias<ArrowRight size={18} /></a></header>}
    {refreshing&&<section className="au-loading" role="status">Comprobando el acceso de tu cuenta…</section>}<main id="au-main" aria-busy={refreshing} inert={refreshing ? true : undefined} style={refreshing ? {visibility:'hidden'} : undefined}>{checking ? <section className="au-loading" role="status"><ShieldCheck size={30} /><h1>Verificando tu sesión</h1><p>Estamos comprobando el acceso de tu cuenta.</p></section> : identity && !update && !recover ? area==='seguimiento'? <RemoteSeguimientoWorkspace key={identity.id+':'+identity.role} client={getStaffClient()} identity={identity} onSignOut={signOut}/> : area === 'agenda' ? <RemoteAgendaWorkspace key={identity.id+':'+identity.role} client={getStaffClient()} identity={identity} onSignOut={signOut}/> : area === 'registry' ? <RegistryWorkspace key={identity.id+':'+identity.role} client={getStaffClient()} identity={identity} onSignOut={signOut} /> : <section className="au-staff"><div className="au-account-heading"><div><span className="au-eyebrow">ESPACIO DEL PERSONAL</span><h1 tabIndex={-1} ref={formHeading}>Hola, {identity.displayName}.</h1><p>Tu cuenta está habilitada para el rol {STAFF_ROLES[identity.role]}.</p></div><button className="au-secondary" disabled={busy} onClick={signOut}><LogOut size={18} />Cerrar sesión</button></div><div className="au-account-grid"><article><UserRound size={27} /><h2>Tu cuenta individual</h2><dl><dt>Correo</dt><dd>{identity.email}</dd><dt>Rol asignado</dt><dd>{STAFF_ROLES[identity.role]}</dd></dl><p>El rol se administra desde el centro y no se puede modificar desde tu cuenta.</p></article><article><ShieldCheck size={27} /><h2>Acceso verificado</h2><p>La cuenta y su rol se verificaron con el servidor.</p><p>Los apartados se habilitan conforme se completa su conexión.</p>{['psicologa','administracion'].includes(identity.role) && <a className="au-primary" href="/personal/expedientes">Pacientes y expedientes<ArrowRight size={17} /></a>}{['psicologa','administracion'].includes(identity.role) && <a className="au-secondary" href="/personal/agenda">Agenda y citas<ArrowRight size={17}/></a>}{identity.role==='psicologa'&&<a className="au-primary" href="/personal/seguimiento">Seguimiento<ArrowRight size={17}/></a>}{import.meta.env.DEV && <a className="au-secondary" href="/desarrollo/expedientes">Abrir demostración con datos ficticios<ArrowRight size={17} /></a>}</article></div><a href="/recuperar-acceso" className="au-text-link">Gestionar recuperación de acceso</a></section> : <section className="au-layout"><aside className="au-intro"><span className="au-intro-icon"><ShieldCheck size={41} /></span><span className="au-eyebrow">ACCESO DEL PERSONAL</span><h2>Un espacio para acompañar con cuidado.</h2><p>Ingresá con tu cuenta individual para acceder a las funciones habilitadas por el centro.</p><div className="au-intro-note"><KeyRound size={22} /><p>Las familias consultan el seguimiento mediante su código, sin crear una cuenta.</p></div></aside><section className="au-form-panel"><span className="au-eyebrow">PSICOLUZ</span><h1 tabIndex={-1} ref={formHeading}>{update ? 'Definí tu nueva contraseña' : recover ? 'Recuperar acceso' : 'Iniciar sesión'}</h1><p className="au-description">{update ? 'El cambio requiere un enlace válido o una sesión verificada.' : recover ? 'Ingresá el correo de tu cuenta para solicitar un enlace.' : 'Acceso exclusivo para personal con una cuenta habilitada.'}</p>
    {setup.error && <p role="alert" className="au-error">{setup.error}</p>}{error && <p role="alert" className="au-error">{error}</p>}{message && <p role="status" className="au-success"><CheckCircle2 size={20} />{message}</p>}
    {update && !identity ? <><p className="au-help">No hay una sesión válida para cambiar la contraseña.</p><a href="/recuperar-acceso" className="au-primary">Solicitar otro enlace</a></> : <form onSubmit={submit}>
      {!update && <label htmlFor="au-email">Correo electrónico<input id="au-email" type="email" required autoComplete="username" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} disabled={busy} /></label>}
      {!recover && <><label htmlFor="au-password">{update ? 'Nueva contraseña' : 'Contraseña'}</label><div className="au-password"><input id="au-password" type={show ? 'text' : 'password'} required minLength={update ? 12 : undefined} maxLength={128} autoComplete={update ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /><button type="button" onClick={() => setShow(v => !v)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={show}>{show ? <EyeOff size={20} /> : <Eye size={20} />}</button></div>{update && <label htmlFor="au-confirm">Confirmar nueva contraseña<input id="au-confirm" type={show ? 'text' : 'password'} required minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} disabled={busy} /></label>}</>}
      <button className="au-primary" disabled={busy || !repository}>{busy ? 'Procesando…' : update ? 'Guardar contraseña' : recover ? 'Enviar enlace de recuperación' : 'Ingresar'}<ArrowRight size={20} /></button>
    </form>}{!update && <a className="au-text-link" href={recover ? '/login' : '/recuperar-acceso'}>{recover ? 'Volver al inicio de sesión' : '¿Olvidaste tu contraseña?'}</a>}<p className="au-help">Las cuentas del personal se habilitan desde el centro. Si necesitás acceso, consultá a la persona encargada.</p></section></section>}</main>{!workspace && <footer className="au-footer">PsicoLuz · Acceso individual del personal</footer>}</div>;
}
