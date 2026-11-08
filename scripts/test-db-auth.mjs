import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { mapStaffProfile, PROFILE_DATABASE_FIELDS } from '../src/features/auth/contract.js';

test('Autorización del perfil de personal', async t => {
  const db = new PGlite({ extensions: { btree_gist } });
  const ids = ['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444'];
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
    for (const file of ['20261108000100_private_foundation.sql','20261108000200_staff_auth.sql']) await db.exec(await readFile(new URL('../supabase/migrations/'+file, import.meta.url),'utf8'));
    for (const id of ids) await db.query('insert into auth.users(id) values($1)',[id]);
    for (let i=0;i<3;i++) await db.query(`insert into psicoluz.staff_profiles(id,display_name,role) values($1,$2,$3)`,[ids[i],['Profesional','Administración','Desarrollo'][i],['psicologa','administracion','desarrollo'][i]]);
    const invoke = async (id, role='authenticated') => { await db.exec('begin'); try { await db.query(`select set_config('request.jwt.claim.sub',$1,true)`,[id]); await db.exec('set local role '+role); return (await db.query('select public.psicoluz_current_staff_profile() profile')).rows[0].profile; } finally { await db.exec('rollback'); } };
    await t.test('Anon no puede ejecutar la función de perfil', async () => { await assert.rejects(invoke(ids[0],'anon'), e=>e.code==='42501'); });
    await t.test('JWT sin identificador se rechaza', async () => { await assert.rejects(invoke(''),e=>e.code==='42501'); });
    await t.test('Los tres roles válidos conservan exactamente el contrato de columnas', async () => {
      for (let i=0;i<3;i++) { const row=await invoke(ids[i]); assert.deepEqual(Object.keys(row).sort(),[...PROFILE_DATABASE_FIELDS].sort()); const profile=mapStaffProfile(row,ids[i]); assert.equal(profile.role,['psicologa','administracion','desarrollo'][i]); }
    });
    await t.test('No acepta un ID ajeno como parámetro', async () => {
      await assert.rejects(db.query('select public.psicoluz_current_staff_profile($1)',[ids[1]]),e=>e.code==='42883');
      assert.equal((await invoke(ids[0])).id,ids[0]);
    });
    await t.test('Cuenta sin perfil y cuenta desactivada no obtienen autorización', async () => {
      assert.equal(await invoke(ids[3]),null); await db.query('update psicoluz.staff_profiles set active=false where id=$1',[ids[2]]); assert.equal(await invoke(ids[2]),null);
    });
    await t.test('No se concede lectura ni cambio de roles/expedientes al navegador', async () => {
      for(const role of ['anon','authenticated']) { const row=(await db.query(`select has_table_privilege($1,'psicoluz.staff_profiles','update') edit,has_table_privilege($1,'psicoluz.records','select') clinical`,[role])).rows[0]; assert.equal(row.edit,false); assert.equal(row.clinical,false); }
    });
    await t.test('El acceso al perfil queda en bitácora con actor autenticado', async () => {
      await db.query(`select set_config('request.jwt.claim.sub',$1,false)`,[ids[0]]); await db.exec('set role authenticated'); await db.query('select public.psicoluz_current_staff_profile()'); await db.exec('reset role');
      const log=(await db.query(`select actor_user_id,entity_id from psicoluz.audit_events where operation='STAFF_PROFILE_ACCESS' order by id desc limit 1`)).rows[0]; assert.equal(log.actor_user_id,ids[0]); assert.equal(log.entity_id,ids[0]);
    });
  } finally { await db.close(); }
});
