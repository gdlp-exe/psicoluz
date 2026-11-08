import { lazy, Suspense } from 'react';

const ExpedientesWorkspace = lazy(() => import('./features/expedientes/ExpedientesWorkspace'));
const LegacyApp = lazy(() => import('./LegacyApp'));

export default function App() {
  const development = window.location.pathname.startsWith('/desarrollo/expedientes');
  return (
    <Suspense fallback={<div role="status" style={{ padding: 40, color: '#008794', fontFamily: 'Segoe UI, sans-serif' }}>Cargando PsicoLuz…</div>}>
      {development ? <ExpedientesWorkspace /> : <LegacyApp />}
    </Suspense>
  );
}
