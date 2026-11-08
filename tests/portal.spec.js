import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
async function enter(page, code = 'PL-DEMO-101') { await page.getByLabel('Código de acceso', { exact: true }).fill(code); await page.getByRole('button', { name: 'Abrir mi seguimiento', exact: true }).click(); await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible(); }
async function repository(page, operation, args = []) { return page.evaluate(async ({ operation, args }) => { const { portalRepository: repo } = await import('/src/features/portal/repository.js'); try { return { ok: true, value: await repo[operation](...args) }; } catch (e) { return { ok: false, error: e.message }; } }, { operation, args }); }
async function settings(page) { if (!(await page.locator('.pf-personalize').getAttribute('open') !== null)) await page.getByText('Personalizar lectura', { exact: true }).click(); }
test.beforeEach(async ({ page }) => { await page.route('https://**', r => r.abort()); await page.goto('/desarrollo/portal'); });

test('RF20/RF22: código válido sin cuenta; invalidación de sesión y rechazo genérico', async ({ page }) => {
  const a = await repository(page, 'enter', ['BAD']), b = await repository(page, 'enter', ['PSL-2026-0001']); expect(a).toEqual(b);
  await page.getByLabel('Código de acceso', { exact: true }).fill('BAD'); await page.getByRole('button', { name: 'Abrir mi seguimiento', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('No se pudo abrir');
  await enter(page); await expect(page.locator('.pf-activity')).toHaveCount(2); await expect(page.getByRole('heading', { name: 'Hola, Lucía.', exact: true })).toBeVisible();
  const token = (await repository(page, 'enter', ['PL-DEMO-101'])).value; await repository(page, 'leave', [token]); expect((await repository(page, 'view', [token])).ok).toBe(false);
  await page.getByRole('button', { name: 'Salir del portal', exact: true }).click(); await expect(page.locator('.pf-activity')).toHaveCount(0); await expect(page.getByLabel('Código de acceso', { exact: true })).toBeFocused();
});
test('RF03/RF04/RF18/RF21: proyección autorizada sin notas, evaluaciones ni actividades internas', async ({ page }) => {
  const token = (await repository(page, 'enter', ['PL-DEMO-101'])).value, dto = (await repository(page, 'view', [token, 'record-4'])).value;
  expect(dto.greetingName).toBe('Lucía'); expect(dto.activities).toHaveLength(2); expect(dto.notes).toHaveLength(1);
  const text = JSON.stringify(dto); expect(text).not.toContain('Registro de sesión de ejemplo'); expect(text).not.toContain('evaluations'); expect(text).not.toContain('authorId'); expect(text).not.toContain('recordId');
  await enter(page); await expect(page.locator('.pf-activity')).not.toContainText(['Compartir una lectura breve']);
  await page.getByRole('tab', { name: 'Orientaciones', exact: true }).click(); await expect(page.locator('.pf-note')).toContainText('Orientación de ejemplo para el hogar'); await expect(page.locator('main')).not.toContainText('Registro de sesión de ejemplo');
  if (dto.nextAppointment) expect(Object.keys(dto.nextAppointment)).toEqual(['startAt']);
  const other = (await repository(page, 'enter', ['PL-DEMO-404'])).value; expect((await repository(page, 'view', [other])).value.greetingName).toBe('Daniel');
});
test('RF23/RF24/RF25: tres tamaños, temas y preferencias conservadas durante la sesión', async ({ page }) => {
  await settings(page); const sizes = [];
  for (const name of ['Normal', 'Grande', 'Muy grande']) { await page.getByRole('button', { name, exact: true }).click(); sizes.push(await page.locator('.pf-app').evaluate(el => parseFloat(getComputedStyle(el).fontSize))); }
  expect(sizes[0]).toBeLessThan(sizes[1]); expect(sizes[1]).toBeLessThan(sizes[2]);
  await page.getByLabel('Colores de la pantalla').selectOption('contraste'); await page.getByLabel('Más espacio entre letras y líneas').check(); await page.getByLabel('Tipo de letra').selectOption('arial');
  await page.reload(); await settings(page); await expect(page.getByRole('button', { name: 'Muy grande', exact: true })).toHaveAttribute('aria-pressed', 'true'); await expect(page.getByLabel('Colores de la pantalla')).toHaveValue('contraste');
  await enter(page); await page.getByRole('tab', { name: 'Orientaciones', exact: true }).click(); await expect(page.locator('.pf-app')).toHaveClass(/pf-size-muy_grande/); await expect(page.locator('.pf-app')).toHaveClass(/pf-spaced/);
  await page.getByRole('button', { name: 'Salir del portal', exact: true }).click(); await expect(page.locator('.pf-app')).toHaveClass(/pf-theme-contraste/);
});
test('Personalización: vista sencilla, filtros, teclado y sin movimiento obligatorio', async ({ page }) => {
  await enter(page); await page.getByLabel('Mostrar actividades').selectOption('cumplidas'); await expect(page.locator('.pf-activity')).toHaveCount(1);
  await page.getByLabel('Mostrar actividades').selectOption('todas'); await page.getByLabel('Buscar una actividad', { exact: true }).fill('sin coincidencias'); await settings(page); await page.getByLabel('Vista sencilla: solo mis actividades', { exact: true }).check(); await expect(page.getByRole('tablist')).toHaveCount(0); await expect(page.locator('.pf-activity')).toHaveCount(2);
  await page.getByRole('button', { name: 'Ver todo el seguimiento', exact: true }).click(); await page.getByRole('tab', { name: 'Mis actividades', exact: true }).focus(); await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Orientaciones', exact: true })).toBeFocused();
  await expect(page.getByLabel('Reducir movimiento', { exact: true })).toBeChecked();
});
test('RF26: API ausente informa limitación y conserva las actividades', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); }); await page.reload(); await enter(page);
  await page.getByRole('button', { name: /Escuchar actividad:/ }).first().click(); await expect(page.getByRole('status')).toContainText('Este navegador no permite'); await expect(page.locator('.pf-activity')).toHaveCount(2);
});
test('RF26: lee solo actividad autorizada; pausa, reanuda y cancela al salir', async ({ page }) => {
  await page.addInitScript(() => { window.spoken = []; window.cancelCount = 0; Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: class { constructor(text) { this.text = text; } }, configurable: true }); Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [{ lang: 'es-NI', localService: true }], speak: u => window.spoken.push(u.text), cancel: () => window.cancelCount++, pause() {}, resume() {} }, configurable: true }); });
  await page.reload(); await enter(page); await page.getByRole('button', { name: /Escuchar actividad:/ }).first().click();
  const spoken = await page.evaluate(() => window.spoken.join('')); expect(spoken).toContain('Organizar una rutina breve'); expect(spoken).toContain('Revisar juntos los materiales'); expect(spoken).not.toContain('Registro de sesión');
  await page.getByRole('button', { name: 'Pausar', exact: true }).click(); await expect(page.getByRole('status')).toContainText('pausa'); await page.getByRole('button', { name: 'Continuar', exact: true }).click(); await expect(page.getByRole('status')).toContainText('reanudada'); await page.getByRole('tab', { name: 'Orientaciones', exact: true }).click(); await page.getByRole('tab', { name: 'Mis actividades', exact: true }).click(); await expect(page.getByRole('button', { name: 'Pausar', exact: true })).toBeDisabled(); await page.getByRole('button', { name: 'Salir del portal', exact: true }).click(); expect(await page.evaluate(() => window.cancelCount)).toBeGreaterThan(1);
});
test('Seguimiento familiar: comentario visible a profesional, sin cambiar estado clínico ni permitir reporte ajeno', async ({ page }) => {
  await enter(page); const card = page.locator('.pf-activity').first(); await card.getByText('Contar cómo nos fue', { exact: true }).click(); await card.getByLabel('¿Cómo les fue?', { exact: true }).selectOption('ayuda'); await card.getByLabel('Comentario para la profesional (opcional)').fill('Necesitamos revisar las instrucciones.'); await card.getByRole('button', { name: 'Enviar comentario', exact: true }).click(); await expect(card.getByRole('status')).toContainText('enviado');
  const token = (await repository(page, 'enter', ['PL-DEMO-101'])).value; expect((await repository(page, 'report', [token, 'activity-demo-5', { outcome: 'realizada' }])).ok).toBe(false); expect((await repository(page, 'report', [token, 'activity-demo-1', { outcome: 'realizada' }])).ok).toBe(false);
  const data = await page.evaluate(async () => { const { seguimientoRepository: r } = await import('/src/features/seguimiento/repository.js'); const { DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js'); return r.open(ids[0], 'record-1'); }); expect(data.reports[0].message).toContain('Necesitamos revisar'); expect(data.activities.find(a => a.id === 'activity-demo-0').status).toBe('en_proceso');
  await page.goto('/desarrollo/seguimiento?expediente=record-1'); await page.getByRole('tab', { name: 'Resumen del plan', exact: true }).click(); await expect(page.locator('.sf-feedback')).toContainText('Necesitamos revisar las instrucciones.');
});
test('RF11/RF21: archivos y enlaces autorizados; revocación impide descarga directa', async ({ page }) => {
  await repository(page, 'enter', ['PL-DEMO-101']);
  await page.evaluate(async () => { const { expedientesRepository: r, DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js'); const { seguimientoRepository: s } = await import('/src/features/seguimiento/repository.js'); await r.addFile(ids[0], 'record-1', { file: new File(['Documento ficticio'], 'Guia.pdf', { type: 'application/pdf' }), visiblePortal: true, confirmVisible: true }); await r.addFile(ids[0], 'record-1', { file: new File(['Privado'], 'Interno.pdf', { type: 'application/pdf' }), visiblePortal: false }); await s.saveLink(ids[0], 'record-1', { title: 'Recurso de prueba', url: 'https://example.org/guia', visiblePortal: true, confirmVisible: true }); });
  await enter(page); await page.getByRole('tab', { name: 'Mis recursos', exact: true }).click(); await expect(page.locator('.pf-resource')).toHaveCount(2); await expect(page.locator('main')).not.toContainText('Interno.pdf');
  const dl = page.waitForEvent('download'); await page.getByRole('button', { name: 'Descargar Guia.pdf', exact: true }).click(); expect((await dl).suggestedFilename()).toBe('Guia.pdf');
  await expect(page.getByRole('link', { name: /Abrir recurso: Recurso de prueba/ })).toHaveAttribute('rel', 'noopener noreferrer');
  const fileId = await page.evaluate(async () => { const { expedientesRepository: r, DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js'); const data = await r.open(ids[0], 'record-1'), file = data.attachments.find(f => f.name === 'Guia.pdf'); await r.setFileVisibility(ids[0], 'record-1', file.id, false, false); return file.id; });
  const token = (await repository(page, 'enter', ['PL-DEMO-101'])).value; expect((await repository(page, 'file', [token, fileId])).ok).toBe(false);
});
test('RF-AP03: portal recibe solo texto aceptado; borradores y datos cambiados nunca se publican', async ({ page }) => {
  await repository(page, 'enter', ['PL-DEMO-101']);
  const draft = await page.evaluate(async () => { const { seguimientoRepository: r } = await import('/src/features/seguimiento/repository.js'); const { DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js'); await r.generate(ids[0], 'record-1'); return (await r.open(ids[0], 'record-1')).recommendations[0]; });
  const token = (await repository(page, 'enter', ['PL-DEMO-101'])).value; expect((await repository(page, 'view', [token])).value.recommendations).toEqual([]);
  await page.evaluate(async id => { const { seguimientoRepository: r } = await import('/src/features/seguimiento/repository.js'); const { DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js'); await r.review(ids[0], 'record-1', id, { decision: 'aceptar', text: 'Podría revisarse una actividad breve con la familia.', visiblePortal: true, confirmReview: true, confirmVisible: true }); }, draft.id);
  await enter(page); await page.getByRole('tab', { name: 'Orientaciones', exact: true }).click(); await expect(page.locator('.pf-approved')).toContainText('Podría revisarse una actividad breve con la familia.'); await expect(page.locator('.pf-approved')).not.toContainText(draft.text);
  await page.evaluate(async () => { const { seguimientoRepository: r } = await import('/src/features/seguimiento/repository.js'); const { DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js'); await r.setStatus(ids[0], 'record-1', 'activity-demo-0', 'cumplida'); });
  await page.getByRole('button', { name: 'Actualizar contenido', exact: true }).click(); await expect(page.locator('.pf-approved')).toHaveCount(0);
});
test('Portal público permanece cerrado sin servidor, incluso en rutas antiguas', async ({ page }) => {
  const requests = []; page.on('request', r => { if (/supabase\.(co|com)/.test(r.url())) requests.push(r.url()); });
  for (const path of ['/expediente', '/expediente/record-1', '/portal']) { await page.goto(path); await page.getByLabel('Código de acceso', { exact: true }).fill('PL-DEMO-101'); await page.getByRole('button', { name: 'Abrir mi seguimiento', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('todavía no está disponible'); await expect(page.locator('.pf-activity')).toHaveCount(0); await expect(page.locator('.pf-demo')).toHaveCount(0); }
  expect(requests).toEqual([]);
});
test('RNF05/RNF06: contraste, teclado y reflujo con texto grande y espaciado en cuatro temas', async ({ page }) => {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  async function scan(label) { const violations = await page.evaluate(async () => (await window.axe.run(document.querySelector('.pf-app'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))); expect(violations, label).toEqual([]); }
  await settings(page); await scan('Acceso y ajustes'); await enter(page);
  await page.locator('.pf-report').first().getByText('Contar cómo nos fue', { exact: true }).click();
  for (const theme of ['institucional', 'contraste', 'oscuro', 'calido']) { await page.getByLabel('Colores de la pantalla').selectOption(theme); await scan(theme); }
  await page.getByRole('button', { name: 'Muy grande', exact: true }).click(); await page.getByLabel('Más espacio entre letras y líneas').check();
  for (const width of [320, 360, 390, 768, 1024, 1440]) { await page.setViewportSize({ width, height: 1000 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true); }
  await page.addStyleTag({ content: '.pf-app * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important } .pf-app p { margin-bottom: 2em !important }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole('tab', { name: 'Mis actividades', exact: true }).focus(); await page.keyboard.press('End'); await expect(page.getByRole('tab', { name: 'Mis recursos', exact: true })).toBeFocused();
  await scan('Recursos'); await page.keyboard.press('ArrowLeft'); await scan('Orientaciones');
});


test('Recursos: autorización explícita desde Seguimiento y rechazo de enlaces ejecutables', async ({ page }) => {
  await page.goto('/desarrollo/seguimiento?expediente=record-1');
  await page.getByRole('tab', { name: 'Enlaces', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo enlace', exact: true }).click();
  await page.getByLabel('Título del enlace *', { exact: true }).fill('Guía autorizada del ejemplo');
  await page.getByLabel('Dirección HTTPS *', { exact: true }).fill('https://example.org/actividad');
  await page.getByLabel('Mostrar el enlace en el portal familiar', { exact: true }).check();
  await page.getByRole('button', { name: 'Guardar enlace', exact: true }).click();
  await expect(page.locator('.sf-link-form')).toBeVisible();
  await page.getByLabel('Revisé el contenido y autorizo expresamente este recurso para la familia.', { exact: true }).check();
  await page.getByRole('button', { name: 'Guardar enlace', exact: true }).click();
  await expect(page.locator('.sf-link-card')).toContainText('Autorizado para la familia');
  const invalid = await page.evaluate(async () => { const { seguimientoRepository: r } = await import('/src/features/seguimiento/repository.js'); const { DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js'); try { await r.saveLink(ids[0], 'record-1', { title: 'No válido', url: 'javascript:alert(1)' }); return false; } catch { return true; } });
  expect(invalid).toBe(true);
  await page.goto('/desarrollo/portal'); await enter(page); await page.getByRole('tab', { name: 'Mis recursos', exact: true }).click();
  await expect(page.getByRole('link', { name: /Abrir recurso: Guía autorizada/ })).toBeVisible();
});

test('Preferencias: navegador sin almacenamiento y datos corruptos mantienen el portal usable', async ({ page }) => {
  await page.evaluate(() => sessionStorage.setItem('psicoluz-portal-reading-v1', '{bad-json'));
  await page.reload(); await settings(page); await expect(page.getByRole('button', { name: 'Normal', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('blocked'); }; });
  await page.reload(); await settings(page); await page.getByRole('button', { name: 'Grande', exact: true }).click(); await expect(page.locator('.pf-app')).toHaveClass(/pf-size-grande/); await expect(page.locator('.pf-settings-note')).toContainText('no permite conservarlos');
  await enter(page); await expect(page.locator('.pf-activity')).toHaveCount(2);
});
