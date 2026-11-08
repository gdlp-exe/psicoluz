import { mkdir, writeFile } from 'node:fs/promises';
import { syntheticCases, MODEL_VERSION } from '../src/features/seguimiento/supportEngine.js';

const folder = new URL('../data/synthetic/', import.meta.url);
await mkdir(folder, { recursive: true });
const rows = syntheticCases();
for (const split of ['train', 'test']) {
  await writeFile(new URL(`${split}.jsonl`, folder), rows.filter(r => r.split === split).map(r => JSON.stringify(r)).join('\n') + '\n');
}
await writeFile(new URL('metadata.json', folder), JSON.stringify({
  modelVersion: MODEL_VERSION,
  synthetic: true,
  origin: 'Generated deterministically by code. No patient records, external APIs or clinical text.',
  features: ['recorded_overdue_ratio', 'completed_ratio', 'recent_cancelled_appointments_scaled', 'tag_organizacion', 'tag_instrucciones', 'tag_comunicacion', 'tag_lectura', 'tag_escritura', 'tag_autonomia'],
  trainingReferenceCases: 96,
  heldOutSoftwareTestCases: 24,
  clinicalValidation: false,
  llmTrained: false,
  intendedUse: 'Experimental local skill selection and software verification. Not a clinical dataset or efficacy evidence.',
}, null, 2) + '\n');
console.log('Exportados 96 casos sintéticos de referencia y 24 de prueba; no hay datos de pacientes.');
