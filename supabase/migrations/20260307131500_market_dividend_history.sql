create table if not exists public.market_dividend_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'brapi',
  ticker text not null,
  event_key text not null,
  payment_date date not null,
  ex_date date,
  approved_on date,
  rate numeric not null,
  label text,
  raw jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists market_dividend_events_event_key_unique
  on public.market_dividend_events(event_key);

create index if not exists market_dividend_events_ticker_idx
  on public.market_dividend_events(ticker);

create index if not exists market_dividend_events_payment_date_idx
  on public.market_dividend_events(payment_date desc);

create table if not exists public.market_dividend_sync_state (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'brapi',
  ticker text not null,
  status text not null check (status in ('updated', 'no_change', 'provider_error', 'provider_empty')),
  message text,
  last_attempt_at timestamptz not null default now(),
  last_success_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists market_dividend_sync_state_provider_ticker_unique
  on public.market_dividend_sync_state(provider, ticker);

create index if not exists market_dividend_sync_state_ticker_idx
  on public.market_dividend_sync_state(ticker);

alter table public.market_dividend_events enable row level security;
alter table public.market_dividend_sync_state enable row level security;

drop policy if exists "market_dividend_events_read_authenticated" on public.market_dividend_events;
create policy "market_dividend_events_read_authenticated"
  on public.market_dividend_events for select
  using (auth.role() = 'authenticated');

drop policy if exists "market_dividend_sync_state_read_authenticated" on public.market_dividend_sync_state;
create policy "market_dividend_sync_state_read_authenticated"
  on public.market_dividend_sync_state for select
  using (auth.role() = 'authenticated');

drop trigger if exists market_dividend_events_set_updated_at on public.market_dividend_events;
create trigger market_dividend_events_set_updated_at
before update on public.market_dividend_events
for each row
execute procedure public.set_updated_at();

drop trigger if exists market_dividend_sync_state_set_updated_at on public.market_dividend_sync_state;
create trigger market_dividend_sync_state_set_updated_at
before update on public.market_dividend_sync_state
for each row
execute procedure public.set_updated_at();
