-- Auth step: one narrow authenticated RPC, no direct browser table access.
begin;
create function public.psicoluz_current_staff_profile()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare caller uuid := auth.uid(); profile psicoluz.staff_profiles%rowtype;
begin
  if caller is null then raise exception 'Sesión requerida.' using errcode='42501'; end if;
  select * into profile from psicoluz.staff_profiles p where p.id=caller and p.active;
  if not found then return null; end if;
  insert into psicoluz.audit_events(actor_user_id,operation,entity,entity_id)
    values(caller,'STAFF_PROFILE_ACCESS','staff_profiles',caller);
  return jsonb_build_object('id',profile.id,'display_name',profile.display_name,'role',profile.role,'active',profile.active);
end $$;
revoke all on function public.psicoluz_current_staff_profile() from public,anon,authenticated;
grant execute on function public.psicoluz_current_staff_profile() to authenticated;
comment on function public.psicoluz_current_staff_profile() is 'Own active staff profile only. Ignores user-editable metadata. Does not grant clinical data access.';
notify pgrst, 'reload schema';
commit;
