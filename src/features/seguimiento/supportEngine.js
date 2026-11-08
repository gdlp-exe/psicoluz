// Experimental local skill selector. No free clinical text, names or diagnoses enter the model.
export const DISCLAIMER = 'Herramienta de apoyo. No diagnostica ni reemplaza el criterio de la profesional';
export const SKILLS = {
  organizacion: 'Organización de tareas',
  instrucciones: 'Seguimiento de instrucciones',
  comunicacion: 'Comunicación durante la actividad',
  lectura: 'Práctica de lectura',
  escritura: 'Práctica de escritura',
  autonomia: 'Autonomía en la rutina',
};
export const MODEL_VERSION = 'synthetic-knn-v1';
export const RULE_VERSION = 'plan-review-v1';
export const MODEL_INFO = { kind: 'Clasificador kNN local (k=3)', source: 'Casos sintéticos generados por código; no provienen de pacientes', syntheticReferenceCases: 96, llmTrained: false, clinicalValidation: false };
const skillKeys = Object.keys(SKILLS);
// A reproducible experimental dataset, with one structured skill cue per synthetic scenario.
// Train/test cases are disjoint by case ID. This is software-test data, not clinical evidence.
export function syntheticCases() {
  return skillKeys.flatMap((skill, j) => Array.from({ length: 20 }, (_, i) => ({
    caseId: `synthetic-${j}-${i}`,
    synthetic: true,
    split: i % 5 === 0 ? 'test' : 'train',
    features: [i % 7 / 6, (i * 3 % 5) / 4, i % 4 / 3, ...skillKeys.map(k => k === skill ? 1 : 0)],
    target: skill,
  })));
}
const trainingCases = syntheticCases().filter(r => r.split === 'train');
export function classifySkills(features, top = 2) {
  if (!Array.isArray(features) || features.length !== 9 || features.some(n => !Number.isFinite(n))) return [];
  // No recommendation without a professional-supplied skill cue.
  if (!features.slice(3).some(n => n > 0)) return [];
  const nearest = trainingCases.map(row => ({ skill: row.target, d: row.features.reduce((sum, value, i) => sum + (value - features[i]) ** 2 * (i >= 3 ? 5 : 1), 0) })).sort((a, b) => a.d - b.d).slice(0, 3);
  const votes = new Map(); for (const r of nearest) votes.set(r.skill, (votes.get(r.skill) || 0) + 1);
  return [...votes].sort((a, b) => b[1] - a[1]).map(([skill]) => skill).filter(skill => features[3 + skillKeys.indexOf(skill)] > 0).slice(0, top);
}
export const RULE_TEXTS = {
  plan: 'Podría ser útil revisar las actividades del plan cuyo cumplimiento sigue pendiente, su dificultad, frecuencia y acompañamiento en casa, antes de asignar nuevas tareas.',
  continuidad: 'Podría ser útil revisar la continuidad de las citas y acordar una rutina de seguimiento de las actividades con la familia.',
  revision: 'Podría ser útil revisar las instrucciones y la fecha de seguimiento del plan con la profesional antes de ajustar las actividades.',
};
export const SKILL_TEXTS = Object.fromEntries(skillKeys.map(skill => [skill, `Podría considerarse una actividad breve de ${SKILLS[skill].toLowerCase()}, seleccionada y adaptada por la profesional a los objetivos del plan de trabajo.`]));
export function safeSupportText(text) {
  return typeof text === 'string' && text.trim().length >= 12 && text.length <= 3000 && !/(diagn[oó]stic|pron[oó]stic|inteligencia|trastorno|d[eé]ficit|retraso|padece|autismo|\btdah\b|predicci[oó]n)/i.test(text);
}
export function buildProposals(context) {
  if (!context.total) return [];
  const rows = [];
  if (context.overdue > 0) rows.push({ ruleId: 'plan', title: 'Revisar el plan de actividades', text: RULE_TEXTS.plan, basis: `${context.active} actividades vigentes y ${context.overdue} vencidas registradas.`, origin: 'Regla de revisión del plan' });
  if (context.cancelledAppointments > 0) rows.push({ ruleId: 'continuidad', title: 'Revisar la continuidad del seguimiento', text: RULE_TEXTS.continuidad, basis: `${context.cancelledAppointments} citas canceladas en los últimos 90 días.`, origin: 'Regla de continuidad' });
  const vector = [context.overdue / Math.max(context.total, 1), context.completed / Math.max(context.total, 1), Math.min(context.cancelledAppointments, 3) / 3, ...skillKeys.map(k => context.tags.includes(k) ? 1 : 0)];
  for (const skill of classifySkills(vector)) rows.push({ ruleId: 'skill-' + skill, title: SKILLS[skill], text: SKILL_TEXTS[skill], basis: 'Etiqueta seleccionada expresamente por la profesional en el contexto de apoyo.', origin: MODEL_VERSION });
  if (!rows.length) rows.push({ ruleId: 'revision', title: 'Revisar el seguimiento del plan', text: RULE_TEXTS.revision, basis: `${context.total} actividades registradas; sin evidencia para inferir una evolución clínica.`, origin: 'Regla de revisión' });
  return rows.filter(r => safeSupportText(r.text)).slice(0, 3);
}
