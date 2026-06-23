    // ============================================================
// src/services/authService.js
// DECISIÓN TÉCNICA:
//   • Rate limiting en cliente: complementa el rate limiting
//     de Supabase Auth (que tiene protección server-side).
//     No reemplaza las medidas del servidor, solo mejora UX.
//   • Sanitización: strip de caracteres peligrosos antes de
//     enviar a Supabase (defensa en profundidad, XSS / Injection).
//   • Errores genéricos al usuario: nunca revelar si el email
//     existe o no (previene user enumeration — OWASP A01).
//   • Credential stuffing: contador local de intentos fallidos
//     con backoff exponencial.
// ============================================================

import { supabase } from '../lib/supabaseClient';

// ─── Rate Limiter en memoria ─────────────────────────────────
// DECISIÓN: mapa en memoria (no localStorage) para que no sea
// manipulable por el usuario desde las DevTools.
const attemptTracker = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const BASE_LOCKOUT_MS = 60 * 1000; // 1 minuto base
const MAX_LOCKOUT_MS = 30 * 60 * 1000; // 30 minutos máximo

function getRateLimitKey(email) {
  // Normalizar email para evitar variantes (mayúsculas, espacios)
  return `auth:${email.trim().toLowerCase()}`;
}

function checkRateLimit(email) {
  const key = getRateLimitKey(email);
  const now = Date.now();
  const record = attemptTracker.get(key);

  if (!record) return { blocked: false };

  // Limpiar si la ventana expiró
  if (now - record.firstAttempt > WINDOW_MS) {
    attemptTracker.delete(key);
    return { blocked: false };
  }

  // Comprobar si está en lockout activo
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingMs = record.lockedUntil - now;
    const remainingSec = Math.ceil(remainingMs / 1000);
    return {
      blocked: true,
      remainingSec,
      message: `Demasiados intentos. Espera ${remainingSec} segundos.`,
    };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    // Backoff exponencial: 1min, 2min, 4min... hasta 30min
    const lockoutMs = Math.min(
      BASE_LOCKOUT_MS * Math.pow(2, record.lockCount || 0),
      MAX_LOCKOUT_MS
    );
    record.lockedUntil = now + lockoutMs;
    record.lockCount = (record.lockCount || 0) + 1;
    record.attempts = 0; // reiniciar contador dentro del lockout
    attemptTracker.set(key, record);
    const remainingSec = Math.ceil(lockoutMs / 1000);
    return {
      blocked: true,
      remainingSec,
      message: `Demasiados intentos. Espera ${remainingSec} segundos.`,
    };
  }

  return { blocked: false };
}

function recordFailedAttempt(email) {
  const key = getRateLimitKey(email);
  const now = Date.now();
  const record = attemptTracker.get(key) || {
    attempts: 0,
    firstAttempt: now,
    lockedUntil: null,
    lockCount: 0,
  };
  record.attempts += 1;
  attemptTracker.set(key, record);
}

function clearAttempts(email) {
  attemptTracker.delete(getRateLimitKey(email));
}

// ─── Sanitización ────────────────────────────────────────────
// DECISIÓN: sanitizar inputs antes de enviarlos.
// Supabase ya usa prepared statements, pero filtramos de todas
// formas (defensa en profundidad contra XSS, CRLF injection).
function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email
    .trim()
    .toLowerCase()
    .replace(/[<>"'`\r\n]/g, '') // strip caracteres peligrosos
    .substring(0, 254); // RFC 5321 max email length
}

function sanitizePassword(password) {
  if (typeof password !== 'string') return '';
  // No hacer trim en contraseñas (espacios son válidos)
  return password.replace(/[\r\n]/g, '').substring(0, 128);
}

// ─── Validaciones ────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_MIN_LENGTH = 8;
// OWASP: contraseña fuerte (mayúscula, minúscula, número, especial)
const PASSWORD_STRENGTH_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export function validateEmail(email) {
  if (!email || email.trim() === '') return 'El correo es obligatorio.';
  if (!EMAIL_REGEX.test(email)) return 'Ingresa un correo válido.';
  return null;
}

export function validatePassword(password, checkStrength = false) {
  if (!password) return 'La contraseña es obligatoria.';
  if (password.length < PASSWORD_MIN_LENGTH)
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (checkStrength && !PASSWORD_STRENGTH_REGEX.test(password))
    return 'La contraseña debe incluir mayúscula, minúscula, número y símbolo.';
  return null;
}

// ─── Mensajes genéricos (anti user-enumeration) ──────────────
// OWASP ASVS 2.1.12: no revelar si el email existe.
const GENERIC_LOGIN_ERROR =
  'Credenciales incorrectas. Verifica tu correo y contraseña.';
const GENERIC_RESET_MSG =
  'Si el correo existe, recibirás un enlace para restablecer tu contraseña.';

// ─── authService ─────────────────────────────────────────────

/**
 * Iniciar sesión con email y contraseña.
 * Incluye rate limiting, sanitización y mensajes genéricos.
 */
export async function signIn({ email, password }) {
  const cleanEmail = sanitizeEmail(email);
  const cleanPassword = sanitizePassword(password);

  // Validación frontend
  const emailErr = validateEmail(cleanEmail);
  if (emailErr) return { data: null, error: { message: emailErr } };
  const passErr = validatePassword(cleanPassword);
  if (passErr) return { data: null, error: { message: passErr } };

  // Rate limit check
  const limit = checkRateLimit(cleanEmail);
  if (limit.blocked) return { data: null, error: { message: limit.message } };

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: cleanPassword,
  });

  if (error) {
    recordFailedAttempt(cleanEmail);
    // DECISIÓN: mensaje genérico para no revelar si el email existe
    return { data: null, error: { message: GENERIC_LOGIN_ERROR } };
  }

  // Login exitoso → limpiar contador
  clearAttempts(cleanEmail);
  return { data, error: null };
}

/**
 * Cerrar sesión del usuario actual.
 * Supabase revoca el refresh token en el servidor.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[authService] signOut error:', error.message);
    return { error };
  }
  return { error: null };
}

/**
 * Enviar email de recuperación de contraseña.
 * Siempre devuelve mensaje genérico (anti user-enumeration).
 */
export async function sendPasswordReset({ email }) {
  const cleanEmail = sanitizeEmail(email);
  const emailErr = validateEmail(cleanEmail);
  if (emailErr) return { error: { message: emailErr } };

  // Rate limit para reset también (anti-spam / abuso)
  const limit = checkRateLimit(`reset:${cleanEmail}`);
  if (limit.blocked) return { error: { message: limit.message } };

  const redirectTo = `${window.location.origin}/auth/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo,
  });

  // Registrar intento de reset (para detectar abuso)
  if (error) {
    recordFailedAttempt(`reset:${cleanEmail}`);
  }

  // DECISIÓN: siempre devolvemos el mismo mensaje (OWASP ASVS 2.1.12)
  return { error: null, message: GENERIC_RESET_MSG };
}

/**
 * Actualizar la contraseña del usuario autenticado.
 * Se usa después de que el usuario vuelve del link de recuperación.
 */
export async function updatePassword({ password }) {
  const cleanPassword = sanitizePassword(password);
  const passErr = validatePassword(cleanPassword, true); // con validación de fortaleza
  if (passErr) return { error: { message: passErr } };

  const { data, error } = await supabase.auth.updateUser({
    password: cleanPassword,
  });

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}

/**
 * Obtener la sesión activa actual.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session ?? null, error };
}

/**
 * Obtener el usuario actual desde la sesión (no desde localStorage).
 * DECISIÓN: usar getUser() que valida con el servidor (más seguro
 * que leer del token local — OWASP ASVS 3.3).
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user ?? null, error };
}