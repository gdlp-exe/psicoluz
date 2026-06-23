// ============================================================
// src/guards/RouteGuards.jsx
// DECISIÓN TÉCNICA:
//   • ProtectedRoute: redirige a /login si no hay sesión.
//     Muestra spinner mientras loading=true para evitar flash
//     de contenido protegido (IDOR / Broken Access Control).
//   • RoleGuard: verifica el rol del perfil cargado desde DB,
//     NO desde el JWT (el JWT puede estar stale).
//   • GuestRoute: redirige al dashboard si ya hay sesión
//     (evita que un usuario logueado vea el login).
//   • allowedRoles vacío = cualquier rol autenticado puede pasar.
// ============================================================

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Useauth } from '../hooks/useAuth';

// ─── Spinner mientras carga la sesión ────────────────────────
function AuthLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#00AFC1] border-t-transparent animate-spin" />
        <p className="text-[#008C99] font-medium text-sm">Verificando sesión…</p>
      </div>
    </div>
  );
}

// ─── ProtectedRoute ──────────────────────────────────────────
/**
 * Envuelve rutas que requieren autenticación.
 * Uso: <Route element={<ProtectedRoute />}> <Route path="..." /> </Route>
 */
export function ProtectedRoute() {
  const { isAuthenticated, loading } = Useauth();
  const location = useLocation();

  if (loading) return <AuthLoader />;

  if (!isAuthenticated) {
    // Guardar la ruta de destino para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// ─── RoleGuard ───────────────────────────────────────────────
/**
 * Además de autenticación, verifica que el rol sea permitido.
 * allowedRoles: string[] — ej: ['admin', 'psicologo']
 */
export function RoleGuard({ allowedRoles = [] }) {
  const { isAuthenticated, loading, rol, perfil } = Useauth();
  const location = useLocation();

  if (loading) return <AuthLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Esperar a que cargue el perfil (rol puede ser null momentáneamente)
  if (perfil === null) return <AuthLoader />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(rol)) {
    // Redirigir a página de acceso denegado en lugar de 404
    return <Navigate to="/acceso-denegado" replace />;
  }

  return <Outlet />;
}

// ─── GuestRoute ──────────────────────────────────────────────
/**
 * Rutas solo para usuarios NO autenticados (login, recuperar contraseña).
 * Si el usuario ya tiene sesión, lo redirige al dashboard.
 */
export function GuestRoute() {
  const { isAuthenticated, loading, rol } = Useauth();
  const location = useLocation();

  if (loading) return <AuthLoader />;

  if (isAuthenticated) {
    // Redirigir a la ruta guardada previamente, o al dashboard por rol
    const from = location.state?.from?.pathname || getDashboardByRol(rol);
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}

// ─── Helper ──────────────────────────────────────────────────
function getDashboardByRol(rol) {
  const routes = {
    admin: '/dashboard/admin',
    psicologo: '/dashboard/psicologo',
    recepcion: '/dashboard/recepcion',
    paciente: '/dashboard/paciente',
  };
  return routes[rol] ?? '/dashboard';
}