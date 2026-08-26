-- method: pc | phone
alter table public.devices
  add column if not exists method text not null default 'pc';

alter table public.devices
  drop constraint if exists devices_method_check;

alter table public.devices
  add constraint devices_method_check
  check (method = any (array['pc'::text, 'phone'::text]));
