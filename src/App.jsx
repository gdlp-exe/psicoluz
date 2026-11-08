import { lazy, Suspense } from 'react';

const ExpedientesWorkspace = lazy(() => import('./features/expedientes/ExpedientesWorkspace'));
const AgendaWorkspace = lazy(() => import('./features/agenda/AgendaWorkspace'));
const SeguimientoWorkspace = lazy(() => import('./features/seguimiento/SeguimientoWorkspace'));
const PortalWorkspace = lazy(() => import('./features/portal/PortalWorkspace'));
const AuthWorkspace = lazy(() => import('./features/auth/AuthWorkspace'));
const Landing = lazy(() => import('./components/PsicoLuz'));

export default function App() {
  const path = window.location.pathname;
  const development = path.startsWith('/desarrollo/expedientes');
  const agenda = path.startsWith('/desarrollo/agenda');
  const seguimiento = path.startsWith('/desarrollo/seguimiento');
  const portalDemo = path.startsWith('/desarrollo/portal');
  const staff = /^\/(login|register|recuperar-acceso|actualizar-clave|personal|psicologo|admin|recepcion|paciente)(\/|$)/.test(path);
  const portalPublic = /^\/(?:expediente|portal)(?:\/|$)/.test(path);
  return (
    <Suspense fallback={<div role="status" style={{ padding: 40, color: '#008794', fontFamily: 'Segoe UI, sans-serif' }}>Cargando PsicoLuz…</div>}>
      {portalDemo ? <PortalWorkspace development /> : portalPublic ? <PortalWorkspace /> : seguimiento ? <SeguimientoWorkspace /> : agenda ? <AgendaWorkspace /> : development ? <ExpedientesWorkspace /> : staff ? <AuthWorkspace /> : path === '/' ? <Landing /> : <main style={{ padding: 40 }}><h1>Página no encontrada</h1><a href="/">Volver al inicio</a></main>}
    </Suspense>
  );
}
