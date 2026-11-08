export const PREFERENCE_KEY = 'psicoluz-portal-reading-v1';
export const DEFAULT_PREFERENCES = { size: 'normal', theme: 'institucional', font: 'clara', spacing: false, reducedMotion: true, simple: false, rate: '0.9' };
export function sanitizePreferences(input) {
  const out = { ...DEFAULT_PREFERENCES };
  for (const [key, choices] of Object.entries({ size: ['normal', 'grande', 'muy_grande'], theme: ['institucional', 'contraste', 'oscuro', 'calido'], font: ['clara', 'arial', 'serif'], rate: ['0.8', '0.9', '1'] })) if (choices.includes(input?.[key])) out[key] = input[key];
  for (const key of ['spacing', 'reducedMotion', 'simple']) if (typeof input?.[key] === 'boolean') out[key] = input[key];
  return out;
}
