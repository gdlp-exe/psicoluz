import test from 'node:test';
import assert from 'node:assert/strict';
import { projectPortal, safeResourceUrl } from '../src/features/portal/contract.js';
import { sanitizePreferences, DEFAULT_PREFERENCES } from '../src/features/portal/preferences.js';
import { createActivityReader } from '../src/features/portal/speech.js';

test('Portal DTO: solo notas/archivos/enlaces autorizados, sin metadatos clínicos ni otros expedientes', () => {
  const state = { records: [{ id: 'r', patientId: 'p', reason: 'SECRETO' }], patients: [{ id: 'p', firstName: 'Ejemplo', lastName: 'SECRETO', tutorPhone: 'SECRETO' }], notes: [{ id: 'private', recordId: 'r', visibility: 'solo_psicologo', body: 'SECRETO' }, { id: 'team', recordId: 'r', visibility: 'equipo_clinico', body: 'SECRETO' }, { id: 'public', recordId: 'r', visibility: 'paciente_tutor', title: 'Hogar', body: 'Autorizado', date: '2026-11-01', authorId: 'SECRETO' }], attachments: [{ id: 'hidden', recordId: 'r', visiblePortal: false, name: 'SECRETO' }, { id: 'f', recordId: 'r', visiblePortal: true, name: 'Autorizado.pdf', type: 'application/pdf', size: 10, authorId: 'SECRETO' }], portalLinks: [{ id: 'bad', recordId: 'r', visiblePortal: true, title: 'SECRETO', url: 'javascript:alert(1)' }, { id: 'other', recordId: 'other', visiblePortal: true, title: 'SECRETO', url: 'https://example.org' }], appointments: [{ recordId: 'r', status: 'confirmada', startAt: '2026-12-01T15:00:00Z', summary: 'SECRETO' }] };
  const dto = projectPortal(state, 'r', { activities: [], recommendations: [] }, Date.parse('2026-11-08'));
  assert.equal(dto.greetingName, 'Ejemplo'); assert.equal(dto.notes.length, 1); assert.equal(dto.files.length, 1); assert.deepEqual(dto.links, []);
  assert.deepEqual(Object.keys(dto.nextAppointment), ['startAt']); assert.ok(!JSON.stringify(dto).includes('SECRETO'));
});
test('Portal DTO: cita discreta solo confirmada/futura y sin inventar cita próxima', () => {
  const state = { records: [{ id: 'r', patientId: 'p' }], patients: [], notes: [], attachments: [], appointments: [{ recordId: 'r', status: 'cancelada', startAt: '2099-01-01' }, { recordId: 'r', status: 'confirmada', startAt: '2020-01-01' }] };
  assert.equal(projectPortal(state, 'r', { activities: [], recommendations: [] }).nextAppointment, null);
});
test('Enlaces: rechazo de esquemas ejecutables, credenciales y direcciones incompletas', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,bad', 'http://example.org', 'https://name:pass@example.org', '/relative', 'bad']) assert.equal(safeResourceUrl(url), null);
  assert.equal(safeResourceUrl('https://example.org/guia'), 'https://example.org/guia');
});
test('Preferencias: validación de valores y recuperación sin datos personales', () => {
  assert.deepEqual(sanitizePreferences(null), DEFAULT_PREFERENCES);
  assert.deepEqual(sanitizePreferences({ theme: 'evil', size: 'invalid', name: 'SECRETO' }), DEFAULT_PREFERENCES);
  assert.equal(sanitizePreferences({ theme: 'contraste', size: 'muy_grande', spacing: true }).size, 'muy_grande');
});
function fakeSpeech(voices = [{ lang: 'es-NI', localService: true }]) { const utterances = [], updates = []; let cancelled = 0; const env = { SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } }, speechSynthesis: { getVoices: () => voices, speak: u => utterances.push(u), pause() {}, resume() {}, cancel: () => cancelled++ } }; return { env, utterances, updates, get cancelled() { return cancelled; }, reader: createActivityReader(env, v => updates.push(v)) }; }
test('Lectura: API ausente y voz local ausente no impiden usar el portal', () => {
  let result; createActivityReader({}, v => { result = v; }).start('Actividad'); assert.equal(result.mode, 'unavailable');
  const f = fakeSpeech([{ lang: 'es', localService: false }]); f.reader.start('Actividad'); assert.equal(f.utterances.length, 0); assert.equal(f.updates.at(-1).mode, 'unavailable');
});
test('Lectura: texto largo completo, voz local, pausa y cancelación de cola anterior', () => {
  const f = fakeSpeech(), text = 'Instrucción autorizada. '.repeat(60); f.reader.start(text, 0.8);
  let i = 0; while (i < f.utterances.length) f.utterances[i++].onend();
  assert.equal(f.utterances.map(u => u.text).join(''), text); assert.equal(f.updates.at(-1).mode, 'idle');
  assert.ok(f.utterances.every(u => u.voice.localService && u.rate === 0.8));
  f.reader.start('Actividad nueva'); const stale = f.utterances.at(-1); f.reader.pause(); assert.equal(f.updates.at(-1).mode, 'paused'); f.reader.resume(); assert.equal(f.updates.at(-1).mode, 'reading');
  f.reader.stop(); const count = f.utterances.length; stale.onend(); assert.equal(f.utterances.length, count); assert.equal(f.updates.at(-1).mode, 'idle');
});
