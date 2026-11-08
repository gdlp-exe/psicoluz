// DTO projection only. Server authorization must happen before applying this contract.
export function safeResourceUrl(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; }
}
export function projectPortal(state, recordId, family, at = Date.now()) {
  const record = state.records.find(r => r.id === recordId);
  if (!record) throw new Error('No se pudo abrir el portal. Revisá el código o consultá al centro.');
  const patient = state.patients.find(p => p.id === record.patientId);
  const next = (state.appointments || []).filter(a => a.recordId === recordId && a.status === 'confirmada' && Date.parse(a.startAt) >= at).sort((a, b) => a.startAt.localeCompare(b.startAt))[0];
  return {
    greetingName: patient?.firstName || '',
    activities: family.activities,
    notes: state.notes.filter(n => n.recordId === recordId && n.visibility === 'paciente_tutor').map(n => ({ id: n.id, title: n.title, body: n.body, date: n.date })),
    files: state.attachments.filter(f => f.recordId === recordId && f.visiblePortal).map(f => ({ id: f.id, name: f.name, type: f.type, size: f.size })),
    links: (state.portalLinks || []).filter(l => l.recordId === recordId && l.visiblePortal && safeResourceUrl(l.url)).map(l => ({ id: l.id, title: l.title, description: l.description, url: safeResourceUrl(l.url) })),
    recommendations: family.recommendations,
    nextAppointment: next ? { startAt: next.startAt } : null,
    reports: (state.familyReports || []).filter(r => r.recordId === recordId && family.activities.some(a => a.id === r.activityId)).map(r => ({ id: r.id, activityId: r.activityId, outcome: r.outcome, message: r.message, at: r.at })),
  };
}
export const FAMILY_OUTCOMES = { realizada: 'La realizamos', intentada: 'La intentamos', ayuda: 'Necesitamos ayuda' };
