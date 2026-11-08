import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://**', r => r.abort());
  await page.goto('/desarrollo/agenda');
  await expect(page.getByRole('heading', { name: 'Agenda y citas', exact: true })).toBeVisible();
  await expect(page.locator('.ag-week-grid')).toBeVisible();
});

async function inputFor(page, overrides = {}) {
  return page.evaluate(async overrides => { const { nicaraguaDate, addDays } = await import('/src/features/agenda/repository.js'); return { recordId: 'record-1', date: addDays(nicaraguaDate(), 14), time: '11:00', duration: 45, modality: 'presencial', status: 'confirmada', ...overrides }; }, overrides);
}
async function api(page, operation, input, id = '', identity = 0) {
  return page.evaluate(async ({ operation, input, id, identity }) => {
    const { agendaRepository: r } = await import('/src/features/agenda/repository.js');
    const { DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js');
    try { const value = operation === 'create' ? await r.create(ids[identity], input) : operation === 'update' ? await r.update(ids[identity], id, input) : operation === 'cancel' ? await r.cancel(ids[identity], id) : operation === 'open' ? await r.open(ids[identity], id) : await r.list(ids[identity]); return { ok: true, value }; }
    catch (e) { return { ok: false, message: e.message, code: e.code }; }
  }, { operation, input, id, identity });
}
async function form(page, input) {
  await page.getByRole('button', { name: 'Nueva cita', exact: true }).click();
  await page.getByLabel('Paciente y expediente *', { exact: true }).selectOption(input.recordId);
  await page.getByLabel('Fecha de la cita *', { exact: true }).fill(input.date);
  await page.getByLabel('Hora de inicio *', { exact: true }).fill(input.time);
  await page.getByLabel('Duración *', { exact: true }).selectOption(String(input.duration));
  await page.getByLabel('Modalidad *', { exact: true }).selectOption(input.modality);
}

test('RF13: registrar los datos obligatorios, hora Nicaragua y recarga', async ({ page }) => {
  const input = await inputFor(page, { modality: 'virtual', duration: 60 });
  await form(page, input); await page.getByRole('button', { name: 'Guardar cita', exact: true }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.getByLabel('Fecha de agenda')).toHaveValue(input.date);
  await expect(page.locator('.ag-day-aside')).toContainText('Lucía Ejemplo');
  const rows = (await api(page, 'list')).value.filter(a => a.startAt.startsWith(input.date));
  expect(rows).toHaveLength(1); expect(rows[0]).toMatchObject({ patientId: 'patient-1', professionalId: 'pro-1', recordId: 'record-1', modality: 'virtual', status: 'confirmada', duration: 60 });
  expect(rows[0].startAt.slice(11, 16)).toBe('17:00');
  await page.reload(); await page.getByLabel('Fecha de agenda').fill(input.date);
  await expect(page.locator('.ag-day-aside')).toContainText('Lucía Ejemplo');
});

test('RF13: validación de obligatorios y fechas imposibles', async ({ page }) => {
  await page.getByRole('button', { name: 'Nueva cita', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar cita', exact: true }).click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  const base = await inputFor(page);
  for (const patch of [{ recordId: 'inexistente' }, { date: '2026-02-30' }, { time: '25:00' }, { duration: -1 }, { modality: 'otra' }, { status: 'inventado' }]) expect((await api(page, 'create', { ...base, ...patch })).ok).toBe(false);
});

test('RF14: semana, lista y filtros de profesional/estado para administración', async ({ page }) => {
  await page.getByLabel('Perfil de prueba', { exact: true }).selectOption('admin-demo');
  await expect(page.locator('.ag-week-grid')).toBeVisible();
  await page.getByRole('button', { name: 'Lista', exact: true }).click();
  await expect(page.locator('.ag-list-view')).toContainText('Ana Ejemplo');
  await expect(page.locator('.ag-list-view')).toContainText('Elena Demostración');
  await page.getByLabel('Filtrar profesional').selectOption('pro-2');
  await expect(page.locator('.ag-list-view')).toContainText('Daniel Demostración');
  await expect(page.locator('.ag-list-view')).not.toContainText('Lucía Ejemplo');
  await page.getByLabel('Filtrar estado de citas').selectOption('cancelada');
  await expect(page.getByRole('heading', { name: 'No hay citas para esta búsqueda' })).toBeVisible();
});

test('RF15: impedir cruces exactos y parciales; aceptar citas contiguas', async ({ page }) => {
  const base = await inputFor(page, { duration: 60 });
  expect((await api(page, 'create', base)).ok).toBe(true);
  for (const time of ['11:00', '11:30', '10:45']) {
    const result = await api(page, 'create', { ...base, recordId: 'record-2', time });
    expect(result.ok).toBe(false); expect(result.code).toBe('SCHEDULE_CONFLICT');
  }
  expect((await api(page, 'create', { ...base, time: '12:00' })).ok).toBe(true);
});

test('RF15: mensaje de cruce en formulario y elección de otra disponibilidad', async ({ page }) => {
  const base = await inputFor(page, { duration: 60 }); await api(page, 'create', base);
  await form(page, { ...base, recordId: 'record-2', time: '11:15' });
  await page.getByRole('button', { name: 'Guardar cita', exact: true }).click();
  await expect(page.locator('dialog [role=alert]')).toContainText('cruce de horario');
  await page.getByLabel('Hora de inicio *', { exact: true }).fill('12:00');
  await page.getByRole('button', { name: 'Guardar cita', exact: true }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('RF15: reprogramar excluye la propia cita y rechaza otra ocupada', async ({ page }) => {
  const base = await inputFor(page), first = await api(page, 'create', base);
  await api(page, 'create', { ...base, recordId: 'record-2', time: '13:00' });
  expect((await api(page, 'update', base, first.value)).ok).toBe(true);
  expect((await api(page, 'update', { ...base, time: '13:00' }, first.value)).code).toBe('SCHEDULE_CONFLICT');
  expect((await api(page, 'update', { ...base, time: '14:00', modality: 'virtual' }, first.value)).ok).toBe(true);
  const updated = (await api(page, 'open', null, first.value)).value;
  expect(updated.startAt.slice(11, 16)).toBe('20:00'); expect(updated.history.some(h => h.action.includes('actualizada'))).toBe(true);
});

test('RF15: reprogramación desde la interfaz conserva paciente y profesional', async ({ page }) => {
  const base = await inputFor(page), created = await api(page, 'create', base);
  await page.reload(); await page.getByLabel('Fecha de agenda').fill(base.date);
  await page.locator('.ag-day-aside').getByRole('button', { name: /Ver cita de Lucía Ejemplo/ }).click();
  await page.getByRole('button', { name: 'Editar o reprogramar', exact: true }).click();
  await expect(page.getByLabel('Paciente y expediente *', { exact: true })).toBeDisabled();
  await page.getByLabel('Hora de inicio *', { exact: true }).fill('13:30');
  await page.getByLabel('Modalidad *', { exact: true }).selectOption('virtual');
  await page.getByRole('button', { name: 'Guardar cambios de cita', exact: true }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  const updated = (await api(page, 'open', null, created.value)).value;
  expect(updated).toMatchObject({ patientId: 'patient-1', professionalId: 'pro-1', modality: 'virtual' });
  expect(updated.startAt.slice(11, 16)).toBe('19:30');
});

test('RF14: una celda horaria precarga fecha y hora del formulario', async ({ page }) => {
  const base = await inputFor(page); await page.getByLabel('Fecha de agenda').fill(base.date);
  await page.getByRole('button', { name: `Agendar el ${base.date} a las 14:00`, exact: true }).click();
  await expect(page.getByLabel('Fecha de la cita *', { exact: true })).toHaveValue(base.date);
  await expect(page.getByLabel('Hora de inicio *', { exact: true })).toHaveValue('14:00');
  await page.keyboard.press('Escape');
});

test('RF15: cancelar conserva el registro y libera el horario', async ({ page }) => {
  const base = await inputFor(page), created = await api(page, 'create', base);
  await page.reload(); await page.getByLabel('Fecha de agenda').fill(base.date);
  await page.locator('.ag-day-aside').getByRole('button', { name: /Ver cita de Lucía Ejemplo/ }).click();
  await page.getByRole('button', { name: 'Cancelar cita', exact: true }).click();
  await page.getByRole('button', { name: 'Mantener cita', exact: true }).click();
  expect((await api(page, 'open', null, created.value)).value.status).toBe('confirmada');
  await page.getByRole('button', { name: 'Cancelar cita', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar cancelación', exact: true }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect((await api(page, 'open', null, created.value)).value.status).toBe('cancelada');
  expect((await api(page, 'create', base)).ok).toBe(true);
});

test('RF15: mismo horario permitido para distintas profesionales', async ({ page }) => {
  const base = await inputFor(page);
  expect((await api(page, 'create', base, '', 2)).ok).toBe(true);
  expect((await api(page, 'create', { ...base, recordId: 'record-4' }, '', 2)).ok).toBe(true);
  await page.getByLabel('Perfil de prueba', { exact: true }).selectOption('admin-demo');
  await page.getByLabel('Fecha de agenda').fill(base.date);
  await expect(page.locator('.ag-day-aside .ag-day-card')).toHaveCount(2);
});

test('RF15: pendientes ocupan horario y dos altas simultáneas se serializan localmente', async ({ page }) => {
  const base = await inputFor(page, { status: 'pendiente' });
  await api(page, 'create', base);
  expect((await api(page, 'create', { ...base, status: 'confirmada' })).code).toBe('SCHEDULE_CONFLICT');
  const results = await page.evaluate(async base => {
    const { agendaRepository: r } = await import('/src/features/agenda/repository.js'); const { DEMO_IDENTITIES: ids } = await import('/src/features/expedientes/repository.js');
    return (await Promise.allSettled([r.create(ids[0], { ...base, time: '15:00' }), r.create(ids[0], { ...base, time: '15:00' })])).map(r => r.status);
  }, base);
  expect(results.sort()).toEqual(['fulfilled', 'rejected']);
});

test('RF03 / RNF03: perfiles aislados y llamadas directas denegadas', async ({ page }) => {
  const base = await inputFor(page), created = await api(page, 'create', base);
  expect((await api(page, 'open', null, created.value, 1)).ok).toBe(false);
  expect((await api(page, 'cancel', null, created.value, 1)).ok).toBe(false);
  expect((await api(page, 'create', { ...base, recordId: 'record-4' })).ok).toBe(false);
  await page.getByLabel('Perfil de prueba', { exact: true }).selectOption('pro-2');
  await expect(page.locator('.ag-day-aside')).not.toContainText('Lucía Ejemplo');
  await page.getByLabel('Perfil de prueba', { exact: true }).selectOption('dev-demo');
  await expect(page.getByRole('heading', { name: 'Sin acceso a la agenda clínica' })).toBeVisible();
  expect((await api(page, 'list', null, '', 3)).value).toEqual([]);
});

test('Integración: pacientes nuevos de Expedientes aparecen en Agenda', async ({ page }) => {
  await page.getByRole('link', { name: /Expedientes/ }).first().click();
  await page.getByRole('button', { name: 'Nuevo expediente', exact: true }).click();
  await page.getByLabel('Nombres *', { exact: true }).fill('Celia');
  await page.getByLabel('Apellidos *', { exact: true }).fill('Prueba ficticia');
  await page.getByLabel('Motivo de consulta *', { exact: true }).fill('Datos ficticios de integración.');
  await page.getByRole('button', { name: 'Crear expediente', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Celia Prueba ficticia' })).toBeVisible();
  await page.getByRole('link', { name: /Agenda y citas/ }).click();
  await page.getByRole('button', { name: 'Nueva cita', exact: true }).click();
  await expect(page.getByLabel('Paciente y expediente *', { exact: true }).locator('option')).toContainText(['Seleccionar paciente', 'Lucía Ejemplo', 'Mateo Demostración', 'Sofía Ejemplo', 'Celia Prueba ficticia']);
});

test('Vista de desarrollo: teclado, 360 px, perfil entre módulos y Supabase pausado', async ({ page }) => {
  const backend = []; page.on('request', r => { if (/supabase\.(co|com)/.test(r.url())) backend.push(r.url()); });
  await page.reload();
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await page.setViewportSize({ width: 360, height: 1000 });
  await page.getByRole('button', { name: 'Nueva cita', exact: true }).click(); await page.keyboard.press('Escape'); await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Semana', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByLabel('Perfil de prueba', { exact: true }).selectOption('admin-demo');
  await page.goto('/desarrollo/expedientes'); await expect(page.getByLabel('Perfil de prueba', { exact: true })).toHaveValue('admin-demo');
  expect(backend).toEqual([]);
});
