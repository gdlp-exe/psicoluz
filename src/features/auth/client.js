import { createClient } from '@supabase/supabase-js';
export const EXPECTED_PROJECT_REF = 'krrurcjowhgrkenkgtpf';
let client;
export function validateAuthConfig(url, key) {
  if (url !== `https://${EXPECTED_PROJECT_REF}.supabase.co` || typeof key !== 'string' || key.length < 20 || key.startsWith('sb_secret_')) throw new Error('El acceso del personal todavía no está configurado para el proyecto nuevo.');
  if (key.startsWith('eyJ')) { try { const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); if (payload.role !== 'anon' || payload.ref !== EXPECTED_PROJECT_REF) throw new Error(); } catch { throw new Error('La configuración pública de acceso no corresponde al proyecto nuevo.'); } }
  else if (!key.startsWith('sb_publishable_')) throw new Error('Se necesita la clave pública del proyecto nuevo.');
}
export function getStaffClient() {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL, key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  validateAuthConfig(url, key);
  const fallback = new Map();
  const storage = {
    getItem(name) { try { return sessionStorage.getItem(name) ?? fallback.get(name) ?? null; } catch { return fallback.get(name) ?? null; } },
    setItem(name, value) { fallback.set(name, value); try { sessionStorage.setItem(name, value); } catch { /* Memory session remains usable. */ } },
    removeItem(name) { fallback.delete(name); try { sessionStorage.removeItem(name); } catch { /* Already cleared in memory. */ } },
  };
  client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce', storage, storageKey: `psicoluz-staff-${EXPECTED_PROJECT_REF}` } });
  return client;
}
