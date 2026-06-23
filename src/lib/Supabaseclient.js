// src/lib/Supabaseclient.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '[PsicoLuz] Variables de entorno de Supabase no definidas. ' +
    'Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env'
  );
}

// 1. Aquí CREAS el cliente (no lo importes, porque tú eres quien lo crea)
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// 2. Aquí lo EXPORTAS para que el resto de tu app lo use
export const supabase = supabaseClient;