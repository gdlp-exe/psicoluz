import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://**', route => route.abort());
  await page.goto('/desarrollo/expedientes');
  await expect(page.getByRole('button', { name: 'Abrir expediente de Lucía Ejemplo', exact: true })).toBeVisible();
});

async function openLucia(page) {
  await page.getByRole('button', { name: 'Abrir expediente de Lucía Ejemplo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lucía Ejemplo', exact: true })).toBeVisible();
}

test('RF06 / RF07: asociación, numeración y campos mínimos en la vista local', async ({ page }) => {
  await page.getByRole('button', { name: 'Nuevo expediente', exact: true }).click();
  await page.getByRole('button', { name: 'Crear expediente', exact: true }).click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.getByLabel('Nombres *', { exact: true }).fill('Eva');
  await page.getByLabel('Apellidos *', { exact: true }).fill('Prueba ficticia');
  await page.getByLabel('Motivo de consulta *', { exact: true }).fill('Prueba automatizada con datos ficticios.');
  await page.getByRole('button', { name: 'Crear expediente', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Eva Prueba ficticia', exact: true })).toBeVisible();
  await expect(page.locator('.exp-detail-heading')).toContainText(`PSL-${new Date().getFullYear()}-0005`);
  await page.getByRole('button', { name: 'Todos los expedientes', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo expediente', exact: true }).click();
  await page.getByRole('button', { name: 'Paciente ya registrado', exact: true }).click();
  await page.getByLabel('Paciente *', { exact: true }).selectOption({ label: 'Eva Prueba ficticia' });
  await page.getByLabel('Motivo de consulta *', { exact: true }).fill('Segundo expediente del mismo paciente ficticio.');
  await page.getByRole('button', { name: 'Crear expediente', exact: true }).click();
  await expect(page.locator('.exp-detail-heading')).toContainText(`PSL-${new Date().getFullYear()}-0006`);
  const result = await page.evaluate(async () => {
    const { expedientesRepository: r, DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js');
    const rows = (await r.list(ids[0])).filter(v => v.patient.firstName === 'Eva');
    return { samePatient: rows[0].patientId === rows[1].patientId, assigned: rows.every(v => v.professionalId === ids[0].id) };
  });
  expect(result).toEqual({ samePatient: true, assigned: true });
});

test('RF08: los cinco estados permitidos conservan el motivo', async ({ page }) => {
  await openLucia(page);
  for (const [value, text] of Object.entries({ activo: 'Activo', en_espera: 'En espera', suspendido: 'Suspendido', alta: 'Alta', archivado: 'Archivado' })) {
    await page.getByRole('button', { name: 'Editar expediente', exact: true }).click();
    await page.getByLabel('Estado *', { exact: true }).selectOption(value);
    await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
    await expect(page.locator('.exp-detail-heading .exp-status')).toHaveText(text);
    await expect(page.locator('.exp-reason')).toContainText('Acompañamiento de los procesos de aprendizaje.');
  }
});

test('RF9 / RF03: nota reservada, confirmación familiar y lectura por administración', async ({ page }) => {
  await openLucia(page);
  await page.getByRole('tab', { name: 'Notas de sesión', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva nota', exact: true }).click();
  await page.getByLabel('Título *', { exact: true }).fill('Nota autorizada de prueba');
  await page.getByLabel('Contenido de la nota *', { exact: true }).fill('Contenido ficticio para la familia.');
  await expect(page.getByLabel('Visibilidad *', { exact: true })).toHaveValue('solo_psicologo');
  await page.getByLabel('Visibilidad *', { exact: true }).selectOption('paciente_tutor');
  await page.getByRole('button', { name: 'Guardar nota', exact: true }).click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Guardar nota', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nota autorizada de prueba', exact: true })).toBeVisible();
  await page.getByLabel('Perfil de prueba', { exact: true }).selectOption('admin-demo');
  await openLucia(page);
  await page.getByRole('tab', { name: 'Notas de sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Registro de sesión de ejemplo', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Nota autorizada de prueba', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nueva nota', exact: true })).toHaveCount(0);
});

test('RF10: tipo, fecha y resumen de evaluación se conservan al recargar', async ({ page }) => {
  await openLucia(page);
  await page.getByRole('tab', { name: 'Evaluaciones', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar evaluación', exact: true }).click();
  await page.getByLabel('Tipo *', { exact: true }).selectOption('Seguimiento');
  await page.getByLabel('Fecha *', { exact: true }).fill('2026-11-01');
  await page.getByLabel('Resumen del documento de trabajo *', { exact: true }).fill('Resumen ficticio conservado en el registro de evaluación.');
  await page.getByRole('button', { name: 'Guardar evaluación', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Evaluación seguimiento', exact: true })).toBeVisible();
  await page.reload(); await openLucia(page);
  await page.getByRole('tab', { name: 'Evaluaciones', exact: true }).click();
  await expect(page.getByText('Resumen ficticio conservado en el registro de evaluación.', { exact: true })).toBeVisible();
});

test('RF11: archivo interno, descarga, persistencia y autorización explícita', async ({ page }) => {
  await openLucia(page);
  await page.getByRole('tab', { name: 'Archivos', exact: true }).click();
  await page.getByRole('button', { name: 'Adjuntar archivo', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'ejemplo.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\narchivo ficticio') });
  await page.locator('dialog').getByRole('button', { name: 'Adjuntar archivo', exact: true }).click();
  await expect(page.locator('.exp-file .exp-visibility')).toHaveText('Interno');
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Descargar', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('ejemplo.pdf');
  await page.getByRole('button', { name: 'Cambiar visibilidad', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.locator('.exp-file .exp-visibility')).toHaveText('Interno');
  await page.getByRole('button', { name: 'Cambiar visibilidad', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar cambio', exact: true }).click();
  await expect(page.locator('.exp-file .exp-visibility')).toHaveText('Visible para la familia');
});

test('RF12 / RF03: búsqueda por nombre y número, aislamiento y denegación directa', async ({ page }) => {
  await page.getByLabel('Buscar expedientes').fill('lucia');
  await expect(page.locator('.exp-table tbody tr')).toHaveCount(1);
  await page.getByLabel('Buscar expedientes').fill('PSL-2026-0002');
  await expect(page.locator('.exp-table tbody tr')).toHaveCount(1);
  await page.getByLabel('Buscar expedientes').fill('Daniel');
  await expect(page.getByRole('heading', { name: 'No encontramos coincidencias' })).toBeVisible();
  await page.getByLabel('Perfil de prueba', { exact: true }).selectOption('pro-2');
  await expect(page.getByRole('button', { name: 'Abrir expediente de Daniel Demostración', exact: true })).toBeVisible();
  await expect(page.locator('.exp-table tbody tr')).toHaveCount(1);
  const denied = await page.evaluate(async () => {
    const { expedientesRepository: r, DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js');
    try { await r.open(ids[1], 'record-1'); return false; } catch { return true; }
  });
  expect(denied).toBe(true);
  await page.getByLabel('Perfil de prueba', { exact: true }).selectOption('dev-demo');
  await expect(page.getByRole('heading', { name: 'Sin acceso a expedientes clínicos', exact: true })).toBeVisible();
});

test('RF05: historial local conserva actor, acción y fecha', async ({ page }) => {
  await openLucia(page);
  await page.getByRole('button', { name: 'Editar expediente', exact: true }).click();
  await page.getByLabel('Motivo de consulta *', { exact: true }).fill('Motivo ficticio actualizado para comprobar el historial.');
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await page.getByRole('tab', { name: 'Historial', exact: true }).click();
  await expect(page.locator('.exp-timeline')).toContainText('Datos del paciente y expediente actualizados');
  await expect(page.locator('.exp-timeline')).toContainText('Ana Ejemplo');
  await expect(page.locator('.exp-timeline time').first()).toHaveAttribute('datetime', /\d{4}-\d\d-\d\dT/);
});

test('Revisión transversal: 360 px, teclado y ausencia de llamadas a Supabase', async ({ page }) => {
  const backend = []; page.on('request', r => { if (/supabase\.(co|com)/.test(r.url())) backend.push(r.url()); });
  await page.reload(); await page.setViewportSize({ width: 360, height: 1000 });
  await expect(page.getByRole('button', { name: 'Nuevo expediente', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await openLucia(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole('tab', { name: 'Resumen', exact: true }).focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Notas de sesión', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Nueva nota', exact: true }).click();
  await page.keyboard.press('Escape'); await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(backend).toEqual([]);
});
