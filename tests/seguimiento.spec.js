import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://**', r => r.abort()); await page.goto('/desarrollo/seguimiento');
  await expect(page.getByRole('heading', { name: 'Seguimiento', exact: true })).toBeVisible();
  await expect(page.locator('.sf-activity').first()).toBeVisible();
});
async function api(page, operation, args = [], identity = 0) {
  return page.evaluate(async ({ operation, args, identity }) => { const { seguimientoRepository: r } = await import('/src/features/seguimiento/repository.js'); const { DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js'); try { return { ok: true, value: await r[operation](ids[identity], ...args) }; } catch (e) { return { ok: false, message: e.message }; } }, { operation, args, identity });
}
async function baseActivity(page, overrides = {}) {
  return page.evaluate(async overrides => { const { nicaraguaDate } = await import('/src/features/agenda/repository.js'); return { title: 'Actividad sintética de prueba', description: 'Descripción ficticia del plan.', instructions: 'Realizar una tarea breve con acompañamiento.', priority: 'alta', followUpDate: nicaraguaDate(), status: 'pendiente', visiblePortal: false, noteId: '', ...overrides }; }, overrides);
}
async function choose(page) { await page.getByLabel('Expediente de seguimiento').selectOption('record-1'); await expect(page.locator('.exp-loading')).toHaveCount(0); }
async function generate(page) { await choose(page); await page.getByRole('tab', { name: /Apoyo experimental/ }).click(); await page.getByRole('button', { name: 'Preparar borradores', exact: true }).click(); await expect(page.locator('.sf-recommendation').first()).toBeVisible(); }

test('RF16: asignar título, descripción, instrucciones, prioridad y fecha; persistir', async ({ page }) => {
  await page.getByRole('button', { name: 'Asignar actividad', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar actividad', exact: true }).click(); await expect(page.locator('dialog[open]')).toBeVisible();
  await page.getByLabel('Paciente y expediente *', { exact: true }).selectOption('record-1');
  await page.getByLabel('Título de la actividad *', { exact: true }).fill('Organizar una actividad de prueba');
  await page.getByLabel('Descripción *', { exact: true }).fill('Descripción sintética para revisar el formulario.');
  await page.getByLabel('Instrucciones *', { exact: true }).fill('Preparar los materiales y realizar los pasos indicados.');
  await page.getByLabel('Prioridad *', { exact: true }).selectOption('alta');
  await page.getByRole('button', { name: 'Guardar actividad', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Organizar una actividad de prueba', exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading', { name: 'Organizar una actividad de prueba', exact: true })).toBeVisible();
  const r = (await api(page, 'open', ['record-1'])).value.activities.find(a => a.title === 'Organizar una actividad de prueba');
  expect(r).toMatchObject({ priority: 'alta', status: 'pendiente', visiblePortal: false }); expect(r.followUpDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test('RF16/RF17: rechazar campos vacíos, fechas y estados no definidos', async ({ page }) => {
  const base = await baseActivity(page);
  for (const patch of [{ title: '' }, { description: '' }, { instructions: '' }, { followUpDate: '2026-02-30' }, { status: 'inventado' }, { priority: 'inventada' }]) expect((await api(page, 'saveActivity', ['record-1', { ...base, ...patch }])).ok).toBe(false);
});

test('RF17: permitir los cuatro estados y conservar historial', async ({ page }) => {
  for (const state of ['pendiente', 'en_proceso', 'cumplida', 'vencida']) {
    await page.getByLabel('Estado de Organizar una rutina breve', { exact: true }).selectOption(state);
    await expect(page.getByLabel('Estado de Organizar una rutina breve', { exact: true })).toHaveValue(state);
  }
  const data = (await api(page, 'open', ['record-1'])).value;
  expect(data.activities.find(a => a.id === 'activity-demo-0').status).toBe('vencida'); expect(data.history.some(h => h.action.includes('Estado de actividad actualizado'))).toBe(true);
});

test('RF18: autorización expresa y proyección sin actividades internas ni nota privada', async ({ page }) => {
  const base = await baseActivity(page, { visiblePortal: true, noteId: 'note-1' });
  expect((await api(page, 'saveActivity', ['record-1', base])).ok).toBe(false);
  expect((await api(page, 'saveActivity', ['record-1', { ...base, confirmVisible: true }])).ok).toBe(true);
  const projection = (await api(page, 'familyPreview', ['record-1'])).value;
  expect(projection.activities.some(a => a.title === base.title)).toBe(true);
  const raw = JSON.stringify(projection); expect(raw).not.toContain('note-1'); expect(raw).not.toContain('Registro de sesión de ejemplo'); expect(raw).not.toContain('Revisar instrucciones de una actividad');
  await choose(page); await page.getByRole('tab', { name: 'Vista previa familiar', exact: true }).click();
  await expect(page.getByRole('heading', { name: base.title, exact: true })).toBeVisible();
});

test('RF19: vincular nota del mismo expediente y rechazar otra', async ({ page }) => {
  const base = await baseActivity(page, { noteId: 'note-1' });
  expect((await api(page, 'saveActivity', ['record-1', base])).ok).toBe(true);
  expect((await api(page, 'saveActivity', ['record-2', base])).ok).toBe(false);
  const data = (await api(page, 'open', ['record-1'])).value; expect(data.activities.find(a => a.title === base.title).noteId).toBe('note-1');
});

test('RF03 / RF-AP01: denegar actividades y apoyo ajenos o a administración/desarrollo', async ({ page }) => {
  for (const actor of [1, 2, 3]) { expect((await api(page, 'open', ['record-1'], actor)).ok).toBe(false); expect((await api(page, 'generate', ['record-1'], actor)).ok).toBe(false); }
  await page.getByLabel('Perfil de prueba', { exact: true }).selectOption('admin-demo');
  await expect(page.getByRole('heading', { name: 'Seguimiento reservado a la profesional responsable' })).toBeVisible();
  expect((await api(page, 'list', [], 2)).value).toEqual([]);
});

test('RF-AP01: sin actividades no se inventan borradores', async ({ page }) => {
  const newId = await page.evaluate(async () => { const { expedientesRepository: r, DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js'); return r.create(ids[0], { firstName: 'Caso', lastName: 'Sin actividades', professionalId: 'pro-1', reason: 'Caso ficticio sin plan.', state: 'activo' }); });
  expect((await api(page, 'generate', [newId])).value).toBe(0);
  expect((await api(page, 'open', [newId])).value.recommendations).toEqual([]);
});

test('RF-AP03 / RF-AP04: aviso persistente y aceptación con texto editado y autorización', async ({ page }) => {
  await generate(page); await expect(page.getByText('Herramienta de apoyo. No diagnostica ni reemplaza el criterio de la profesional', { exact: true })).toBeVisible();
  expect((await api(page, 'familyPreview', ['record-1'])).value.recommendations).toEqual([]);
  const draft = (await api(page, 'open', ['record-1'])).value.recommendations[0];
  expect((await api(page, 'review', ['record-1', draft.id, { decision: 'aceptar', text: draft.text, confirmReview: false, visiblePortal: true, confirmVisible: true }])).ok).toBe(false);
  expect((await api(page, 'review', ['record-1', draft.id, { decision: 'aceptar', text: draft.text, confirmReview: true, visiblePortal: true, confirmVisible: false }])).ok).toBe(false);
  await page.locator('.sf-recommendation').first().getByRole('button', { name: 'Revisar o editar', exact: true }).click();
  const text = 'Podría revisarse la frecuencia del plan con la profesional y organizar una actividad breve.';
  await page.getByLabel('Texto revisado *', { exact: true }).fill(text);
  await page.getByRole('button', { name: 'Guardar revisión', exact: true }).click(); await expect(page.locator('dialog[open]')).toBeVisible();
  await page.locator('dialog input[type=checkbox]').first().check();
  await page.getByLabel('Destino del texto aceptado', { exact: true }).selectOption('family');
  await page.locator('dialog input[type=checkbox]').last().check();
  await page.getByRole('button', { name: 'Guardar revisión', exact: true }).click(); await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.locator('.sf-rating').first().getByRole('button', { name: 'Útil', exact: true }).click(); await expect(page.locator('.sf-rating').first().getByRole('button', { name: 'Útil', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const projection = (await api(page, 'familyPreview', ['record-1'])).value; expect(projection.recommendations).toHaveLength(1); expect(projection.recommendations[0].text).toBe(text); expect(Object.keys(projection.recommendations[0]).sort()).toEqual(['id', 'text']);
});

test('Contexto desde la pantalla: seleccionar una evaluación reciente y una habilidad', async ({ page }) => {
  await page.evaluate(async () => { const { expedientesRepository: r, DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js'); const { nicaraguaDate } = await import('/src/features/agenda/repository.js'); await r.addEvaluation(ids[0], 'record-1', { type: 'Seguimiento', date: nicaraguaDate(), summary: 'Evaluación sintética de interfaz.' }); });
  await choose(page); await page.getByRole('tab', { name: /Apoyo experimental/ }).click();
  await page.getByRole('button', { name: 'Seleccionar contexto', exact: true }).click();
  await page.locator('fieldset').filter({ hasText: 'Evaluación seguimiento' }).getByLabel('Práctica de lectura', { exact: true }).check();
  await page.getByRole('button', { name: 'Guardar contexto', exact: true }).click();
  await page.getByRole('button', { name: 'Preparar borradores', exact: true }).click();
  await expect(page.locator('.sf-recommendation').getByRole('heading', { name: 'Práctica de lectura', exact: true })).toBeVisible();
});

test('Revisión desde la pantalla: descarte queda en historial y no llega a la familia', async ({ page }) => {
  await generate(page); await page.locator('.sf-recommendation').first().getByRole('button', { name: 'Revisar o editar', exact: true }).click();
  await page.getByLabel('Decisión profesional').selectOption('descartar');
  await page.getByRole('button', { name: 'Confirmar descarte', exact: true }).click();
  await expect(page.locator('.sf-recommendation')).toHaveCount(0);
  await page.getByText('Revisiones anteriores y descartes', { exact: true }).click();
  await expect(page.locator('.sf-support-history')).toContainText('Descartada');
  expect((await api(page, 'familyPreview', ['record-1'])).value.recommendations).toEqual([]);
});

test('RF-AP03: datos cambiados retiran la publicación hasta actualizar y revisar', async ({ page }) => {
  await api(page, 'generate', ['record-1']); const row = (await api(page, 'open', ['record-1'])).value.recommendations[0];
  expect((await api(page, 'review', ['record-1', row.id, { decision: 'aceptar', text: row.text, visiblePortal: true, confirmReview: true, confirmVisible: true }])).ok).toBe(true);
  expect((await api(page, 'familyPreview', ['record-1'])).value.recommendations).toHaveLength(1);
  await api(page, 'setStatus', ['record-1', 'activity-demo-0', 'cumplida']);
  expect((await api(page, 'familyPreview', ['record-1'])).value.recommendations).toEqual([]);
  expect((await api(page, 'review', ['record-1', row.id, { decision: 'aceptar', text: row.text, confirmReview: true }])).ok).toBe(false);
  await api(page, 'generate', ['record-1']); const current = (await api(page, 'open', ['record-1'])).value.recommendations;
  expect(current.find(r => r.id === row.id).archived).toBe(true); expect(current.filter(r => !r.archived && r.status !== 'descartada').length).toBeLessThanOrEqual(3);
});

test('RF-AP02: texto diagnóstico no se acepta como apoyo ni se publica', async ({ page }) => {
  await api(page, 'generate', ['record-1']); const row = (await api(page, 'open', ['record-1'])).value.recommendations[0];
  const result = await api(page, 'review', ['record-1', row.id, { decision: 'aceptar', text: 'El niño presenta un diagnóstico automático.', confirmReview: true, visiblePortal: true, confirmVisible: true }]);
  expect(result.ok).toBe(false); expect((await api(page, 'familyPreview', ['record-1'])).value.recommendations).toEqual([]);
});

test('RF-AP05: desactivar solo un expediente y ocultar sus textos familiares', async ({ page }) => {
  await api(page, 'generate', ['record-1']); const row = (await api(page, 'open', ['record-1'])).value.recommendations[0];
  await api(page, 'review', ['record-1', row.id, { decision: 'aceptar', text: row.text, confirmReview: true, visiblePortal: true, confirmVisible: true }]);
  await api(page, 'configureSupport', ['record-1', { enabled: false }]);
  expect((await api(page, 'generate', ['record-1'])).ok).toBe(false); expect((await api(page, 'familyPreview', ['record-1'])).value.recommendations).toEqual([]);
  expect((await api(page, 'open', ['record-2'])).value.support.enabled).toBe(true);
});

test('RF-AP06 / RF-AP7: regeneración limitada, descarte y valoración revisada', async ({ page }) => {
  await page.evaluate(async () => { const { agendaRepository: a, nicaraguaDate } = await import('/src/features/agenda/repository.js'); const { DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js'); const id = await a.create(ids[0], { recordId: 'record-1', date: nicaraguaDate(), time: '18:00', duration: 30, status: 'confirmada', modality: 'presencial' }); await a.cancel(ids[0], id); });
  const noteId = await page.evaluate(async () => { const { expedientesRepository: r, DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js'); const { nicaraguaDate } = await import('/src/features/agenda/repository.js'); await r.saveNote(ids[0], 'record-1', { date: nicaraguaDate(), title: 'Observación sintética actual', body: 'Datos ficticios de la actividad para la prueba.', visibility: 'solo_psicologo' }); return (await r.open(ids[0], 'record-1')).notes[0].id; });
  await api(page, 'configureSupport', ['record-1', { enabled: true, sources: [{ type: 'note', id: noteId, tags: ['lectura'] }] }]);
  for (let i = 0; i < 4; i++) await api(page, 'generate', ['record-1']);
  let active = (await api(page, 'open', ['record-1'])).value.recommendations.filter(r => !r.archived && r.status !== 'descartada'); expect(active.length).toBeLessThanOrEqual(3);
  expect(active).toHaveLength(3); const r = active[0]; expect((await api(page, 'rate', ['record-1', r.id, 'util'])).ok).toBe(false);
  await api(page, 'review', ['record-1', r.id, { decision: 'descartar' }]);
  for (const rating of ['util', 'parcial', 'no_util']) expect((await api(page, 'rate', ['record-1', r.id, rating])).ok).toBe(true);
  expect((await api(page, 'rate', ['record-1', r.id, 'excelente'])).ok).toBe(false); expect((await api(page, 'open', ['record-1'])).value.recommendations.find(v => v.id === r.id).rating).toBe('no_util');
  expect((await api(page, 'familyPreview', ['record-1'])).value.recommendations).toEqual([]);
});

test('Contexto profesional: evaluación reciente etiquetada, sin texto clínico en exportación', async ({ page }) => {
  const evaluationId = await page.evaluate(async () => { const { expedientesRepository: r, DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js'); const { nicaraguaDate } = await import('/src/features/agenda/repository.js'); await r.addEvaluation(ids[0], 'record-1', { type: 'Seguimiento', date: nicaraguaDate(), summary: 'Resumen ficticio seleccionado para el caso de prueba.' }); return (await r.open(ids[0], 'record-1')).evaluations[0].id; });
  expect((await api(page, 'configureSupport', ['record-1', { enabled: true, sources: [{ type: 'evaluation', id: evaluationId, tags: ['lectura'] }] }])).ok).toBe(true);
  await api(page, 'generate', ['record-1']); const data = (await api(page, 'open', ['record-1'])).value;
  expect(data.context.tags).toContain('lectura'); expect(data.recommendations.some(r => r.ruleId === 'skill-lectura')).toBe(true);
  expect((await api(page, 'configureSupport', ['record-2', { enabled: true, sources: [{ type: 'evaluation', id: evaluationId, tags: ['lectura'] }] }])).ok).toBe(false);
  await choose(page); await page.getByRole('tab', { name: /Apoyo experimental/ }).click(); await page.getByText('Prueba local con datos sintéticos', { exact: true }).click();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: /Descargar casos sintéticos/ }).click(); expect((await download).suggestedFilename()).toBe('psicoluz-casos-sinteticos.jsonl');
});

test('Seguimiento: filtros, teclado, persistencia y vista adaptable sin Supabase', async ({ page }) => {
  const backend = []; page.on('request', r => { if (/supabase\.(co|com)/.test(r.url())) backend.push(r.url()); });
  await page.getByLabel('Filtrar cumplimiento').selectOption('cumplida'); await expect(page.locator('.sf-activity')).toHaveCount(1);
  await page.getByLabel('Filtrar cumplimiento').selectOption('all');
  for (const width of [360, 390, 768, 1024, 1440]) { await page.setViewportSize({ width, height: 1000 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true); }
  await page.getByRole('button', { name: 'Asignar actividad', exact: true }).click(); await page.keyboard.press('Escape'); await expect(page.locator('dialog[open]')).toHaveCount(0);
  await choose(page); await page.getByRole('tab', { name: 'Actividades', exact: true }).focus(); await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Resumen del plan', exact: true })).toBeFocused();
  expect(backend).toEqual([]);
});
