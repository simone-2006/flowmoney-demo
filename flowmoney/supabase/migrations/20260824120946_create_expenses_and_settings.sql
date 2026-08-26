-- expenses + settings for personal spending tracker
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null,
  description text,
  amount numeric not null,
  created_at timestamptz not null default now(),
  constraint expenses_amount_check check (amount > 0)
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;
alter table public.settings enable row level security;

-- Access only via backend service_role (no anon/authenticated policies by design)
revoke all on table public.devices from anon, authenticated;
revoke all on table public.expenses from anon, authenticated;
revoke all on table public.settings from anon, authenticated;
