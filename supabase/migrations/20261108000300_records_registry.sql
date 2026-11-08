-- Pending approval: patient identification and record registry only; no notes/files API.
begin;
create function psicoluz.registry_record_dto(r psicoluz.records) returns jsonb
language sql stable set search_path=pg_catalog as $$
 select jsonb_build_object('id',r.id,'number',r.number,'patient_id',r.patient_id,
 'professional_id',r.professional_id,'professional_name',s.display_name,'reason',r.reason,
 'state',r.state,'created_at',r.created_at,'updated_at',r.updated_at,
 'patient',jsonb_build_object('id',p.id,'first_name',p.first_name,'last_name',p.last_name,
 'birth_date',p.birth_date,'tutor_name',p.tutor_name,'tutor_phone',p.tutor_phone,
 'tutor_relation',p.tutor_relation,'updated_at',p.updated_at))
 from psicoluz.patients p join psicoluz.staff_profiles s on s.id=r.professional_id where p.id=r.patient_id
$$;
revoke all on function psicoluz.registry_record_dto(psicoluz.records) from public,anon,authenticated;
create function public.psicoluz_records_registry(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare
 actor psicoluz.staff_profiles%rowtype; rec psicoluz.records%rowtype; pat psicoluz.patients%rowtype;
 rid uuid; pid uuid; pro uuid; result jsonb; items jsonb; total bigint; choices jsonb;
 term text; state_filter text; page_offset integer; allowed text[];
begin
 select * into actor from psicoluz.staff_profiles where id=auth.uid() and active for share;
 if not found or actor.role not in ('psicologa','administracion') then raise exception 'Acceso no habilitado.' using errcode='42501'; end if;
 if p_action is null or p_action not in ('index','patients','detail','create','update') or p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'Solicitud no válida.' using errcode='22023'; end if;
 if exists(select 1 from jsonb_each(p_payload) e where (e.key='offset' and jsonb_typeof(e.value)<>'number') or (e.key<>'offset' and jsonb_typeof(e.value) not in ('string','null'))) then raise exception 'Tipo de campo no válido.' using errcode='22023'; end if;
 allowed := case p_action
 when 'index' then array['search','state','offset'] when 'patients' then array['search']
 when 'detail' then array['record_id']
 when 'create' then array['patient_id','professional_id','first_name','last_name','birth_date','tutor_name','tutor_phone','tutor_relation','reason','state']
 else array['record_id','expected_record_updated_at','expected_patient_updated_at','first_name','last_name','birth_date','tutor_name','tutor_phone','tutor_relation','reason','state'] end;
 if exists(select 1 from jsonb_object_keys(p_payload) k where not k=any(allowed)) then raise exception 'Campos no permitidos.' using errcode='22023'; end if;
 if p_action in ('index','patients') then
   term:=trim(coalesce(p_payload->>'search','')); if length(term)>100 then raise exception 'Búsqueda demasiado larga.' using errcode='22023'; end if;
   term:=lower(translate(term,'ÁÉÍÓÚÜáéíóúü','AEIOUUaeiouu'));
   if p_action='patients' then
     select coalesce(jsonb_agg(x.item),'[]') into result from (
       select jsonb_build_object('id',p.id,'first_name',p.first_name,'last_name',p.last_name) item from psicoluz.patients p
       where exists(select 1 from psicoluz.records r where r.patient_id=p.id and (actor.role='administracion' or r.professional_id=actor.id))
       and position(term in lower(translate(p.first_name||' '||p.last_name,'ÁÉÍÓÚÜáéíóúü','AEIOUUaeiouu')))>0
       order by p.last_name,p.first_name,p.id limit 20) x;
     insert into psicoluz.audit_events(actor_user_id,operation,entity) values(actor.id,'PATIENT_INDEX','patients');
     return result;
   end if;
   state_filter:=nullif(p_payload->>'state',''); page_offset:=coalesce((p_payload->>'offset')::integer,0);
   if page_offset<0 or page_offset>100000 or (state_filter is not null and state_filter not in ('activo','en_espera','suspendido','alta','archivado')) then raise exception 'Filtro no válido.' using errcode='22023'; end if;
   select count(*) into total from psicoluz.records r join psicoluz.patients p on p.id=r.patient_id
   where (actor.role='administracion' or r.professional_id=actor.id) and (state_filter is null or r.state=state_filter)
   and position(term in lower(translate(p.first_name||' '||p.last_name||' '||r.number,'ÁÉÍÓÚÜáéíóúü','AEIOUUaeiouu')))>0;
   select coalesce(jsonb_agg(x.item),'[]') into items from (
     select psicoluz.registry_record_dto(r) item from psicoluz.records r join psicoluz.patients p on p.id=r.patient_id
     where (actor.role='administracion' or r.professional_id=actor.id) and (state_filter is null or r.state=state_filter)
     and position(term in lower(translate(p.first_name||' '||p.last_name||' '||r.number,'ÁÉÍÓÚÜáéíóúü','AEIOUUaeiouu')))>0
     order by r.updated_at desc,r.id limit 50 offset page_offset) x;
   select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.display_name) order by s.display_name,s.id),'[]') into choices
     from psicoluz.staff_profiles s where active and role='psicologa' and (actor.role='administracion' or s.id=actor.id);
   insert into psicoluz.audit_events(actor_user_id,operation,entity) values(actor.id,'RECORD_INDEX','records');
   return jsonb_build_object('records',items,'total',total,'professionals',choices);
 end if;
 if p_action in ('detail','update') then
   rid:=(p_payload->>'record_id')::uuid;
   select * into rec from psicoluz.records where id=rid and (actor.role='administracion' or professional_id=actor.id) for update;
   if not found then raise exception 'Expediente no disponible.' using errcode='42501'; end if;
   if p_action='detail' then
     insert into psicoluz.audit_events(actor_user_id,operation,entity,entity_id) values(actor.id,'RECORD_VIEW','records',rec.id);
     return psicoluz.registry_record_dto(rec);
   end if;
   select * into pat from psicoluz.patients where id=rec.patient_id for update;
   if nullif(p_payload->>'expected_record_updated_at','') is null or nullif(p_payload->>'expected_patient_updated_at','') is null then raise exception 'Versión requerida.' using errcode='22023'; end if;
   if rec.updated_at<>(p_payload->>'expected_record_updated_at')::timestamptz or pat.updated_at<>(p_payload->>'expected_patient_updated_at')::timestamptz then raise exception 'Otro usuario actualizó el registro. Recargá antes de guardar.' using errcode='40001'; end if;
 end if;
 if p_action='create' then
   pro:=(p_payload->>'professional_id')::uuid;
   if (actor.role='psicologa' and pro is distinct from actor.id) or not exists(select 1 from psicoluz.staff_profiles where id=pro and role='psicologa' and active) then raise exception 'Seleccioná una psicóloga activa autorizada.' using errcode='42501'; end if;
   pid:=nullif(p_payload->>'patient_id','')::uuid;
   if pid is not null then
     if exists(select 1 from jsonb_object_keys(p_payload) k where k in ('first_name','last_name','birth_date','tutor_name','tutor_phone','tutor_relation')) then raise exception 'No mezclar paciente existente con identificación nueva.' using errcode='22023'; end if;
     select * into pat from psicoluz.patients p where p.id=pid and exists(select 1 from psicoluz.records r where r.patient_id=p.id and (actor.role='administracion' or r.professional_id=actor.id)) for update;
     if not found then raise exception 'Paciente no disponible.' using errcode='42501'; end if;
   else
     insert into psicoluz.patients(first_name,last_name,birth_date,tutor_name,tutor_phone,tutor_relation,created_by)
     values(trim(p_payload->>'first_name'),trim(p_payload->>'last_name'),nullif(p_payload->>'birth_date','')::date,trim(coalesce(p_payload->>'tutor_name','')),trim(coalesce(p_payload->>'tutor_phone','')),trim(coalesce(p_payload->>'tutor_relation','')),actor.id) returning id into pid;
   end if;
   insert into psicoluz.records(patient_id,professional_id,reason,state,created_by)
     values(pid,pro,trim(p_payload->>'reason'),p_payload->>'state',actor.id) returning * into rec;
 else
   update psicoluz.patients set first_name=trim(p_payload->>'first_name'),last_name=trim(p_payload->>'last_name'),birth_date=nullif(p_payload->>'birth_date','')::date,
     tutor_name=trim(coalesce(p_payload->>'tutor_name','')),tutor_phone=trim(coalesce(p_payload->>'tutor_phone','')),tutor_relation=trim(coalesce(p_payload->>'tutor_relation','')) where id=rec.patient_id;
   update psicoluz.records set reason=trim(p_payload->>'reason'),state=p_payload->>'state' where id=rec.id returning * into rec;
 end if;
 return psicoluz.registry_record_dto(rec);
end $$;
revoke all on function public.psicoluz_records_registry(text,jsonb) from public,anon,authenticated;
grant execute on function public.psicoluz_records_registry(text,jsonb) to authenticated;
comment on function public.psicoluz_records_registry(text,jsonb) is 'Authorized registry only. Admin: identification and record opening. Professional: own records. No notes, evaluations, files, portal or role changes.';
notify pgrst,'reload schema';
commit;
