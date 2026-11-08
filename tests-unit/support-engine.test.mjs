import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProposals, classifySkills, DISCLAIMER, RULE_TEXTS, SKILL_TEXTS, safeSupportText, syntheticCases } from '../src/features/seguimiento/supportEngine.js';

const context = { total: 7, active: 4, overdue: 3, completed: 0, cancelledAppointments: 0, tags: [], sources: [] };
test('RF-AP01: 4 vigentes y 3 vencidas proponen revisar dificultad/frecuencia/acompañamiento', () => {
  const rows = buildProposals(context);
  assert.ok(rows.some(r => /dificultad/.test(r.text) && /frecuencia/.test(r.text) && /acompañamiento/.test(r.text)));
  assert.ok(rows[0].basis.includes('4 actividades vigentes y 3 vencidas'));
});
test('RF-AP01: sin actividades no se inventan recomendaciones aunque existan etiquetas', () => {
  assert.deepEqual(buildProposals({ ...context, total: 0, active: 0, overdue: 0, tags: ['lectura'] }), []);
});
test('RF-AP02 / RNF-ET01: catálogo en lenguaje del plan y posibilidad, sin diagnóstico', () => {
  for (const text of [...Object.values(RULE_TEXTS), ...Object.values(SKILL_TEXTS)]) { assert.ok(safeSupportText(text)); assert.match(text, /Podría/); }
  assert.equal(DISCLAIMER, 'Herramienta de apoyo. No diagnostica ni reemplaza el criterio de la profesional');
});
test('RF-AP02: salida clínica o pronóstico propuesto no pasa la revisión del apoyo', () => {
  for (const text of ['El niño padece un trastorno.', 'Esta salida es un diagnóstico automático.', 'Se predice un retraso del desarrollo.', 'Pronóstico de inteligencia.']) assert.equal(safeSupportText(text), false);
});
test('RF-AP06: múltiples señales no generan más de tres borradores', () => {
  const rows = buildProposals({ ...context, cancelledAppointments: 3, tags: ['lectura', 'organizacion', 'comunicacion'] });
  assert.ok(rows.length > 0 && rows.length <= 3);
});
test('Datos sintéticos: reproducibles, 96 referencia y 24 prueba sin IDs compartidos', () => {
  const cases = syntheticCases(); assert.deepEqual(cases, syntheticCases()); assert.equal(cases.length, 120);
  assert.equal(cases.filter(r => r.split === 'train').length, 96); assert.equal(cases.filter(r => r.split === 'test').length, 24);
  assert.equal(new Set(cases.map(r => r.caseId)).size, 120); assert.ok(cases.every(r => r.synthetic));
  assert.ok(cases.every(r => Object.keys(r).sort().join() === ['caseId', 'features', 'split', 'synthetic', 'target'].sort().join()));
});
test('Selector local: el conjunto artificial separado conserva la etiqueta esperada', () => {
  for (const row of syntheticCases().filter(r => r.split === 'test')) assert.equal(classifySkills(row.features)[0], row.target);
  // This is a deterministic software sanity check, not clinical validity or LLM accuracy.
});
test('Selector local: sin etiqueta profesional o con vector inválido no infiere habilidades', () => {
  assert.deepEqual(classifySkills([0, 0, 0, 0, 0, 0, 0, 0, 0]), []);
  assert.deepEqual(classifySkills([NaN]), []);
});
