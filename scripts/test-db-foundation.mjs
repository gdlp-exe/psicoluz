import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';

test('Fundación PostgreSQL privada de PsicoLuz', async t => {
  const db = new PGlite({ extensions: { btree_gist } });
  await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
  const migration = await readFile(new URL('../supabase/migrations/20261108000100_private_foundation.sql', import.meta.url), 'utf8');
  const p1 = '11111111-1111-4111-8111-111111111111', p2 = '22222222-2222-4222-8222-222222222222', admin = '33333333-3333-4333-8333-333333333333';
  const one = async (sql, args = []) => (await db.query(sql, args)).rows[0];
  const reject = async (sql, args, code) => assert.rejects(db.query(sql, args), error => error.code === code);
  let r1, r2, patient1, patient2, note1, note2, a1, a2;
  const activity = (record, note = null, extra = '') => db.query(`insert into psicoluz.activities(record_id,title,description,instructions,follow_up_date,author_id,note_id ${extra}) values($1,'Actividad ficticia','Descripción de prueba','Instrucción de prueba',current_date,$2,$3) returning id`, [record, record === r1 ? p1 : p2, note]);
  const appointment = (record, professional, start, end, status = 'confirmada') => db.query(`insert into psicoluz.appointments(record_id,patient_id,professional_id,start_at,end_at,duration,modality,status,created_by) values($1,$2,$3,$4,$5,45,'presencial',$6,$3) returning id`, [record, record === r1 ? patient1 : patient2, professional, start, end, status]);
  const recommendation = async (record, rule) => one(`insert into psicoluz.support_recommendations(record_id,rule_id,title,draft_text,basis,model_version,rule_version,context_revision) select id,$2,'Revisión','Podría revisarse una actividad del plan.','Caso ficticio','test-v1','rule-v1',context_revision from psicoluz.records where id=$1 returning id`, [record, rule]);
  try {
    await t.test('Migración completa aplicada sin error', async () => { await db.exec(migration); });
    await t.test('15 tablas con RLS y sin políticas permisivas', async () => {
      const result = await db.query(`select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='psicoluz' and c.relkind='r'`);
      assert.equal(result.rows.length, 15); assert.ok(result.rows.every(r => r.relrowsecurity));
      assert.equal(Number((await one(`select count(*) n from pg_policies where schemaname='psicoluz'`)).n), 0);
    });
    await t.test('Sin privilegios de tablas/funciones para navegador', async () => {
      for (const role of ['anon','authenticated']) {
        assert.equal((await one(`select has_schema_privilege($1,'psicoluz','usage') allowed`, [role])).allowed, false);
        assert.equal((await one(`select has_table_privilege($1,'psicoluz.records','select') allowed`, [role])).allowed, false);
        assert.equal((await one(`select has_function_privilege($1,'psicoluz.next_record_number()','execute') allowed`, [role])).allowed, false);
      }
    });
    await db.query(`insert into auth.users values($1),($2),($3)`, [p1,p2,admin]);
    await db.query(`insert into psicoluz.staff_profiles(id,display_name,role) values($1,'Profesional Uno','psicologa'),($2,'Profesional Dos','psicologa'),($3,'Administración','administracion')`, [p1,p2,admin]);
    patient1 = (await one(`insert into psicoluz.patients(first_name,last_name,created_by) values('Paciente','Uno',$1) returning id`, [p1])).id;
    patient2 = (await one(`insert into psicoluz.patients(first_name,last_name,created_by) values('Paciente','Dos',$1) returning id`, [p2])).id;
    r1 = (await one(`insert into psicoluz.records(patient_id,professional_id,reason,created_by) values($1,$2,'Motivo ficticio',$2) returning id`, [patient1,p1])).id;
    r2 = (await one(`insert into psicoluz.records(patient_id,professional_id,reason,created_by) values($1,$2,'Motivo ficticio',$2) returning id`, [patient2,p2])).id;
    await t.test('RLS deniega incluso si se concediera SELECT por error', async () => {
      await db.exec(`begin; grant usage on schema psicoluz to anon; grant select on all tables in schema psicoluz to anon; set local role anon;`);
      assert.equal((await db.query('select * from psicoluz.records')).rows.length, 0); await db.exec('rollback;');
    });
    await t.test('Numeración única sin truncar números superiores a 9999', async () => {
      const rows = (await db.query('select number from psicoluz.records')).rows; assert.notEqual(rows[0].number,rows[1].number);
      await db.exec(`select setval('psicoluz.record_number_seq',10000,false)`);
      assert.match((await one(`select psicoluz.next_record_number() n`)).n, /-10000$/);
    });
    await t.test('No asigna responsables de administración', async () => {
      await reject(`insert into psicoluz.records(patient_id,professional_id,reason,created_by) values($1,$2,'Prueba',$2)`,[patient1,admin],'23514');
    });
    note1 = (await one(`insert into psicoluz.notes(record_id,title,body,date,author_id) values($1,'Privada','Contenido interno',current_date,$2) returning id`,[r1,p1])).id;
    note2 = (await one(`insert into psicoluz.notes(record_id,title,body,date,author_id) values($1,'Privada','Contenido interno',current_date,$2) returning id`,[r2,p2])).id;
    a1 = (await activity(r1,note1)).rows[0].id; a2 = (await activity(r2,note2)).rows[0].id;
    await t.test('Estados y campos obligatorios validados en SQL', async () => {
      await reject(`update psicoluz.activities set status='inventado' where id=$1`,[a1],'23514');
      await reject(`update psicoluz.activities set instructions='  ' where id=$1`,[a1],'23514');
      for(const status of ['pendiente','en_proceso','cumplida','vencida']) await db.query(`update psicoluz.activities set status=$2 where id=$1`,[a1,status]);
    });
    await t.test('Nota y actividad no pueden mezclar expedientes', async () => { await assert.rejects(activity(r1,note2), e => e.code === '23503'); });
    await t.test('Visibilidad familiar exige registro explícito de autorización', async () => {
      await reject(`update psicoluz.notes set visibility='paciente_tutor' where id=$1`,[note1],'23514');
      await reject(`update psicoluz.activities set visible_portal=true where id=$1`,[a1],'23514');
    });
    const first = (await appointment(r1,p1,'2027-01-01T15:00:00Z','2027-01-01T15:45:00Z')).rows[0].id;
    await t.test('Cruces exactos/parciales rechazados por exclusión GiST', async () => {
      await assert.rejects(appointment(r1,p1,'2027-01-01T15:00:00Z','2027-01-01T15:45:00Z'),e=>e.code==='23P01');
      await assert.rejects(appointment(r1,p1,'2027-01-01T15:30:00Z','2027-01-01T16:15:00Z'),e=>e.code==='23P01');
    });
    await t.test('Contigüidad y distintas profesionales permitidas', async () => {
      await appointment(r1,p1,'2027-01-01T15:45:00Z','2027-01-01T16:30:00Z');
      await appointment(r2,p2,'2027-01-01T15:00:00Z','2027-01-01T15:45:00Z');
    });
    await t.test('Cancelación libera horario y conserva cita', async () => {
      await db.query(`update psicoluz.appointments set status='cancelada' where id=$1`,[first]);
      await appointment(r1,p1,'2027-01-01T15:00:00Z','2027-01-01T15:45:00Z');
      assert.equal((await one('select status from psicoluz.appointments where id=$1',[first])).status,'cancelada');
    });
    const rec1 = await recommendation(r1,'first');
    await t.test('Borrador y texto nulo nunca pueden publicarse', async () => {
      await reject(`update psicoluz.support_recommendations set visible_portal=true where id=$1`,[rec1.id],'23514');
      await reject(`update psicoluz.support_recommendations set status='aceptada',reviewed_by=$2,reviewed_at=now(),visible_portal=true,reviewed_text=null where id=$1`,[rec1.id,p1],'23514');
    });
    await t.test('Máximo tres recomendaciones; descartar permite una nueva', async () => {
      await recommendation(r1,'second'); await recommendation(r1,'third');
      await assert.rejects(recommendation(r1,'fourth'),e=>e.code==='23514');
      await db.query(`update psicoluz.support_recommendations set status='descartada',reviewed_by=$2,reviewed_at=now() where id=$1`,[rec1.id,p1]);
      await recommendation(r1,'fourth');
    });
    const rec2 = await recommendation(r2,'review');
    await db.query(`update psicoluz.support_recommendations set status='aceptada',reviewed_by=$2,reviewed_at=now(),reviewed_text='Podría revisarse el plan con la familia.',visible_portal=true where id=$1`,[rec2.id,p2]);
    await t.test('Cambiar actividad archiva/retira automáticamente el texto publicado', async () => {
      await db.query(`update psicoluz.activities set status='cumplida' where id=$1`,[a2]);
      const row = await one(`select visible_portal,archived from psicoluz.support_recommendations where id=$1`,[rec2.id]); assert.equal(row.visible_portal,false); assert.equal(row.archived,true);
    });
    await t.test('Desactivar apoyo retira propuestas e impide nuevas', async () => {
      await db.query(`update psicoluz.records set support_enabled=false where id=$1`,[r1]);
      assert.equal(Number((await one(`select count(*) n from psicoluz.support_recommendations where record_id=$1 and not archived`,[r1])).n),0);
      await assert.rejects(recommendation(r1,'disabled'),e=>e.code==='23514');
    });
    await t.test('Sesión del portal no puede asociarse a otro expediente', async () => {
      const code = await one(`insert into psicoluz.portal_codes(record_id,code_hash,issued_by,expires_at) values($1,decode(repeat('ab',32),'hex'),$2,now()+interval '1 day') returning id`,[r1,p1]);
      await reject(`insert into psicoluz.portal_sessions(record_id,code_id,token_hash,expires_at) values($1,$2,decode(repeat('cd',32),'hex'),now()+interval '1 hour')`,[r2,code.id],'23503');
    });
    await t.test('Bitácora generada sin contenido clínico y de solo anexado', async () => {
      assert.ok(Number((await one('select count(*) n from psicoluz.audit_events')).n)>0);
      await reject(`update psicoluz.audit_events set operation='ALTERADO'`,[],'42501');
      await reject(`delete from psicoluz.audit_events`,[],'42501');
      await reject(`truncate psicoluz.audit_events`,[],'42501');
    });
  } finally { await db.close(); }
});
