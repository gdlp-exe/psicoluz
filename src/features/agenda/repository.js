import { developmentStore, PROFESSIONALS } from '../expedientes/repository';

export const APPOINTMENT_STATES = { confirmada: 'Confirmada', pendiente: 'Pendiente', atendida: 'Atendida', cancelada: 'Cancelada' };
export const MODALITIES = { presencial: 'Presencial', virtual: 'Virtual' };
export const DURATIONS = [15, 30, 45, 60, 90];
export const TIME_ZONE = 'America/Managua';
export function nicaraguaDate(value = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value)).map(v => [v.type, v.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
export function nicaraguaTime(value) { return new Intl.DateTimeFormat('es-NI', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value)); }
export function addDays(day, amount) { const d = new Date(day + 'T12:00:00-06:00'); d.setUTCDate(d.getUTCDate() + amount); return nicaraguaDate(d); }
export function monday(day) { const d = new Date(day + 'T12:00:00-06:00').getUTCDay(); return addDays(day, -(d === 0 ? 6 : d - 1)); }
const { read, mutate, requireRecord, log } = developmentStore;
const now = () => new Date().toISOString();
function seedAppointments(state) {
  const day = nicaraguaDate();
  return [
    ['record-1', '09:00', 'confirmada', 'presencial', day],
    ['record-2', '10:30', 'confirmada', 'presencial', day],
    ['record-3', '14:00', 'pendiente', 'virtual', day],
    ['record-4', '09:00', 'confirmada', 'presencial', day],
    ['record-1', '11:00', 'confirmada', 'virtual', addDays(day, 1)],
  ].filter(([id]) => state.records.some(r => r.id === id)).map(([id, time, status, modality, date], j) => {
    const r = state.records.find(r => r.id === id), startAt = new Date(date + 'T' + time + ':00-06:00').toISOString();
    return { id: 'appointment-demo-' + j, recordId: r.id, patientId: r.patientId, professionalId: r.professionalId, startAt, duration: 45, endAt: new Date(Date.parse(startAt) + 45 * 60000).toISOString(), modality, status, createdAt: now(), updatedAt: now() };
  });
}
async function initialize() { await mutate(state => { if (!Array.isArray(state.appointments)) state.appointments = seedAppointments(state); }); }
function canRead(state, identity, row) { const record = state.records.find(r => r.id === row.recordId); return !!record && (identity.role === 'administracion' || identity.role === 'psicologa' && identity.id === row.professionalId && identity.id === record.professionalId); }
function requireAppointment(state, identity, id) { const row = state.appointments?.find(a => a.id === id); if (!row || !canRead(state, identity, row)) throw new Error('No tenés acceso a esta cita con el perfil seleccionado.'); return row; }
function decorated(state, row) {
  const record = state.records.find(r => r.id === row.recordId), patient = state.patients.find(p => p.id === row.patientId);
  return { ...row, patientName: `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim(), recordNumber: record?.number || '', professionalName: PROFESSIONALS.find(p => p.id === row.professionalId)?.name || '' };
}
function validated(state, identity, input, exceptId = '') {
  const record = requireRecord(state, identity, input.recordId);
  if (!['administracion', 'psicologa'].includes(identity.role)) throw new Error('Este perfil no puede registrar citas.');
  if (!APPOINTMENT_STATES[input.status]) throw new Error('Seleccioná un estado válido.');
  if (!MODALITIES[input.modality]) throw new Error('Seleccioná la modalidad de la cita.');
  const date = String(input.date || ''), time = String(input.time || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Revisá la fecha y hora de la cita.');
  const timestamp = new Date(`${date}T${time}:00-06:00`);
  if (Number.isNaN(timestamp.valueOf()) || nicaraguaDate(timestamp) !== date) throw new Error('La fecha no es válida.');
  const duration = Number(input.duration);
  if (!DURATIONS.includes(duration)) throw new Error('Seleccioná una duración disponible.');
  const startAt = timestamp.toISOString(), endAt = new Date(timestamp.valueOf() + duration * 60000).toISOString();
  if (nicaraguaDate(endAt) !== date) throw new Error('La cita debe finalizar el mismo día. Elegí otra hora o duración.');
  const conflict = ['confirmada', 'pendiente'].includes(input.status) && state.appointments.find(a => a.id !== exceptId && a.professionalId === record.professionalId && ['confirmada', 'pendiente'].includes(a.status) && startAt < a.endAt && endAt > a.startAt);
  if (conflict) { const error = new Error(`Hay un cruce de horario. La profesional ya tiene una cita de ${nicaraguaTime(conflict.startAt)} a ${nicaraguaTime(conflict.endAt)}. Elegí otra disponibilidad.`); error.code = 'SCHEDULE_CONFLICT'; throw error; }
  return { recordId: record.id, patientId: record.patientId, professionalId: record.professionalId, startAt, endAt, duration, modality: input.modality, status: input.status };
}

export const agendaRepository = {
  async list(identity) { await initialize(); const state = await read(); return structuredClone(state.appointments.filter(a => canRead(state, identity, a)).map(a => decorated(state, a))); },
  async records(identity) { const state = await read(); return structuredClone(state.records.filter(r => identity.role === 'administracion' || identity.role === 'psicologa' && identity.id === r.professionalId).map(r => ({ id: r.id, number: r.number, patientId: r.patientId, professionalId: r.professionalId, patientName: (() => { const p = state.patients.find(p => p.id === r.patientId); return `${p?.firstName || ''} ${p?.lastName || ''}`.trim(); })() }))); },
  async open(identity, id) { await initialize(); return mutate(state => { const row = requireAppointment(state, identity, id); log(state, identity, row.recordId, 'Cita consultada'); return { value: structuredClone({ ...decorated(state, row), history: state.audit.filter(a => a.appointmentId === id) }) }; }); },
  async create(identity, input) { await initialize(); return mutate(state => { const data = validated(state, identity, input); const row = { ...data, id: crypto.randomUUID(), createdAt: now(), updatedAt: now() }; state.appointments.push(row); log(state, identity, row.recordId, `Cita registrada · ${APPOINTMENT_STATES[row.status]}`); state.audit[0].appointmentId = row.id; return { value: row.id }; }); },
  async update(identity, id, input) { await initialize(); return mutate(state => { const row = requireAppointment(state, identity, id); if (row.status === 'cancelada') throw new Error('Esta cita está cancelada. Registrá una nueva cita si necesitás otro horario.'); const record = state.records.find(r => r.id === row.recordId); if (record.professionalId !== row.professionalId) throw new Error('El expediente cambió de responsable. Cancelá esta cita y registrá una nueva con la profesional actual.'); const data = validated(state, identity, { ...input, recordId: row.recordId }, id); Object.assign(row, data, { updatedAt: now() }); log(state, identity, row.recordId, `Cita actualizada · ${nicaraguaDate(row.startAt)} ${nicaraguaTime(row.startAt)} · ${APPOINTMENT_STATES[row.status]}`); state.audit[0].appointmentId = id; }); },
  async cancel(identity, id) { await initialize(); return mutate(state => { const row = requireAppointment(state, identity, id); if (row.status === 'cancelada') throw new Error('Esta cita ya estaba cancelada.'); row.status = 'cancelada'; row.updatedAt = now(); log(state, identity, row.recordId, 'Cita cancelada'); state.audit[0].appointmentId = id; }); },
};
