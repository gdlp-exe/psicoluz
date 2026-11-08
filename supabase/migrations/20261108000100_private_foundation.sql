-- PsicoLuz / baseline 1. New empty project only. Transactional, no seed or DROP.
-- Closed foundation: no browser grants, API functions or RLS allow-policies yet.
-- Supabase Auth owns passwords. Never add a password column to these tables.
begin;
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
create schema psicoluz;
revoke all on schema psicoluz from public, anon, authenticated;
alter default privileges in schema psicoluz revoke all on tables from public, anon, authenticated;
alter default privileges in schema psicoluz revoke all on sequences from public, anon, authenticated;
alter default privileges in schema psicoluz revoke execute on functions from public, anon, authenticated;
set local search_path = pg_catalog, extensions;

create table psicoluz.staff_profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null check (length(trim(display_name)) between 1 and 120),
  role text not null check (role in ('psicologa','administracion','desarrollo')),
  active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table psicoluz.patients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (length(trim(first_name)) between 1 and 100),
  last_name text not null check (length(trim(last_name)) between 1 and 100),
  birth_date date check (birth_date <= current_date),
  tutor_name text not null default '' check (length(tutor_name) <= 120),
  tutor_phone text not null default '' check (length(tutor_phone) <= 30),
  tutor_relation text not null default '' check (length(tutor_relation) <= 50),
  created_by uuid not null references psicoluz.staff_profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create sequence psicoluz.record_number_seq;
create function psicoluz.next_record_number() returns text language plpgsql
  set search_path = pg_catalog as $$
declare n bigint := nextval('psicoluz.record_number_seq'::regclass);
begin return 'PSL-' || to_char(current_timestamp at time zone 'America/Managua','YYYY') || '-' || lpad(n::text,greatest(4,length(n::text)),'0'); end $$;
create table psicoluz.records (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default psicoluz.next_record_number(),
  patient_id uuid not null references psicoluz.patients(id),
  professional_id uuid not null references psicoluz.staff_profiles(id),
  reason text not null check (length(trim(reason)) between 1 and 4000),
  state text not null default 'activo' check (state in ('activo','en_espera','suspendido','alta','archivado')),
  context_revision bigint not null default 0 check (context_revision >= 0),
  support_enabled boolean not null default true,
  created_by uuid not null references psicoluz.staff_profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, patient_id, professional_id)
);
create table psicoluz.notes (
  id uuid primary key default gen_random_uuid(), record_id uuid not null references psicoluz.records(id),
  title text not null check (length(trim(title)) between 1 and 160),
  body text not null check (length(trim(body)) between 1 and 12000),
  date date not null check (date <= current_date),
  visibility text not null default 'solo_psicologo' check (visibility in ('solo_psicologo','equipo_clinico','paciente_tutor')),
  family_authorized_by uuid references psicoluz.staff_profiles(id), family_authorized_at timestamptz,
  author_id uuid not null references psicoluz.staff_profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (visibility <> 'paciente_tutor' or (family_authorized_by is not null and family_authorized_at is not null)),
  unique (id, record_id)
);
create table psicoluz.evaluations (
  id uuid primary key default gen_random_uuid(), record_id uuid not null references psicoluz.records(id),
  type text not null check (type in ('Inicial','Psicopedagógica','Seguimiento','Otra')),
  date date not null check (date <= current_date), summary text not null check (length(trim(summary)) between 1 and 12000),
  author_id uuid not null references psicoluz.staff_profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (id, record_id)
);
create table psicoluz.appointments (
  id uuid primary key default gen_random_uuid(), record_id uuid not null,
  patient_id uuid not null, professional_id uuid not null,
  start_at timestamptz not null, end_at timestamptz not null,
  duration integer not null check (duration in (15,30,45,60,90)),
  modality text not null check (modality in ('presencial','virtual')),
  status text not null default 'pendiente' check (status in ('pendiente','confirmada','atendida','cancelada')),
  created_by uuid not null references psicoluz.staff_profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (record_id, patient_id, professional_id) references psicoluz.records(id, patient_id, professional_id),
  check (end_at > start_at and end_at - start_at = duration * interval '1 minute'),
  check ((start_at at time zone 'America/Managua')::date = (end_at at time zone 'America/Managua')::date),
  exclude using gist (professional_id with =, tstzrange(start_at,end_at,'[)') with &&)
    where (status in ('pendiente','confirmada'))
);
create table psicoluz.activities (
  id uuid primary key default gen_random_uuid(), record_id uuid not null references psicoluz.records(id),
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null check (length(trim(description)) between 1 and 8000),
  instructions text not null check (length(trim(instructions)) between 1 and 8000),
  priority text not null default 'media' check (priority in ('baja','media','alta','urgente')),
  follow_up_date date not null,
  status text not null default 'pendiente' check (status in ('pendiente','en_proceso','cumplida','vencida')),
  visible_portal boolean not null default false,
  family_authorized_by uuid references psicoluz.staff_profiles(id), family_authorized_at timestamptz,
  note_id uuid, author_id uuid not null references psicoluz.staff_profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (note_id,record_id) references psicoluz.notes(id,record_id), unique (id,record_id),
  check (not visible_portal or (family_authorized_by is not null and family_authorized_at is not null))
);
create table psicoluz.attachments (
  id uuid primary key default gen_random_uuid(), record_id uuid not null references psicoluz.records(id),
  name text not null check (length(trim(name)) between 1 and 255 and name ~* '\.(pdf|png|jpe?g|docx)$'),
  mime_type text not null, size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  object_key text not null unique check (split_part(object_key,'/',1) = record_id::text),
  visible_portal boolean not null default false,
  family_authorized_by uuid references psicoluz.staff_profiles(id), family_authorized_at timestamptz,
  author_id uuid not null references psicoluz.staff_profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (not visible_portal or (family_authorized_by is not null and family_authorized_at is not null))
);
create table psicoluz.resource_links (
  id uuid primary key default gen_random_uuid(), record_id uuid not null references psicoluz.records(id),
  title text not null check (length(trim(title)) between 1 and 160), description text not null default '' check (length(description) <= 1000),
  url text not null check (length(url) <= 2000 and url ~ '^https://[^[:space:]]+$' and split_part(split_part(url,'://',2),'/',1) not like '%@%'),
  visible_portal boolean not null default false,
  family_authorized_by uuid references psicoluz.staff_profiles(id), family_authorized_at timestamptz,
  author_id uuid not null references psicoluz.staff_profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (not visible_portal or (family_authorized_by is not null and family_authorized_at is not null))
);
create table psicoluz.support_sources (
  id uuid primary key default gen_random_uuid(), record_id uuid not null references psicoluz.records(id),
  note_id uuid, evaluation_id uuid,
  tags text[] not null check (cardinality(tags) between 1 and 6 and tags <@ array['organizacion','instrucciones','comunicacion','lectura','escritura','autonomia']::text[]),
  selected_by uuid not null references psicoluz.staff_profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((note_id is null) <> (evaluation_id is null)),
  foreign key (note_id,record_id) references psicoluz.notes(id,record_id),
  foreign key (evaluation_id,record_id) references psicoluz.evaluations(id,record_id)
);
create table psicoluz.support_recommendations (
  id uuid primary key default gen_random_uuid(), record_id uuid not null references psicoluz.records(id),
  rule_id text not null, title text not null, draft_text text not null check (length(trim(draft_text)) between 12 and 3000),
  basis text not null, model_version text not null, rule_version text not null,
  context_revision bigint not null check (context_revision >= 0),
  status text not null default 'pendiente' check (status in ('pendiente','aceptada','descartada')),
  archived boolean not null default false, visible_portal boolean not null default false,
  reviewed_text text, reviewed_by uuid references psicoluz.staff_profiles(id), reviewed_at timestamptz,
  rating text check (rating in ('util','parcial','no_util')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (status = 'pendiente' or (reviewed_by is not null and reviewed_at is not null)),
  check (not visible_portal or (status = 'aceptada' and not archived and reviewed_by is not null and reviewed_at is not null and reviewed_text is not null and length(trim(reviewed_text)) >= 12)),
  check (rating is null or status <> 'pendiente')
);
create table psicoluz.portal_codes (
  id uuid primary key default gen_random_uuid(), record_id uuid not null references psicoluz.records(id),
  code_hash bytea not null unique check (octet_length(code_hash) = 32),
  issued_by uuid not null references psicoluz.staff_profiles(id),
  created_at timestamptz not null default now(), expires_at timestamptz not null, revoked_at timestamptz,
  check (expires_at > created_at), unique (id,record_id)
);
create table psicoluz.portal_sessions (
  id uuid primary key default gen_random_uuid(), record_id uuid not null references psicoluz.records(id), code_id uuid not null,
  token_hash bytea not null unique check (octet_length(token_hash) = 32),
  created_at timestamptz not null default now(), expires_at timestamptz not null, revoked_at timestamptz,
  foreign key (code_id,record_id) references psicoluz.portal_codes(id,record_id),
  check (expires_at > created_at), unique (id,record_id)
);
create table psicoluz.family_reports (
  id uuid primary key default gen_random_uuid(), record_id uuid not null references psicoluz.records(id), activity_id uuid not null, session_id uuid not null,
  outcome text not null check (outcome in ('realizada','intentada','ayuda')),
  message text not null default '' check (length(message) <= 500), created_at timestamptz not null default now(),
  foreign key (activity_id,record_id) references psicoluz.activities(id,record_id),
  foreign key (session_id,record_id) references psicoluz.portal_sessions(id,record_id)
);
create table psicoluz.audit_events (
  id bigint generated always as identity primary key, at timestamptz not null default clock_timestamp(),
  actor_user_id uuid references auth.users(id), operation text not null, entity text not null, entity_id uuid
);

-- Clinical assignment must refer to an active professional, not an admin/developer.
create function psicoluz.check_record_professional() returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  if tg_op = 'INSERT' or new.professional_id is distinct from old.professional_id then
    if not exists (select 1 from psicoluz.staff_profiles p where p.id = new.professional_id and p.role = 'psicologa' and p.active) then
      raise exception 'La responsable debe ser una psicóloga activa.' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;
create trigger check_professional before insert or update on psicoluz.records for each row execute function psicoluz.check_record_professional();

-- Lock the aggregate before counting: at most three active recommendations, even under concurrent writes.
create function psicoluz.guard_recommendation() returns trigger language plpgsql set search_path = pg_catalog as $$
declare revision bigint; enabled boolean;
begin
  if tg_op = 'UPDATE' and new.record_id <> old.record_id then raise exception 'No se puede trasladar una recomendación.' using errcode = '23514'; end if;
  select r.context_revision,r.support_enabled into revision,enabled from psicoluz.records r where r.id = new.record_id for update;
  if not new.archived and new.status <> 'descartada' then
    if (select count(*) from psicoluz.support_recommendations s where s.record_id = new.record_id and not s.archived and s.status <> 'descartada' and s.id <> new.id) >= 3 then
      raise exception 'Máximo tres recomendaciones activas por expediente.' using errcode = '23514';
    end if;
    if not enabled then raise exception 'Apoyo desactivado.' using errcode = '23514'; end if;
    if new.context_revision <> revision then raise exception 'El contexto del plan cambió.' using errcode = '23514'; end if;
  end if;
  if new.visible_portal and (not enabled or new.context_revision <> revision) then raise exception 'Requiere actualización y revisión.' using errcode = '23514'; end if;
  return new;
end $$;
create trigger guard_recommendation before insert or update on psicoluz.support_recommendations for each row execute function psicoluz.guard_recommendation();

create function psicoluz.bump_context() returns trigger language plpgsql set search_path = pg_catalog as $$
declare target uuid;
begin
  if tg_op = 'DELETE' then target := old.record_id; else target := new.record_id; end if;
  if tg_op = 'UPDATE' and new.record_id <> old.record_id then raise exception 'No se puede trasladar contenido clínico.' using errcode = '23514'; end if;
  update psicoluz.records set context_revision = context_revision + 1 where id = target;
  update psicoluz.support_recommendations set archived = true, visible_portal = false where record_id = target and not archived;
  return null;
end $$;
create function psicoluz.touch_updated_at() returns trigger language plpgsql set search_path = pg_catalog as $$
begin new.updated_at := now(); return new; end $$;
create function psicoluz.audit_change() returns trigger language plpgsql security definer set search_path = pg_catalog as $$
declare target uuid;
begin
  if tg_op = 'DELETE' then target := old.id; else target := new.id; end if;
  insert into psicoluz.audit_events(actor_user_id,operation,entity,entity_id) values(auth.uid(),tg_op,tg_table_name,target);
  return null;
end $$;
create function psicoluz.audit_append_only() returns trigger language plpgsql set search_path = pg_catalog as $$
begin raise exception 'La bitácora es de solo anexado.' using errcode = '42501'; end $$;
create trigger audit_append_only before update or delete on psicoluz.audit_events for each row execute function psicoluz.audit_append_only();
create trigger audit_no_truncate before truncate on psicoluz.audit_events for each statement execute function psicoluz.audit_append_only();

create function psicoluz.disable_support() returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  if not new.support_enabled then
    update psicoluz.support_recommendations set archived = true,visible_portal = false where record_id = new.id and not archived;
  end if;
  return null;
end $$;
create trigger disable_support after update of support_enabled on psicoluz.records for each row execute function psicoluz.disable_support();

do $$ declare t text; begin
  foreach t in array array['staff_profiles','patients','records','notes','evaluations','appointments','activities','attachments','resource_links','support_sources','support_recommendations','portal_codes','portal_sessions','family_reports','audit_events'] loop
    execute format('alter table psicoluz.%I enable row level security',t);
    execute format('revoke all on table psicoluz.%I from public, anon, authenticated',t);
    if t <> 'audit_events' then execute format('create trigger audit_change after insert or update or delete on psicoluz.%I for each row execute function psicoluz.audit_change()',t); end if;
  end loop;
  foreach t in array array['staff_profiles','patients','records','notes','evaluations','appointments','activities','attachments','resource_links','support_sources','support_recommendations'] loop
    execute format('create trigger touch_updated_at before update on psicoluz.%I for each row execute function psicoluz.touch_updated_at()',t);
  end loop;
  foreach t in array array['notes','evaluations','appointments','activities','support_sources'] loop
    execute format('create trigger bump_context after insert or update or delete on psicoluz.%I for each row execute function psicoluz.bump_context()',t);
  end loop;
end $$;
revoke all on all sequences in schema psicoluz from public, anon, authenticated;
revoke execute on all functions in schema psicoluz from public, anon, authenticated;

create index records_professional_idx on psicoluz.records(professional_id);
create index records_patient_idx on psicoluz.records(patient_id);
create index notes_record_date_idx on psicoluz.notes(record_id,date desc);
create index evaluations_record_date_idx on psicoluz.evaluations(record_id,date desc);
create index appointments_record_time_idx on psicoluz.appointments(record_id,start_at);
create index activities_record_date_idx on psicoluz.activities(record_id,follow_up_date);
create index attachments_record_idx on psicoluz.attachments(record_id);
create index links_record_idx on psicoluz.resource_links(record_id);
create index sources_record_idx on psicoluz.support_sources(record_id);
create index recommendations_record_idx on psicoluz.support_recommendations(record_id);
create index reports_record_idx on psicoluz.family_reports(record_id,created_at desc);
create index audit_entity_idx on psicoluz.audit_events(entity,entity_id,at desc);
comment on schema psicoluz is 'PsicoLuz: esquema privado; acceso por API autorizada pendiente. No exponer directamente al navegador.';
commit;
