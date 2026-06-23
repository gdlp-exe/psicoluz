import { supabase } from '../lib/supabaseClient';

// ─────────────────────────────
// VALIDACIONES (rápidas)
// ─────────────────────────────
export function validateEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  if (!password) return false;

  // mínimo simple (ajústalo si quieres más seguridad)
  return password.length >= 6;
}

// ─────────────────────────────
// AUTH SUPABASE
// ─────────────────────────────
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signUp(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) throw error;
  return data;
}