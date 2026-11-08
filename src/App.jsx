import { lazy, Suspense } from 'react';

const ExpedientesWorkspace = lazy(() => import('./features/expedientes/ExpedientesWorkspace'));
const AgendaWorkspace = lazy(() => import('./features/agenda/AgendaWorkspace'));
const SeguimientoWorkspace = lazy(() => import('./features/seguimiento/SeguimientoWorkspace'));
const LegacyApp = lazy(() => import('./LegacyApp'));

export default function App() {
  const path = window.location.pathname;
  const development = path.startsWith('/desarrollo/expedientes');
  const agenda = path.startsWith('/desarrollo/agenda');
  const seguimiento = path.startsWith('/desarrollo/seguimiento');
  return (
    <Suspense fallback={<div role="status" style={{ padding: 40, color: '#008794', fontFamily: 'Segoe UI, sans-serif' }}>Cargando PsicoLuz…</div>}>
      {seguimiento ? <SeguimientoWorkspace /> : agenda ? <AgendaWorkspace /> : development ? <ExpedientesWorkspace /> : <LegacyApp />}
    </Suspense>
  );
}
