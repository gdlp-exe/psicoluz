import { test, expect } from '@playwright/test';

async function snapshot(page) {
  return page.evaluate(async () => {
    const { seguimientoRepository: r } = await import('/src/features/seguimiento/repository.js');
    const { DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js');
    const data = await r.open(ids[0], 'record-1');
    return { activities: data.activities, support: data.support, recommendations: data.recommendations, family: data.family };
  });
}
test.beforeEach(async ({ page }) => {
  await page.route('https://**', r => r.abort());
  await page.goto('/desarrollo/seguimiento?expediente=record-1');
  await expect(page.locator('.sf-activity').first()).toBeVisible();
  await page.getByRole('tab', { name: /Apoyo experimental/ }).click();
});

test('Beta guiada: modelo entrenado, pasos claros y ejemplo modificable sin guardar en expediente', async ({ page }) => {
  const before = await snapshot(page), calls = [];
  page.on('request', req => { if (/^https:/.test(req.url())) calls.push(req.url()); });
  await expect(page.getByText('Modelo entrenado · datos sintéticos', { exact: true })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Pasos para usar el apoyo' }).locator('>li')).toHaveCount(3);
  await page.getByRole('button', { name: 'Probar con un caso sintético', exact: true }).click();
  await page.getByRole('button', { name: 'Generar ejemplo', exact: true }).click();
  await expect(page.locator('.sf-example-results')).toContainText('Práctica de lectura');
  await expect(page.locator('.sf-example-results')).toContainText('4 actividades vigentes y 3 vencidas');
  await expect(page.locator('.sf-example-results')).toContainText('Propuesta del modelo entrenado');
  await page.getByLabel('Habilidad etiquetada en el ejemplo').selectOption('escritura');
  await expect(page.locator('.sf-example-results article')).toHaveCount(0);
  await page.getByRole('button', { name: 'Generar ejemplo', exact: true }).click();
  await expect(page.locator('.sf-example-results')).toContainText('Práctica de escritura');
  await expect(page.locator('.sf-example-results')).not.toContainText('Práctica de lectura');
  await page.getByLabel('Actividades vigentes del ejemplo').fill('0');
  await page.getByLabel('Actividades vencidas del ejemplo').fill('0');
  await page.getByRole('button', { name: 'Generar ejemplo', exact: true }).click();
  await expect(page.locator('.sf-example-results')).toContainText('Sin actividades no se generan propuestas');
  await page.keyboard.press('Escape');
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  expect(await snapshot(page)).toEqual(before); expect(calls).toEqual([]);
});

test('Beta guiada: paso de revisión conserva autorización y abre la vista familiar', async ({ page }) => {
  await page.getByRole('button', { name: 'Preparar borradores', exact: true }).click();
  await expect(page.locator('.sf-review-counts')).toContainText('1 pendientes');
  await page.getByRole('button', { name: 'Ver qué recibiría la familia', exact: false }).click();
  await expect(page.getByRole('tab', { name: 'Vista previa familiar', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.sf-family-recommendations')).toHaveCount(0);
});

test('Versión del modelo: cambios del motor invalidan textos previamente autorizados', async ({ page }) => {
  const outcome = await page.evaluate(async () => {
    const { seguimientoRepository: r } = await import('/src/features/seguimiento/repository.js');
    const { developmentStore: store, DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js');
    await r.generate(ids[0], 'record-1');
    const draft = (await r.open(ids[0], 'record-1')).recommendations[0];
    await r.review(ids[0], 'record-1', draft.id, { decision: 'aceptar', text: draft.text, confirmReview: true, visiblePortal: true, confirmVisible: true });
    await store.mutate(state => { const row = state.supportRecommendations.find(v => v.id === draft.id); const fp = JSON.parse(row.fingerprint); fp.modelVersion = 'old-model'; row.fingerprint = JSON.stringify(fp); });
    const family = await r.familyPreview(ids[0], 'record-1');
    await r.generate(ids[0], 'record-1');
    const updated = await r.open(ids[0], 'record-1');
    return { family, archived: updated.recommendations.find(v => v.id === draft.id).archived, current: updated.recommendations.filter(v => !v.archived) };
  });
  expect(outcome.family.recommendations).toEqual([]); expect(outcome.archived).toBe(true);
  expect(outcome.current.every(r => r.status === 'pendiente' && !r.visiblePortal && r.modelVersion === 'synthetic-softmax-v2')).toBe(true);
});
