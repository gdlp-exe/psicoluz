begin;
create function psicoluz.agenda_dto(a psicoluz.appointments) returns jsonb language sql stable set search_path=pg_catalog as $$
 select jsonb_build_object('id',a.id,'record_id',a.record_id,'patient_id',a.patient_id,'professional_id',a.professional_id,'start_at',a.start_at,'end_at',a.end_at,'duration',a.duration,'modality',a.modality,'status',a.status,'created_at',a.created_at,'updated_at',a.updated_at,'patient_name',p.first_name||' '||p.last_name,'record_number',r.number,'professional_name',s.display_name)
 from psicoluz.records r join psicoluz.patients p on p.id=r.patient_id join psicoluz.staff_profiles s on s.id=r.professional_id where r.id=a.record_id
$$;
revoke all on function psicoluz.agenda_dto(psicoluz.appointments) from public,anon,authenticated;
create function public.psicoluz_agenda(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare actor psicoluz.staff_profiles%rowtype; rec psicoluz.records%rowtype; apt psicoluz.appointments%rowtype;
 allowed text[]; lo date; hi date; starts timestamptz; ends timestamptz; minutes integer; items jsonb; choices jsonb; result jsonb;
begin
 select * into actor from psicoluz.staff_profiles where id=auth.uid() and active for share;
 if not found or actor.role not in ('administracion','psicologa') then raise exception 'Acceso no habilitado.' using errcode='42501'; end if;
 if p_action is null or p_action not in ('index','catalog','detail','create','update','cancel') or p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'Solicitud no válida.' using errcode='22023'; end if;
 allowed:=case p_action when 'index' then array['start_date','end_date'] when 'catalog' then array[]::text[] when 'detail' then array['appointment_id'] when 'create' then array['record_id','date','time','duration','modality','status'] when 'update' then array['appointment_id','expected_updated_at','date','time','duration','modality','status'] else array['appointment_id','expected_updated_at'] end;
 if exists(select 1 from jsonb_each(p_payload) e where not e.key=any(allowed) or (e.key='duration' and jsonb_typeof(e.value)<>'number') or (e.key<>'duration' and jsonb_typeof(e.value)<>'string')) then raise exception 'Campos no permitidos.' using errcode='22023'; end if;
 if p_action='catalog' then
   select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'number',r.number,'patient_id',r.patient_id,'professional_id',r.professional_id,'patient_name',p.first_name||' '||p.last_name) order by p.last_name,r.number),'[]') into items from psicoluz.records r join psicoluz.patients p on p.id=r.patient_id where actor.role='administracion' or r.professional_id=actor.id;
   select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.display_name) order by s.display_name,s.id),'[]') into choices from psicoluz.staff_profiles s where s.role='psicologa' and (s.active or exists(select 1 from psicoluz.records r where r.professional_id=s.id)) and (actor.role='administracion' or s.id=actor.id);
   insert into psicoluz.audit_events(actor_user_id,operation,entity) values(actor.id,'AGENDA_CATALOG','appointments');
   return jsonb_build_object('records',items,'professionals',choices);
 end if;
 if p_action='index' then
   lo:=(p_payload->>'start_date')::date; hi:=(p_payload->>'end_date')::date;
   if lo is null or hi is null or hi<=lo or hi-lo>31 then raise exception 'Rango de agenda no válido.' using errcode='22023'; end if;
   select coalesce(jsonb_agg(psicoluz.agenda_dto(a) order by a.start_at,a.id),'[]') into result from psicoluz.appointments a join psicoluz.records r on r.id=a.record_id
   where (actor.role='administracion' or (a.professional_id=actor.id and r.professional_id=actor.id)) and a.start_at>=lo::timestamp at time zone 'America/Managua' and a.start_at<hi::timestamp at time zone 'America/Managua';
   insert into psicoluz.audit_events(actor_user_id,operation,entity) values(actor.id,'AGENDA_INDEX','appointments');return result;
 end if;
 if p_action in ('detail','update','cancel') then
   select a.* into apt from psicoluz.appointments a join psicoluz.records r on r.id=a.record_id where a.id=(p_payload->>'appointment_id')::uuid and (actor.role='administracion' or (a.professional_id=actor.id and r.professional_id=actor.id)) for update of a;
   if not found then raise exception 'Cita no disponible.' using errcode='42501'; end if;
   if p_action='detail' then
     insert into psicoluz.audit_events(actor_user_id,operation,entity,entity_id) values(actor.id,'APPOINTMENT_VIEW','appointments',apt.id);
     return jsonb_build_object('appointment',psicoluz.agenda_dto(apt),'history',coalesce((select jsonb_agg(jsonb_build_object('id',e.id::text,'action',case e.operation when 'INSERT' then 'Cita registrada' when 'UPDATE' then 'Cita actualizada' else 'Cita consultada' end,'actor',coalesce(s.display_name,'Personal autorizado'),'at',e.at) order by e.at desc,e.id desc) from psicoluz.audit_events e left join psicoluz.staff_profiles s on s.id=e.actor_user_id where e.entity='appointments' and e.entity_id=apt.id),'[]'));
   end if;
   if nullif(p_payload->>'expected_updated_at','') is null then raise exception 'Versión requerida.' using errcode='22023'; end if;
   if apt.updated_at<>(p_payload->>'expected_updated_at')::timestamptz then raise exception 'La cita cambió. Volvé a abrirla.' using errcode='40001'; end if;
   if apt.status='cancelada' then raise exception 'La cita ya está cancelada.' using errcode='23514'; end if;
   if p_action='cancel' then update psicoluz.appointments set status='cancelada' where id=apt.id returning * into apt;return psicoluz.agenda_dto(apt);end if;
 end if;
 select * into rec from psicoluz.records where id=case when p_action='create' then (p_payload->>'record_id')::uuid else apt.record_id end and (actor.role='administracion' or professional_id=actor.id) for share;
 if not found or not exists(select 1 from psicoluz.staff_profiles where id=rec.professional_id and role='psicologa' and active) then raise exception 'Responsable no disponible.' using errcode='42501'; end if;
 if p_payload->>'date' is null or p_payload->>'time' is null or (p_payload->>'date')!~'^\d{4}-\d{2}-\d{2}$' or (p_payload->>'time')!~'^([01][0-9]|2[0-3]):[0-5][0-9]$' or p_payload->>'status' is null or p_payload->>'status' not in ('pendiente','confirmada','atendida') or p_payload->>'modality' is null or p_payload->>'modality' not in ('presencial','virtual') then raise exception 'Revisá los datos de la cita.' using errcode='22023';end if;
 lo:=(p_payload->>'date')::date; minutes:=(p_payload->>'duration')::integer;
 if minutes is null or minutes not in (15,30,45,60,90) then raise exception 'Duración no válida.' using errcode='22023';end if;
 starts:=(lo::text||' '||(p_payload->>'time'))::timestamp at time zone 'America/Managua';ends:=starts+minutes*interval '1 minute';
 if p_action='create' then
   insert into psicoluz.appointments(record_id,patient_id,professional_id,start_at,end_at,duration,modality,status,created_by) values(rec.id,rec.patient_id,rec.professional_id,starts,ends,minutes,p_payload->>'modality',p_payload->>'status',actor.id) returning * into apt;
 else update psicoluz.appointments set start_at=starts,end_at=ends,duration=minutes,modality=p_payload->>'modality',status=p_payload->>'status' where id=apt.id returning * into apt;end if;
 return psicoluz.agenda_dto(apt);
exception when exclusion_violation then raise exception 'Hay un cruce de horario. Elegí otra disponibilidad.' using errcode='23P01';
end $$;
revoke all on function public.psicoluz_agenda(text,jsonb) from public,anon,authenticated;
grant execute on function public.psicoluz_agenda(text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
