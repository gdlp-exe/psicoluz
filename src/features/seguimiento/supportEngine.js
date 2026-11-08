// Trained synthetic-only classifier with a bounded, reviewable plan-rule layer.
import model from './model/model.json' with { type: 'json' };
import { SKILLS, MODEL_VERSION, syntheticCases } from './syntheticData.js';
import { softmaxScores } from './modelRuntime.js';
export { SKILLS, MODEL_VERSION, syntheticCases };
export const DISCLAIMER = 'Herramienta de apoyo. No diagnostica ni reemplaza el criterio de la profesional';
export const RULE_VERSION = 'plan-review-v1';
export const MODEL_INFO = { kind: 'Clasificador entrenado con datos sintéticos', version: model.version, trained: model.trained, trainingSamples: model.trainingSamples, testSamples: model.testSamples, heldOutCorrect: model.metrics.heldOut.correct, llmTrained: false, clinicalValidation: false };
const skillKeys = Object.keys(SKILLS);
export function classifySkills(features, top = 2) {
  if (!Number.isInteger(top) || top <= 0 || !Array.isArray(features) || features.length !== 9 || features.some(n => !Number.isFinite(n) || n < 0 || n > 1) || features.slice(3).some(n => n !== 0 && n !== 1)) return [];
  // Each selected tag is evaluated separately, matching the one-tag training domain.
  // The model never supplies an unselected tag, diagnosis or clinical score.
  return skillKeys.flatMap((skill, j) => {
    if (!features[3 + j]) return [];
    const oneTag = [...features.slice(0, 3), ...skillKeys.map((_, k) => k === j ? 1 : 0)];
    const scores = softmaxScores(model, oneTag);
    if (!scores.length || scores[j] !== Math.max(...scores)) return [];
    return [{ skill, score: scores[j] }];
  }).sort((a, b) => b.score - a.score).slice(0, top).map(row => row.skill);
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
  for (const skill of classifySkills(vector)) rows.push({ ruleId: 'skill-' + skill, title: SKILLS[skill], text: SKILL_TEXTS[skill], basis: 'Etiqueta seleccionada expresamente por la profesional en el contexto de apoyo.', origin: 'Modelo entrenado · ' + MODEL_VERSION });
  if (!rows.length) rows.push({ ruleId: 'revision', title: 'Revisar el seguimiento del plan', text: RULE_TEXTS.revision, basis: `${context.total} actividades registradas; sin evidencia para inferir una evolución clínica.`, origin: 'Regla de revisión' });
  return rows.filter(r => safeSupportText(r.text)).slice(0, 3);
}
