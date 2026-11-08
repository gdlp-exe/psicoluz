import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const matrix = JSON.parse(readFileSync(new URL('../docs/verificacion-ers.json', import.meta.url), 'utf8'));
assert.equal(matrix.requerimientos.length, 40);
assert.equal(new Set(matrix.requerimientos.map(r => r.id)).size, 40);
for (const r of matrix.requerimientos) {
  assert.ok(r.enunciado && r.criterio_aceptacion && r.observacion, r.id);
  assert.ok(['T', 'I', 'D', 'A'].includes(r.metodo_ERS), r.id);
  if (r.cumplimiento_integral_acreditado) assert.ok(r.evidencia_integral, `${r.id}: se requiere evidencia integral real`);
}
console.log('Matriz íntegra: 40 IDs únicos, métodos y aceptación. Este control valida el registro, no acredita cumplimiento funcional.');
