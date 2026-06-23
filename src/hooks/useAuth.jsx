// ============================================================
// src/hooks/useAuth.js
// DECISIÓN TÉCNICA:
//   • Context + Hook pattern: evita prop-drilling y centraliza
//     el estado de sesión en un solo lugar.
//   • onAuthStateChange: Supabase emite eventos (SIGNED_IN,
//     SIGNED_OUT, TOKEN_REFRESHED, PASSWORD_RECOVERY) que
//     actualizan el contexto automáticamente.
//   • El perfil del usuario (tabla "usuario") se carga justo
//     después de confirmar la sesión, para obtener rol, nombre,
//     etc. sin exponer datos en el token JWT.
//   • loading = true hasta que se confirme el estado inicial:
//     evita flash de contenido no autorizado (IDOR prevention).
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { supabase } from '../lib/supabaseClient';
import { signOut as authSignOut } from '../services/authService';

// ─── Contexto ────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null); // datos de tabla "usuario"
  const [loading, setLoading] = useState(true);
  const [authEvent, setAuthEvent] = useState(null); // 'PASSWORD_RECOVERY', etc.
  const fetchingRef = useRef(false);

  // Cargar perfil extendido desde la tabla "usuario"
  const loadPerfil = useCallback(async (userId) => {
    if (!userId || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const { data, error } = await supabase
        .from('usuario')
        .select(`
          id,
          nombre,
          apellido,
          email,
          telefono,
          avatar_url,
          activo,
          rol:rol_id (
            id,
            nombre
          )
        `)
        .eq('id', userId)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('[useAuth] Error cargando perfil:', error.message);
        setPerfil(null);
      } else {
        setPerfil(data);
      }
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // 1. Obtener sesión inicial (por si ya hay sesión activa)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadPerfil(s.user.id);
      setLoading(false);
    });

    // 2. Suscribirse a cambios de estado de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        setAuthEvent(event);
        setSession(s);
        setUser(s?.user ?? null);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (s?.user) loadPerfil(s.user.id);
        }

        if (event === 'SIGNED_OUT') {
          setPerfil(null);
        }

        if (event === 'PASSWORD_RECOVERY') {
          // El guard redirigirá al componente de nueva contraseña
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadPerfil]);

  const logout = useCallback(async () => {
    setLoading(true);
    await authSignOut();
    // onAuthStateChange limpiará el estado automáticamente
  }, []);

  const value = {
    session,
    user,
    perfil,
    loading,
    authEvent,
    isAuthenticated: !!session,
    rol: perfil?.rol?.nombre ?? null,
    logout,
    refreshPerfil: () => user && loadPerfil(user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}