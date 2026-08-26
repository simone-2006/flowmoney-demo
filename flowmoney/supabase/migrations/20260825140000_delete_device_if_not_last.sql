-- Atomic last-device guard for passkey revocation
create or replace function public.delete_device_if_not_last(p_id text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  total integer;
begin
  perform 1 from public.devices for update;
  select count(*) into total from public.devices;
  if total <= 1 then
    raise exception 'Non puoi rimuovere l''ultimo dispositivo';
  end if;
  delete from public.devices where id = p_id;
  if not found then
    raise exception 'Dispositivo non trovato';
  end if;
end;
$$;

revoke all on function public.delete_device_if_not_last(text) from public;
revoke all on function public.delete_device_if_not_last(text) from anon, authenticated;
grant execute on function public.delete_device_if_not_last(text) to service_role;
