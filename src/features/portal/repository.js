import { developmentStore } from '../expedientes/repository';
import { initializeAgendaDemo } from '../agenda/repository';
import { initializeSeguimientoDemo, projectFamily } from '../seguimiento/repository';
import { FAMILY_OUTCOMES, projectPortal } from './contract';

// Fictional preview only. Known demo codes are NOT production authorization.
const DEMO_CODES = new Map([['PL-DEMO-101', 'record-1'], ['PL-DEMO-202', 'record-2'], ['PL-DEMO-404', 'record-4']]);
const sessions = new Map(), { read, mutate } = developmentStore;
const denied = () => new Error('No se pudo abrir el portal. Revisá el código o consultá al centro.');
function scope(token, state) { const id = sessions.get(token); if (!id || !state.records.some(r => r.id === id)) throw denied(); return id; }
async function initialize() { await initializeAgendaDemo(); await initializeSeguimientoDemo(); }
export const portalRepository = {
  async enter(code) {
    await initialize(); const recordId = DEMO_CODES.get(String(code || '').trim().toUpperCase());
    const state = await read(); if (!recordId || !state.records.some(r => r.id === recordId)) throw denied();
    const token = crypto.randomUUID(); sessions.set(token, recordId);
    return token;
  },
  async view(token) { return mutate(state => { const recordId = scope(token, state); const value = structuredClone(projectPortal(state, recordId, projectFamily(state, recordId))); state.audit.unshift({ id: crypto.randomUUID(), recordId, actor: 'Acceso familiar de demostración', action: 'Portal familiar consultado', at: new Date().toISOString() }); return { value }; }); },
  async report(token, activityId, input) {
    return mutate(state => { const recordId = scope(token, state), family = projectFamily(state, recordId);
      if (!family.activities.some(a => a.id === activityId) || !Object.hasOwn(FAMILY_OUTCOMES, input.outcome)) throw new Error('No se pudo enviar el comentario. Revisá la actividad y volvé a intentar.');
      const message = String(input.message || '').trim(); if (message.length > 500) throw new Error('El comentario admite hasta 500 caracteres.');
      const row = { id: crypto.randomUUID(), recordId, activityId, outcome: input.outcome, message, at: new Date().toISOString() };
      state.familyReports.unshift(row); state.audit.unshift({ id: crypto.randomUUID(), recordId, actor: 'Acceso familiar de demostración', action: 'Comentario de actividad recibido', at: row.at });
    });
  },
  async file(token, fileId) {
    const state = await read(), recordId = scope(token, state);
    const row = state.attachments.find(f => f.id === fileId && f.recordId === recordId && f.visiblePortal);
    if (!row) throw new Error('El archivo no está disponible.');
    return developmentStore.readFileBlob(fileId);
  },
  leave(token) { sessions.delete(token); },
};

// Production stays closed while Supabase and server authorization are pending.
export const unavailablePortalRepository = {
  async enter() { throw new Error('El portal todavía no está disponible. Consultá al centro para acceder a tu seguimiento.'); },
};
