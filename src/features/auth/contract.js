export const STAFF_PROFILE_RPC = 'psicoluz_current_staff_profile';
export const STAFF_ROLES = { psicologa: 'Psicóloga', administracion: 'Administración', desarrollo: 'Desarrollo' };
export const PROFILE_DATABASE_FIELDS = ['id', 'display_name', 'role', 'active'];
export class StaffAccessError extends Error { constructor(code, message) { super(message); this.code = code; } }
export function mapStaffProfile(row, userId) {
  if (row === null) throw new StaffAccessError('not_enabled', 'Tu cuenta no tiene un acceso de personal habilitado. Consultá a la persona encargada del centro.');
  if (!row || Array.isArray(row) || Object.keys(row).sort().join() !== [...PROFILE_DATABASE_FIELDS].sort().join() || row.id !== userId || typeof row.display_name !== 'string' || !row.display_name.trim() || row.display_name.length > 120 || !Object.hasOwn(STAFF_ROLES, row.role) || row.active !== true) throw new StaffAccessError('contract', 'No se pudo verificar el acceso de tu cuenta. Volvé a iniciar sesión o consultá al centro.');
  return { id: row.id, displayName: row.display_name, role: row.role, active: true };
}
export function authErrorMessage(error) {
  if (error instanceof StaffAccessError) return error.message;
  if (error?.status === 429 || error?.code === 'over_request_rate_limit') return 'Hubo varios intentos. Esperá un momento antes de volver a intentar.';
  if (['invalid_credentials', 'email_not_confirmed', 'user_banned'].includes(error?.code) || error?.status === 400) return 'No pudimos iniciar sesión. Revisá el correo, la contraseña y que tu cuenta esté habilitada.';
  return 'No se pudo completar la conexión. Revisá tu conexión y volvé a intentar.';
}
