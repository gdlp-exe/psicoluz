import { mapStaffProfile, STAFF_PROFILE_RPC, StaffAccessError } from './contract';
export function createStaffRepository(client) {
  return {
    async identity() {
      const { data, error } = await client.auth.getUser();
      if (error) { if (error.name === 'AuthSessionMissingError' || error.status === 401 || error.code === 'session_not_found' || error.code === 'refresh_token_not_found') return null; throw error; }
      if (!data.user) return null;
      const { data: row, error: profileError } = await client.rpc(STAFF_PROFILE_RPC);
      if (profileError) throw new StaffAccessError('profile_unavailable', 'No se pudo verificar el acceso del personal. Volvé a intentar.');
      return { ...mapStaffProfile(row, data.user.id), email: data.user.email };
    },
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      try { return await this.identity(); }
      catch (err) { if (err instanceof StaffAccessError && ['not_enabled','contract'].includes(err.code)) await client.auth.signOut({ scope: 'local' }); throw err; }
    },
    async signOut() { const { error } = await client.auth.signOut({ scope: 'local' }); if (error) { await client.auth.signOut({ scope: 'local' }); throw new StaffAccessError('signout_failed', 'No se pudo confirmar el cierre con el servidor. Cerrá esta pestaña y volvé a intentar.'); } },
    async requestRecovery(email, redirectTo) { const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo }); if (error) throw error; },
    async updatePassword(password) { const { data, error } = await client.auth.getUser(); if (error || !data.user) throw new StaffAccessError('expired_recovery', 'El enlace no está disponible o venció. Solicitá uno nuevo.'); const result = await client.auth.updateUser({ password }); if (result.error) throw result.error; await this.signOut(); },
    subscribe(callback) { const { data } = client.auth.onAuthStateChange((event) => { callback(event); }); return () => data.subscription.unsubscribe(); },
  };
}
