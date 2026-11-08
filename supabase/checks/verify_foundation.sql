-- Read-only verification for the NEW project. No patient data is selected.
with application_tables as (
  select c.relname,c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='psicoluz' and c.relkind='r'
)
select 'Tablas de PsicoLuz' as control,count(*)::text as resultado from application_tables
union all select 'Tablas con RLS activo',count(*)::text from application_tables where relrowsecurity
union all select 'Acceso anónimo al esquema',has_schema_privilege('anon','psicoluz','usage')::text
union all select 'Acceso directo de usuarios al esquema',has_schema_privilege('authenticated','psicoluz','usage')::text
union all select 'Políticas de acceso abiertas',count(*)::text from pg_policies where schemaname='psicoluz';
