import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';

import { supabase } from '../lib/supabaseClient';
import { signOut as authSignOut } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authEvent, setAuthEvent] = useState(null);

  const fetchingPerfil = useRef(false);

  // ─────────────────────────────
  // CARGA PERFIL DB
  // ─────────────────────────────
  const loadPerfil = useCallback(async (userId) => {
    if (!userId || fetchingPerfil.current) return;

    fetchingPerfil.current = true;

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
        console.error('[Auth] perfil error:', error.message);
        setPerfil(null);
        return;
      }

      setPerfil(data);
    } finally {
      fetchingPerfil.current = false;
    }
  }, []);

  // ─────────────────────────────
  // INIT AUTH
  // ─────────────────────────────
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      const s = data.session ?? null;
      setSession(s);

      if (s?.user) {
        await loadPerfil(s.user.id);
      }

      setLoading(false);
    };

    init();

    // ─────────────────────────────
    // LISTENER AUTH STATE
    // ─────────────────────────────
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (event, session) => {
        setAuthEvent(event);
        setSession(session);

        const userId = session?.user?.id;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (userId) await loadPerfil(userId);
        }

        if (event === 'SIGNED_OUT') {
          setPerfil(null);
        }

        setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadPerfil]);

  // ─────────────────────────────
  // LOGOUT
  // ─────────────────────────────
  const logout = useCallback(async () => {
    setLoading(true);

    await authSignOut();

    setSession(null);
    setPerfil(null);

    setLoading(false);
  }, []);

  // ─────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────
  const value = useMemo(() => {
    const user = session?.user ?? null;

    return {
      session,
      user,
      perfil,
      loading,
      authEvent,

      isAuthenticated: !!session,
      rol: perfil?.rol?.nombre ?? null,

      logout,
      refreshPerfil: () => user?.id && loadPerfil(user.id),
    };
  }, [session, perfil, loading, authEvent, logout, loadPerfil]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}