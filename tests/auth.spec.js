import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const USER_ID = '11111111-1111-4111-8111-111111111111';
const URL_BASE = 'https://krrurcjowhgrkenkgtpf.supabase.co';
const password = 'Clave-ficticia-123';

async function backend(page, options = {}) {
  const now = Math.floor(Date.now()/1000);
  const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const token = `${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:USER_ID,role:'authenticated',aud:'authenticated',iat:now,exp:now+3600,iss:URL_BASE+'/auth/v1'})}.fictitious-test-signature`;
  const user = { id:USER_ID,email:'personal@example.org',role:'authenticated',aud:'authenticated',app_metadata:{provider:'email',providers:['email']},user_metadata:{role:'psicologa'},created_at:new Date().toISOString() };
  const state = { profile:{id:USER_ID,display_name:'Personal de prueba',role:options.role||'administracion',active:true}, calls:[], invalid:!!options.invalid, profileError:false };
  await page.route('**/*',async route=>{
    const request=route.request(), url=new URL(request.url()); if(url.origin==='http://127.0.0.1:5180') return route.continue();
    if(url.origin!==URL_BASE) return route.abort();
    state.calls.push({path:url.pathname,method:request.method(),body:request.postDataJSON()});
    if(url.pathname==='/auth/v1/token') return route.fulfill({status:state.invalid?400:200,json:state.invalid?{code:'invalid_credentials',msg:'Invalid login credentials'}:{access_token:token,token_type:'bearer',expires_in:3600,expires_at:now+3600,refresh_token:'fictitious-refresh-token',user}});
    if(url.pathname==='/auth/v1/user') return route.fulfill({status:200,json:user});
    if(url.pathname==='/auth/v1/logout') return route.fulfill({status:204,body:''});
    if(url.pathname==='/auth/v1/recover') return route.fulfill({status:200,json:{}});
    if(url.pathname==='/rest/v1/rpc/psicoluz_current_staff_profile') return route.fulfill({status:state.profileError?500:200,json:state.profileError?{message:'PRIVATE_SQL_MUST_NOT_LEAK'}:state.profile});
    return route.fulfill({status:404,json:{message:'Unexpected test request'}});
  });
  return state;
}
async function signIn(page) {
  await page.getByLabel('Correo electrónico',{exact:true}).fill('personal@example.org');
  await page.getByLabel('Contraseña',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Ingresar',exact:true}).click();
}

test('RF01/RF02: login individual, rol del servidor, persistencia de pestaña y cierre',async({page})=>{
  const state=await backend(page); await page.goto('/login'); await signIn(page);
  await expect(page.getByRole('heading',{name:'Hola, Personal de prueba.',exact:true})).toBeVisible(); await expect(page).toHaveURL(/\/personal$/);
  await expect(page.locator('.au-account-grid')).toContainText('Administración'); await expect(page.locator('.au-account-grid')).not.toContainText('Psicóloga');
  const sent=state.calls.find(c=>c.path==='/auth/v1/token').body; expect(sent).toEqual({email:'personal@example.org',password,gotrue_meta_security:{}});
  await page.reload(); await expect(page.getByRole('heading',{name:'Hola, Personal de prueba.',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click(); await expect(page.getByRole('heading',{name:'Iniciar sesión',exact:true})).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Sesión cerrada'); await expect(page.getByLabel('Contraseña',{exact:true})).toHaveValue('');
  const stored=await page.evaluate(()=>sessionStorage.getItem('psicoluz-staff-krrurcjowhgrkenkgtpf')); expect(stored).toBeNull();
});
test('RF01: credenciales inválidas no autentican ni revelan mensajes internos',async({page})=>{
  const state=await backend(page,{invalid:true}); await page.goto('/login'); await signIn(page);
  await expect(page.getByRole('alert')).toContainText('No pudimos iniciar sesión'); await expect(page.locator('.au-staff')).toHaveCount(0); await expect(page.getByLabel('Contraseña',{exact:true})).toHaveValue('');
  expect(state.calls.some(c=>c.path.includes('psicoluz_current'))).toBe(false);
});
test('RF02: perfil ausente, desactivado o con nombres antiguos falla cerrado',async({page})=>{
  const state=await backend(page); await page.goto('/login');
  for(const profile of [null,{id:USER_ID,display_name:'Prueba',role:'administracion',active:false},{id:USER_ID,nombres:'Prueba',rol:'administrador'}]) {
    state.profile=profile; await signIn(page); await expect(page.getByRole('alert')).toBeVisible(); await expect(page.locator('.au-staff')).toHaveCount(0);
  }
});
test('RF02: los tres roles usan el mismo contrato y no aceptan metadatos como permisos',async({page})=>{
  const state=await backend(page); await page.goto('/login');
  for(const [role,label] of [['psicologa','Psicóloga'],['administracion','Administración'],['desarrollo','Desarrollo']]) {
    state.profile={id:USER_ID,display_name:'Personal de prueba',role,active:true}; await signIn(page); await expect(page.locator('.au-account-grid')).toContainText(label); await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click(); await expect(page.getByRole('status')).toContainText('Sesión cerrada');
  }
});
test('Guardia: rutas privadas y antiguas requieren verificar la sesión; registro público deshabilitado',async({page})=>{
  const state=await backend(page);
  for(const path of ['/personal','/psicologo','/psicologo/expedientes','/admin','/recepcion','/register']) {
    await page.goto(path); await expect(page.getByRole('heading',{name:'Iniciar sesión',exact:true})).toBeVisible(); await expect(page.locator('.au-staff')).toHaveCount(0);
  }
  expect(state.calls.some(c=>c.path.includes('/rest/v1/perfil'))).toBe(false); expect(state.calls.some(c=>c.path==='/auth/v1/signup')).toBe(false);
});
test('Sesión: revocación del perfil y fallo de RPC retiran la vista protegida',async({page})=>{
  const state=await backend(page); await page.goto('/login'); await signIn(page); await expect(page.locator('.au-staff')).toBeVisible();
  state.profileError=true; await page.evaluate(()=>window.dispatchEvent(new Event('focus'))); await expect(page.locator('.au-staff')).toHaveCount(0); await expect(page.getByRole('alert')).toContainText('No se pudo verificar'); await expect(page.locator('main')).not.toContainText('PRIVATE_SQL');
});
test('Recuperación: respuesta genérica y contraseña solo con sesión verificada',async({page})=>{
  const state=await backend(page); await page.goto('/recuperar-acceso'); await page.getByLabel('Correo electrónico',{exact:true}).fill('personal@example.org'); await page.getByRole('button',{name:'Enviar enlace de recuperación',exact:true}).click(); await expect(page.getByRole('status')).toContainText('Si el correo tiene una cuenta'); expect(state.calls.some(c=>c.path==='/auth/v1/recover')).toBe(true);
  await page.goto('/actualizar-clave'); await expect(page.getByText('No hay una sesión válida para cambiar la contraseña.',{exact:true})).toBeVisible(); expect(state.calls.some(c=>c.path==='/auth/v1/user'&&c.method==='PUT')).toBe(false);
});
test('Contraseña: cambio confirmado, campos limpios y nueva autenticación requerida',async({page})=>{
  const state=await backend(page); await page.goto('/login'); await signIn(page); await expect(page.locator('.au-staff')).toBeVisible(); await page.goto('/actualizar-clave');
  await page.getByLabel('Nueva contraseña',{exact:true}).fill('Nueva-ficticia-456'); await page.getByLabel('Confirmar nueva contraseña',{exact:true}).fill('No-coincide-456'); await page.getByRole('button',{name:'Guardar contraseña',exact:true}).click(); await expect(page.getByRole('alert')).toContainText('no coinciden');
  await page.getByLabel('Confirmar nueva contraseña',{exact:true}).fill('Nueva-ficticia-456'); await page.getByRole('button',{name:'Guardar contraseña',exact:true}).click(); await expect(page.getByRole('status')).toContainText('Contraseña actualizada'); expect(state.calls.some(c=>c.path==='/auth/v1/user'&&c.method==='PUT')).toBe(true); await expect(page.locator('.au-staff')).toHaveCount(0);
});
test('Acceso: etiquetas, contraste, teclado y adaptación móvil',async({page})=>{
  await backend(page); await page.goto('/login'); await expect(page.getByRole('heading',{name:'Iniciar sesión',exact:true})).toBeVisible();
  await page.getByLabel('Contraseña',{exact:true}).fill(password); await page.getByRole('button',{name:'Mostrar contraseña',exact:true}).click(); await expect(page.getByLabel('Contraseña',{exact:true})).toHaveAttribute('type','text'); await page.getByRole('button',{name:'Ocultar contraseña',exact:true}).click();
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')}); const errors=await page.evaluate(async()=> (await window.axe.run(document.querySelector('.au-app'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))); expect(errors).toEqual([]);
  for(const width of [360,390,768,1440]) {await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
  await page.getByLabel('Correo electrónico',{exact:true}).focus(); await page.keyboard.press('Tab'); await expect(page.getByLabel('Contraseña',{exact:true})).toBeFocused();
});
