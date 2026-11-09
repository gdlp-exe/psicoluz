-- Private resources and family portal. No public storage reads or signed URLs.
begin;
alter table psicoluz.attachments add column upload_status text not null default 'pending' check(upload_status in ('pending','ready','revoked'));
create table psicoluz.portal_rate_limits(scope text not null,bucket bigint not null,hits integer not null,primary key(scope,bucket));
create index portal_rate_limits_age on psicoluz.portal_rate_limits(bucket);
alter table psicoluz.portal_rate_limits enable row level security;
revoke all on psicoluz.portal_rate_limits from public,anon,authenticated;
create function psicoluz.portal_limit(k text,n integer) returns boolean language plpgsql set search_path=pg_catalog as $$
declare b bigint:=floor(extract(epoch from clock_timestamp())/300);h integer;
begin
 delete from psicoluz.portal_rate_limits where bucket<b-576;
 insert into psicoluz.portal_rate_limits values(k,b,1) on conflict(scope,bucket) do update set hits=least(psicoluz.portal_rate_limits.hits+1,1000000) returning hits into h;
 return h<=n;
end $$;
create function psicoluz.portal_scope(t text) returns table(sid uuid,rid uuid) language sql stable set search_path=pg_catalog as $$
 select s.id,s.record_id from psicoluz.portal_sessions s join psicoluz.portal_codes c on c.id=s.code_id and c.record_id=s.record_id join psicoluz.records r on r.id=s.record_id join psicoluz.staff_profiles p on p.id=r.professional_id
 where t~'^[a-f0-9]{64}$' and s.token_hash=sha256(convert_to(t,'UTF8')) and s.revoked_at is null and c.revoked_at is null and s.expires_at>now() and c.expires_at>now() and p.active and p.role='psicologa' and r.state<>'archivado'
$$;
create function psicoluz.file_dto(a psicoluz.attachments) returns jsonb language sql immutable set search_path=pg_catalog as $$select jsonb_build_object('id',a.id,'name',a.name,'type',a.mime_type,'size',a.size_bytes,'visiblePortal',a.visible_portal,'updatedAt',a.updated_at,'status',a.upload_status)$$;
create function public.psicoluz_resources(p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare actor psicoluz.staff_profiles;r psicoluz.records;a psicoluz.attachments;c psicoluz.portal_codes;keys text[];fid uuid;path text;code text;days integer;mime text;ext text;
begin
 select * into actor from psicoluz.staff_profiles where id=auth.uid() and active and role='psicologa';
 if not found then raise exception 'Acceso no habilitado.' using errcode='42501';end if;
 keys:=case p_action when 'list' then array['record_id'] when 'reserve' then array['record_id','name','type','size'] when 'upload_check' then array['record_id','id'] when 'cancel_upload' then array['record_id','id'] when 'file' then array['record_id','id'] when 'visibility' then array['record_id','id','updated_at','visible','confirm'] when 'revoke_file' then array['record_id','id','updated_at','confirm'] when 'issue_code' then array['record_id','days','confirm'] when 'revoke_code' then array['record_id','id','confirm'] else null end;
 if keys is null or jsonb_typeof(p_payload)<>'object' or exists(select from jsonb_object_keys(p_payload) k where not(k=any(keys))) then raise exception 'Solicitud no válida.' using errcode='22023';end if;
 select * into r from psicoluz.records where id=(p_payload->>'record_id')::uuid and professional_id=actor.id for update;
 if not found then raise exception 'Expediente no disponible.' using errcode='42501';end if;
 if p_action='list' then
  insert into psicoluz.audit_events(actor_user_id,operation,entity,entity_id) values(actor.id,'RESOURCES_VIEW','records',r.id);
  return jsonb_build_object('files',coalesce((select jsonb_agg(psicoluz.file_dto(x) order by x.created_at desc) from psicoluz.attachments x where x.record_id=r.id and x.upload_status='ready'),'[]'),'codes',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'createdAt',x.created_at,'expiresAt',x.expires_at,'revoked',x.revoked_at is not null) order by x.created_at desc) from psicoluz.portal_codes x where x.record_id=r.id),'[]'));
 elsif p_action='reserve' then
  ext:=lower(substring(p_payload->>'name' from '\.([A-Za-z0-9]+)$'));mime:=case ext when 'pdf' then 'application/pdf' when 'png' then 'image/png' when 'jpg' then 'image/jpeg' when 'jpeg' then 'image/jpeg' when 'docx' then 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' else null end;
  if mime is null or mime is distinct from p_payload->>'type' or length(trim(p_payload->>'name')) not between 1 and 255 or p_payload->>'name' ~ '[/\\[:cntrl:]]' or coalesce((p_payload->>'size')::bigint,0) not between 1 and 10485760 then raise exception 'Archivo no válido.' using errcode='22023';end if;
  if (select count(*) from psicoluz.attachments where record_id=r.id and upload_status='pending' and created_at>now()-interval '1 hour')>=20 then raise exception 'Demasiadas cargas pendientes.' using errcode='22023';end if;
  fid:=gen_random_uuid();path:=r.id::text||'/'||fid::text||'.'||ext;
  insert into psicoluz.attachments(id,record_id,name,mime_type,size_bytes,object_key,author_id) values(fid,r.id,trim(p_payload->>'name'),mime,(p_payload->>'size')::bigint,path,actor.id);
  insert into psicoluz.audit_events(actor_user_id,operation,entity,entity_id) values(actor.id,'FILE_RESERVED','records',r.id);
  return jsonb_build_object('id',fid,'path',path);
 elsif p_action in ('issue_code','revoke_code') then
  if not coalesce((p_payload->>'confirm')::boolean,false) then raise exception 'Confirmá la autorización.' using errcode='22023';end if;
  if p_action='issue_code' then
   days:=(p_payload->>'days')::integer;if days is null or days not in(1,7,30) or r.state='archivado' then raise exception 'Vigencia no válida.' using errcode='22023';end if;
   update psicoluz.portal_codes set revoked_at=now() where record_id=r.id and revoked_at is null;
   update psicoluz.portal_sessions set revoked_at=now() where record_id=r.id and revoked_at is null;
   code:=upper(replace(gen_random_uuid()::text,'-',''));code:='PL-'||substr(code,1,8)||'-'||substr(code,9,8)||'-'||substr(code,17,8)||'-'||substr(code,25,8);
   insert into psicoluz.portal_codes(record_id,code_hash,issued_by,expires_at) values(r.id,sha256(convert_to(replace(code,'-',''),'UTF8')),actor.id,now()+days*interval '1 day') returning * into c;
   insert into psicoluz.audit_events(actor_user_id,operation,entity,entity_id) values(actor.id,'PORTAL_CODE_ISSUED','records',r.id);
   return jsonb_build_object('code',code,'expiresAt',c.expires_at);
  end if;
  update psicoluz.portal_codes set revoked_at=now() where id=(p_payload->>'id')::uuid and record_id=r.id returning * into c;
  if not found then raise exception 'Código no disponible.' using errcode='42501';end if;
  update psicoluz.portal_sessions set revoked_at=now() where code_id=c.id;
 else
  select * into a from psicoluz.attachments where id=(p_payload->>'id')::uuid and record_id=r.id for update;
  if not found or a.upload_status='revoked' then raise exception 'Archivo no disponible.' using errcode='42501';end if;
  if p_action='upload_check' then
   if a.upload_status<>'pending' or a.author_id<>actor.id then raise exception 'Carga no disponible.' using errcode='42501';end if;
   return jsonb_build_object('id',a.id,'actorId',actor.id,'path',a.object_key,'name',a.name,'size',a.size_bytes,'type',a.mime_type);
  elsif p_action='cancel_upload' then
   if a.upload_status<>'pending' or a.author_id<>actor.id then raise exception 'Carga no disponible.' using errcode='42501';end if;
   update psicoluz.attachments set upload_status='revoked',visible_portal=false where id=a.id;
  elsif p_action='file' then
   if a.upload_status<>'ready' then raise exception 'Archivo no disponible.' using errcode='42501';end if;
   insert into psicoluz.audit_events(actor_user_id,operation,entity,entity_id) values(actor.id,'FILE_DOWNLOAD','records',r.id);
   return jsonb_build_object('path',a.object_key,'name',a.name,'size',a.size_bytes,'type',a.mime_type);
  else
   if a.upload_status<>'ready' or a.updated_at is distinct from (p_payload->>'updated_at')::timestamptz then raise exception 'El archivo cambió.' using errcode='40001';end if;
   if p_action='revoke_file' then
    if not coalesce((p_payload->>'confirm')::boolean,false) then raise exception 'Confirmá la retirada.' using errcode='22023';end if;
    update psicoluz.attachments set upload_status='revoked',visible_portal=false where id=a.id;
   else
    if jsonb_typeof(p_payload->'visible') is distinct from 'boolean' then raise exception 'Visibilidad no válida.' using errcode='22023';end if;
    if (p_payload->>'visible')::boolean and not coalesce((p_payload->>'confirm')::boolean,false) then raise exception 'Confirmá la autorización familiar.' using errcode='22023';end if;
    update psicoluz.attachments set visible_portal=(p_payload->>'visible')::boolean,family_authorized_by=case when (p_payload->>'visible')::boolean then actor.id else null end,family_authorized_at=case when (p_payload->>'visible')::boolean then now() else null end where id=a.id;
   end if;
  end if;
 end if;
 insert into psicoluz.audit_events(actor_user_id,operation,entity,entity_id) values(actor.id,'RESOURCES_'||upper(p_action),'records',r.id);
 return jsonb_build_object('ok',true);
end $$;
-- Only the deployed download/validation service can finalize bytes checked on the server.
create function public.psicoluz_finalize_upload(p_file_id uuid,p_actor_id uuid) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare a psicoluz.attachments;meta jsonb;
begin
 select x.* into a from psicoluz.attachments x join psicoluz.records r on r.id=x.record_id join psicoluz.staff_profiles p on p.id=r.professional_id where x.id=p_file_id and x.author_id=p_actor_id and r.professional_id=p_actor_id and p.active and p.role='psicologa' and x.upload_status='pending' for update of x;
 if not found then raise exception 'Carga no disponible.' using errcode='42501';end if;
 select metadata into meta from storage.objects where bucket_id='psicoluz-private' and name=a.object_key;
 if meta is null or (meta->>'size')::bigint is distinct from a.size_bytes or meta->>'mimetype' is distinct from a.mime_type then raise exception 'Archivo no verificado.' using errcode='22023';end if;
 update psicoluz.attachments set upload_status='ready' where id=a.id;
 insert into psicoluz.audit_events(actor_user_id,operation,entity,entity_id) values(p_actor_id,'FILE_VALIDATED','records',a.record_id);
 return jsonb_build_object('ok',true);
end $$;
create function public.psicoluz_portal(p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare keys text[];code text;c psicoluz.portal_codes;t text;scope record;family jsonb;a psicoluz.attachments;activity uuid;sid uuid;rid uuid;result jsonb;
begin
 keys:=case p_action when 'enter' then array['code'] when 'view' then array['token'] when 'leave' then array['token'] when 'file' then array['token','id'] when 'report' then array['token','activity_id','outcome','message'] else null end;
 if keys is null or jsonb_typeof(p_payload)<>'object' or length(p_payload::text)>4096 or exists(select from jsonb_object_keys(p_payload) k where not(k=any(keys))) then return null;end if;
 if p_action='enter' then
  code:=upper(regexp_replace(left(coalesce(p_payload->>'code',''),80),'[[:space:]-]','','g'));
  if not psicoluz.portal_limit('enter-global',300) or not psicoluz.portal_limit('enter-'||encode(sha256(convert_to(code,'UTF8')),'hex'),12) then return null;end if;
  if code !~ '^PL[A-F0-9]{32}$' then return null;end if;
  select x.* into c from psicoluz.portal_codes x join psicoluz.records r on r.id=x.record_id join psicoluz.staff_profiles p on p.id=r.professional_id where x.code_hash=sha256(convert_to(code,'UTF8')) and x.revoked_at is null and x.expires_at>now() and r.state<>'archivado' and p.active and p.role='psicologa' for share of x;
  if not found then return null;end if;
  t:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
  insert into psicoluz.portal_sessions(record_id,code_id,token_hash,expires_at) values(c.record_id,c.id,sha256(convert_to(t,'UTF8')),least(c.expires_at,now()+interval '8 hours')) returning id into sid;
  insert into psicoluz.audit_events(operation,entity,entity_id) values('PORTAL_ENTER','portal_sessions',sid);
  return jsonb_build_object('token',t);
 end if;
 t:=p_payload->>'token';select * into scope from psicoluz.portal_scope(t);if not found then return null;end if;sid:=scope.sid;rid:=scope.rid;
 if p_action='leave' then update psicoluz.portal_sessions set revoked_at=now() where id=sid;return jsonb_build_object('ok',true);end if;
 if not psicoluz.portal_limit('session-'||sid::text,120) then return null;end if;
 if p_action='view' then
  family:=psicoluz.followup_family(rid);
  result:=jsonb_build_object('greetingName',(select p.first_name from psicoluz.patients p join psicoluz.records r on r.patient_id=p.id where r.id=rid),'activities',family->'activities','recommendations',family->'recommendations',
   'notes',coalesce((select jsonb_agg(jsonb_build_object('id',n.id,'title',n.title,'body',n.body,'date',n.date) order by n.date desc,n.id) from psicoluz.notes n where n.record_id=rid and n.visibility='paciente_tutor' and n.family_authorized_by is not null and n.family_authorized_at is not null),'[]'),
   'files',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'name',f.name,'type',f.mime_type,'size',f.size_bytes) order by f.created_at desc) from psicoluz.attachments f where f.record_id=rid and f.upload_status='ready' and f.visible_portal and f.family_authorized_by is not null and f.family_authorized_at is not null),'[]'),
   'links',coalesce((select jsonb_agg(jsonb_build_object('id',l.id,'title',l.title,'description',l.description,'url',l.url) order by l.created_at desc) from psicoluz.resource_links l where l.record_id=rid and l.visible_portal and l.family_authorized_by is not null and l.family_authorized_at is not null),'[]'),
   'nextAppointment',(select jsonb_build_object('startAt',x.start_at) from psicoluz.appointments x where x.record_id=rid and x.status='confirmada' and x.start_at>=now() order by x.start_at limit 1),
   'reports',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'activityId',f.activity_id,'outcome',f.outcome,'message',f.message,'at',f.created_at) order by f.created_at desc) from psicoluz.family_reports f join psicoluz.activities act on act.id=f.activity_id and act.record_id=f.record_id where f.record_id=rid and act.visible_portal),'[]'));
 elsif p_action='file' then
  select * into a from psicoluz.attachments where id=(p_payload->>'id')::uuid and record_id=rid and upload_status='ready' and visible_portal and family_authorized_by is not null and family_authorized_at is not null;
  if not found then return null;end if;result:=jsonb_build_object('path',a.object_key,'name',a.name,'size',a.size_bytes,'type',a.mime_type);
 elsif p_action='report' then
  if p_payload->>'outcome' is null or p_payload->>'outcome' not in('realizada','intentada','ayuda') or length(coalesce(p_payload->>'message',''))>500 then return null;end if;
  select id into activity from psicoluz.activities where id=(p_payload->>'activity_id')::uuid and record_id=rid and visible_portal and family_authorized_by is not null and family_authorized_at is not null for share;
  if not found or not psicoluz.portal_limit('reports-'||sid::text,10) or not psicoluz.portal_limit('reports-record-'||rid::text,20) then return null;end if;
  insert into psicoluz.family_reports(record_id,activity_id,session_id,outcome,message) values(rid,activity,sid,p_payload->>'outcome',trim(coalesce(p_payload->>'message','')));result:=jsonb_build_object('ok',true);
 end if;
 insert into psicoluz.audit_events(operation,entity,entity_id) values('PORTAL_'||upper(p_action),'portal_sessions',sid);
 return result;
exception when invalid_text_representation or numeric_value_out_of_range then return null;
end $$;
-- Uploads only: no SELECT, signing, overwrites or browser deletion of bucket objects.
create function public.psicoluz_upload_allowed(object_name text) returns boolean language sql stable security definer set search_path=pg_catalog as $$
 select exists(select from psicoluz.attachments a join psicoluz.records r on r.id=a.record_id join psicoluz.staff_profiles p on p.id=r.professional_id where a.object_key=object_name and a.upload_status='pending' and a.author_id=auth.uid() and r.professional_id=auth.uid() and p.active and p.role='psicologa' and a.created_at>now()-interval '1 hour')
$$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('psicoluz-private','psicoluz-private',false,10485760,array['application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
create policy psicoluz_private_upload on storage.objects for insert to authenticated with check(bucket_id='psicoluz-private' and public.psicoluz_upload_allowed(name));
revoke all on function psicoluz.portal_limit(text,integer),psicoluz.portal_scope(text),psicoluz.file_dto(psicoluz.attachments) from public,anon,authenticated;
revoke all on function public.psicoluz_resources(text,jsonb),public.psicoluz_finalize_upload(uuid,uuid),public.psicoluz_portal(text,jsonb),public.psicoluz_upload_allowed(text) from public,anon,authenticated;
grant execute on function public.psicoluz_resources(text,jsonb),public.psicoluz_upload_allowed(text) to authenticated;
grant execute on function public.psicoluz_finalize_upload(uuid,uuid) to service_role;
grant execute on function public.psicoluz_portal(text,jsonb) to anon,authenticated;
notify pgrst,'reload schema';
commit;
