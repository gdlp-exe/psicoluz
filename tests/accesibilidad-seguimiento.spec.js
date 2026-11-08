import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';
const require = createRequire(import.meta.url);

test('Seguimiento: revisión automática de etiquetas, estructura y contraste en pantallas y formularios', async ({ page }) => {
  await page.route('https://**', r => r.abort()); await page.goto('/desarrollo/seguimiento');
  await expect(page.locator('.sf-activity').first()).toBeVisible();
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  async function scan(label, selector = '#exp-content') {
    await page.locator(selector).evaluate(async el => { await Promise.all(el.getAnimations({ subtree: true }).filter(a => a.effect.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))); });
    const issues = await page.evaluate(async selector => {
      const result = await window.axe.run(document.querySelector(selector), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
      return result.violations.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target) }));
    }, selector);
    expect(issues, label).toEqual([]);
  }
  await scan('Actividades');
  await page.getByRole('button', { name: 'Asignar actividad', exact: true }).click(); await scan('Formulario de actividad', 'dialog[open]'); await page.keyboard.press('Escape');
  await page.getByLabel('Expediente de seguimiento').selectOption('record-1');
  for (const tab of ['Resumen del plan', 'Vista previa familiar']) { await page.getByRole('tab', { name: tab, exact: true }).click(); await scan(tab); }
  await page.getByRole('tab', { name: /Apoyo experimental/ }).click(); await scan('Apoyo vacío');
  await page.getByRole('button', { name: 'Preparar borradores', exact: true }).click(); await expect(page.locator('.sf-recommendation').first()).toBeVisible(); await scan('Apoyo con borrador');
  await page.locator('.sf-recommendation').first().getByRole('button', { name: 'Revisar o editar', exact: true }).click(); await scan('Revisión profesional', 'dialog[open]');
  // No automated scan certifies full WCAG conformity or replaces the agreed pilot inspection.
});

