export const SKILLS = {
  organizacion: 'Organización de tareas', instrucciones: 'Seguimiento de instrucciones',
  comunicacion: 'Comunicación durante la actividad', lectura: 'Práctica de lectura',
  escritura: 'Práctica de escritura', autonomia: 'Autonomía en la rutina',
};
export const MODEL_VERSION = 'synthetic-softmax-v2';
export const FEATURE_NAMES = ['recorded_overdue_ratio', 'completed_ratio', 'recent_cancelled_appointments_scaled', ...Object.keys(SKILLS).map(k => 'tag_' + k)];
// Preserve the original 120 artificial cases and their original train/test assignment.
export function syntheticCases() {
  const keys = Object.keys(SKILLS);
  return keys.flatMap((skill, j) => Array.from({ length: 20 }, (_, i) => ({
    caseId: `synthetic-${j}-${i}`, synthetic: true, split: i % 5 === 0 ? 'test' : 'train',
    features: [i % 7 / 6, (i * 3 % 5) / 4, i % 4 / 3, ...keys.map(k => k === skill ? 1 : 0)], target: skill,
  })));
}
