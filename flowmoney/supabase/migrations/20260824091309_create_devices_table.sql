-- devices: WebAuthn credentials (single-owner app)
create table if not exists public.devices (
  id text primary key,
  public_key text not null,
  counter bigint not null default 0,
  transports text[] not null default '{}'::text[],
  device_type text,
  backed_up boolean not null default false,
  name text not null default 'Dispositivo',
  created_at timestamptz not null default now()
);

alter table public.devices enable row level security;
