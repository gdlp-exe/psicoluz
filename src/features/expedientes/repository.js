// Frontend adapter. Replace this contract with server-authorized Supabase calls.
// IndexedDB is for fictional development data, not clinical storage or authentication.
export const PROFESSIONALS = [{ id: 'pro-1', name: 'Ana Ejemplo' }, { id: 'pro-2', name: 'Elena Demostración' }];
export const DEMO_IDENTITIES = [
  { id: 'pro-1', name: 'Ana Ejemplo', role: 'psicologa', label: 'Psicóloga · Ana Ejemplo' },
  { id: 'pro-2', name: 'Elena Demostración', role: 'psicologa', label: 'Psicóloga · Elena Demostración' },
  { id: 'admin-demo', name: 'Administración de prueba', role: 'administracion', label: 'Administración' },
  { id: 'dev-demo', name: 'Desarrollo de prueba', role: 'desarrollo', label: 'Desarrollo · sin acceso clínico' },
];
export const STATES = { activo: 'Activo', en_espera: 'En espera', suspendido: 'Suspendido', alta: 'Alta', archivado: 'Archivado' };
export const VISIBILITY = { solo_psicologo: 'Solo psicóloga', equipo_clinico: 'Equipo autorizado', paciente_tutor: 'Visible para la familia' };
export const EVALUATION_TYPES = ['Inicial', 'Psicopedagógica', 'Seguimiento', 'Otra'];
const DB_NAME = 'psicoluz-expedientes-demo-v1';
const iso = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const clone = value => structuredClone(value);
function seed() {
  const patients = [
    { id: 'patient-1', firstName: 'Lucía', lastName: 'Ejemplo', birthDate: '2018-04-18', tutorName: 'María Ejemplo', tutorPhone: '', tutorRelation: 'Madre' },
    { id: 'patient-2', firstName: 'Mateo', lastName: 'Demostración', birthDate: '2016-09-03', tutorName: 'Carlos Demostración', tutorPhone: '', tutorRelation: 'Padre' },
    { id: 'patient-3', firstName: 'Sofía', lastName: 'Ejemplo', birthDate: '2019-02-12', tutorName: 'Laura Ejemplo', tutorPhone: '', tutorRelation: 'Madre' },
    { id: 'patient-4', firstName: 'Daniel', lastName: 'Demostración', birthDate: '2017-07-25', tutorName: 'Rosa Demostración', tutorPhone: '', tutorRelation: 'Tutora' },
  ];
  const records = patients.map((p, i) => ({ id: 'record-' + (i + 1), number: 'PSL-2026-' + String(i + 1).padStart(4, '0'), patientId: p.id, professionalId: i === 3 ? 'pro-2' : 'pro-1', reason: ['Acompañamiento de los procesos de aprendizaje.', 'Seguimiento psicopedagógico y organización de actividades.', 'Valoración inicial y orientación familiar.', 'Seguimiento del proceso de aprendizaje.'][i], state: ['activo', 'activo', 'en_espera', 'activo'][i], createdAt: '2026-11-01T14:00:00.000Z', updatedAt: '2026-11-05T15:30:00.000Z' }));
  return { patients, records, sequence: 4,
    notes: [
      { id: 'note-1', recordId: 'record-1', authorId: 'pro-1', date: '2026-11-05', title: 'Registro de sesión de ejemplo', body: 'Se revisó la organización de las actividades de trabajo. Este contenido es ficticio y se utiliza únicamente para revisar la interfaz.', visibility: 'solo_psicologo', createdAt: '2026-11-05T15:30:00.000Z', updatedAt: '2026-11-05T15:30:00.000Z' },
      { id: 'note-2', recordId: 'record-1', authorId: 'pro-1', date: '2026-11-03', title: 'Orientación de ejemplo para el hogar', body: 'Mantener un espacio tranquilo para revisar las actividades habilitadas por la profesional. Información ficticia.', visibility: 'paciente_tutor', createdAt: '2026-11-03T15:30:00.000Z', updatedAt: '2026-11-03T15:30:00.000Z' },
    ], evaluations: [{ id: 'evaluation-1', recordId: 'record-1', type: 'Inicial', date: '2026-11-01', summary: 'Documento de trabajo de ejemplo. Se registraron necesidades de acompañamiento para organizar el seguimiento. No corresponde a una evaluación real.', authorId: 'pro-1', createdAt: '2026-11-01T14:00:00.000Z' }], attachments: [], audit: [{ id: 'audit-seed', recordId: 'record-1', actor: 'Datos de demostración', action: 'Expediente de ejemplo creado', at: '2026-11-01T14:00:00.000Z' }] };
}
let dbPromise;
function db() {
  if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore('state'); request.result.createObjectStore('files'); };
    request.onerror = () => { dbPromise = null; reject(new Error('No se pudo abrir el almacenamiento de demostración. Revisá los permisos del navegador.')); };
    request.onsuccess = () => resolve(request.result);
  });
  return dbPromise;
}
async function read() {
  const database = await db();
  const value = await new Promise((resolve, reject) => { const r = database.transaction('state').objectStore('state').get('main'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
  if (value) return value;
  const initial = seed(); await persist(initial); return initial;
}
async function persist(state, blob) {
  const database = await db();
  return new Promise((resolve, reject) => { const tx = database.transaction(blob ? ['state', 'files'] : ['state'], 'readwrite'); tx.objectStore('state').put(state, 'main'); if (blob) tx.objectStore('files').put(blob.file, blob.id); tx.oncomplete = resolve; tx.onerror = () => reject(new Error('No se pudo guardar. Comprobá el espacio disponible del navegador.')); tx.onabort = () => reject(new Error('El guardado no se completó. Tus cambios no se confirmaron.')); });
}
let queue = Promise.resolve();
function mutate(fn) { const task = queue.then(async () => { const state = await read(); const result = await fn(state); await persist(state, result?.blob); return result?.value; }); queue = task.catch(() => {}); return task; }
function canRead(identity, record) { return identity.role === 'administracion' || (identity.role === 'psicologa' && identity.id === record.professionalId); }
function requireRecord(state, identity, id, clinical = false) {
  const record = state.records.find(r => r.id === id);
  if (!record || !canRead(identity, record)) throw new Error('No tenés acceso a este expediente con el perfil seleccionado.');
  if (clinical && (identity.role !== 'psicologa' || record.professionalId !== identity.id)) throw new Error('Solo la psicóloga responsable puede modificar este contenido.');
  return record;
}
function log(state, identity, recordId, action) { state.audit.unshift({ id: uid(), recordId, actor: identity.name, actorId: identity.id, action, at: iso() }); }
function touch(record) { record.updatedAt = iso(); }
function required(text, label, max = 4000) { const value = String(text || '').trim(); if (!value) throw new Error('Completá ' + label + '.'); if (value.length > max) throw new Error(label + ': máximo ' + max + ' caracteres.'); return value; }
function validDate(value, label, past = true) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || Number.isNaN(new Date(value).valueOf()) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error('Revisá ' + label + '.'); if (past && value > new Date().toLocaleDateString('en-CA')) throw new Error(label + ' no puede ser futura.'); return value; }
function patientData(input) { return { firstName: required(input.firstName, 'los nombres', 100), lastName: required(input.lastName, 'los apellidos', 100), birthDate: input.birthDate ? validDate(input.birthDate, 'la fecha de nacimiento') : '', tutorName: String(input.tutorName || '').trim().slice(0, 120), tutorPhone: String(input.tutorPhone || '').trim().slice(0, 30), tutorRelation: String(input.tutorRelation || '').trim().slice(0, 50) }; }
function professional(identity, id) { if (!PROFESSIONALS.some(p => p.id === id)) throw new Error('Seleccioná una profesional responsable.'); if (identity.role === 'psicologa' && id !== identity.id) throw new Error('Solo podés crear expedientes bajo tu responsabilidad.'); if (!['psicologa', 'administracion'].includes(identity.role)) throw new Error('Este perfil no puede crear expedientes.'); return id; }
function visibleNote(identity, note) { return identity.role === 'psicologa' || note.visibility !== 'solo_psicologo'; }
export const expedientesRepository = {
  async list(identity) { const state = await read(); return clone(state.records.filter(r => canRead(identity, r)).map(r => ({ ...r, patient: state.patients.find(p => p.id === r.patientId) }))); },
  async patients(identity) { const rows = await this.list(identity); return [...new Map(rows.map(r => [r.patient.id, r.patient])).values()]; },
  async open(identity, id) { return mutate(state => { const record = requireRecord(state, identity, id); log(state, identity, id, 'Expediente consultado'); return { value: clone({ ...record, patient: state.patients.find(p => p.id === record.patientId), notes: state.notes.filter(n => n.recordId === id && visibleNote(identity, n)), evaluations: identity.role === 'psicologa' ? state.evaluations.filter(e => e.recordId === id) : [], attachments: state.attachments.filter(f => f.recordId === id), audit: state.audit.filter(a => a.recordId === id) }) }; }); },
  async create(identity, input) { return mutate(state => { const professionalId = professional(identity, input.professionalId); let patientId;
    if (input.patientId) { const existing = state.patients.find(p => p.id === input.patientId); if (!existing || !state.records.some(r => r.patientId === existing.id && canRead(identity, r))) throw new Error('Seleccioná un paciente autorizado.'); patientId = existing.id; }
    else { const patient = { id: uid(), ...patientData(input) }; state.patients.push(patient); patientId = patient.id; }
    const reason = required(input.reason, 'el motivo de consulta'); if (!STATES[input.state]) throw new Error('Seleccioná un estado válido.');
    state.sequence++; const record = { id: uid(), number: `PSL-${new Date().getFullYear()}-${String(state.sequence).padStart(4, '0')}`, patientId, professionalId, reason, state: input.state, createdAt: iso(), updatedAt: iso() }; state.records.push(record); log(state, identity, record.id, 'Expediente creado y asociado a paciente y profesional'); return { value: record.id }; }); },
  async update(identity, id, input) { return mutate(state => { const record = requireRecord(state, identity, id); const professionalId = professional(identity, input.professionalId); const patient = state.patients.find(p => p.id === record.patientId); const data = patientData(input); const reason = required(input.reason, 'el motivo de consulta'); if (!STATES[input.state]) throw new Error('Estado inválido.'); Object.assign(patient, data); Object.assign(record, { reason, state: input.state, professionalId }); touch(record); log(state, identity, id, 'Datos del paciente y expediente actualizados'); }); },
  async saveNote(identity, id, input) { return mutate(state => { const record = requireRecord(state, identity, id, true); const visibility = input.visibility; if (!VISIBILITY[visibility]) throw new Error('Seleccioná la visibilidad.'); if (visibility === 'paciente_tutor' && !input.confirmVisible) throw new Error('Confirmá expresamente la visibilidad para la familia.'); const data = { title: required(input.title, 'el título', 160), body: required(input.body, 'el contenido de la nota', 12000), date: validDate(input.date, 'la fecha de sesión'), visibility, updatedAt: iso() }; if (input.id) { const note = state.notes.find(n => n.id === input.id && n.recordId === id); if (!note) throw new Error('La nota ya no está disponible.'); Object.assign(note, data); } else state.notes.unshift({ id: uid(), recordId: id, authorId: identity.id, createdAt: iso(), ...data }); touch(record); log(state, identity, id, `${input.id ? 'Nota actualizada' : 'Nota registrada'} · ${VISIBILITY[visibility]}`); }); },
  async addEvaluation(identity, id, input) { return mutate(state => { const record = requireRecord(state, identity, id, true); if (!EVALUATION_TYPES.includes(input.type)) throw new Error('Seleccioná el tipo de evaluación.'); const e = { id: uid(), recordId: id, authorId: identity.id, type: input.type, date: validDate(input.date, 'la fecha de evaluación'), summary: required(input.summary, 'el resumen de evaluación', 12000), createdAt: iso() }; state.evaluations.unshift(e); touch(record); log(state, identity, id, 'Evaluación registrada'); }); },
  async addFile(identity, id, input) { return mutate(state => { const record = requireRecord(state, identity, id, true); const file = input.file; if (!file || !file.size) throw new Error('Seleccioná un archivo que tenga contenido.'); if (file.size > 10 * 1024 * 1024) throw new Error('El archivo supera el límite de 10 MB de esta vista de desarrollo.'); if (!/\.(pdf|png|jpe?g|docx)$/i.test(file.name)) throw new Error('Formatos admitidos: PDF, PNG, JPG y DOCX.'); if (input.visiblePortal && !input.confirmVisible) throw new Error('Confirmá la visibilidad para la familia.'); const row = { id: uid(), recordId: id, name: file.name, size: file.size, type: file.type, visiblePortal: !!input.visiblePortal, authorId: identity.id, createdAt: iso() }; state.attachments.unshift(row); touch(record); log(state, identity, id, `Archivo adjuntado · ${row.visiblePortal ? 'Visible para la familia' : 'Interno'}`); return { blob: { file, id: row.id } }; }); },
  async setFileVisibility(identity, id, fileId, visible, confirmed) { return mutate(state => { requireRecord(state, identity, id, true); if (visible && !confirmed) throw new Error('Confirmá la visibilidad para la familia.'); const f = state.attachments.find(f => f.id === fileId && f.recordId === id); if (!f) throw new Error('No se encontró el archivo.'); f.visiblePortal = visible; log(state, identity, id, `Visibilidad de archivo cambiada · ${visible ? 'Familia' : 'Interno'}`); }); },
  async file(identity, id, fileId) { const state = await read(); requireRecord(state, identity, id); if (!state.attachments.some(f => f.id === fileId && f.recordId === id)) throw new Error('No se encontró el archivo en este expediente.'); const database = await db(); const blob = await new Promise((resolve, reject) => { const r = database.transaction('files').objectStore('files').get(fileId); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }); if (!blob) throw new Error('El contenido del archivo no está disponible.'); await mutate(s => { log(s, identity, id, 'Archivo descargado'); }); return blob; },
};

// Shared fictional store for the isolated development modules; never an authorization boundary.
export const developmentStore = { read, mutate, requireRecord, log };
