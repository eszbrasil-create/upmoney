-- Assets tables for positions and market data cache
create extension if not exists "pgcrypto";

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_type text not null check (asset_type in ('equity', 'crypto')),
  symbol text not null,
  provider_symbol text,
  quantity numeric not null,
  entry_price numeric not null,
  entry_date date not null,
  currency text default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_prices_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete cascade,
  symbol text not null,
  asset_type text not null check (asset_type in ('equity', 'crypto')),
  price numeric not null,
  change_24h_pct numeric,
  provider text not null,
  as_of timestamptz not null,
  fetched_at timestamptz not null default now(),
  raw jsonb
);

create table if not exists public.dividends_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete cascade,
  symbol text not null,
  provider text not null,
  event_date date not null,
  amount numeric,
  currency text,
  event_type text check (event_type in ('DIVIDEND', 'JCP', 'RENT', 'OTHER')),
  raw jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists market_prices_cache_position_unique
  on public.market_prices_cache(user_id, position_id);

create index if not exists market_prices_cache_user_idx
  on public.market_prices_cache(user_id);

create index if not exists market_prices_cache_fetched_idx
  on public.market_prices_cache(fetched_at);

create unique index if not exists dividends_cache_unique
  on public.dividends_cache(user_id, position_id, event_date, provider);

create index if not exists dividends_cache_user_idx
  on public.dividends_cache(user_id);

create index if not exists dividends_cache_position_idx
  on public.dividends_cache(position_id);

alter table public.positions enable row level security;
alter table public.market_prices_cache enable row level security;
alter table public.dividends_cache enable row level security;

drop policy if exists "positions_read_own" on public.positions;
create policy "positions_read_own"
  on public.positions for select
  using (auth.uid() = user_id);

drop policy if exists "positions_insert_own" on public.positions;
create policy "positions_insert_own"
  on public.positions for insert
  with check (auth.uid() = user_id);

drop policy if exists "positions_update_own" on public.positions;
create policy "positions_update_own"
  on public.positions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "positions_delete_own" on public.positions;
create policy "positions_delete_own"
  on public.positions for delete
  using (auth.uid() = user_id);

drop policy if exists "market_prices_read_own" on public.market_prices_cache;
create policy "market_prices_read_own"
  on public.market_prices_cache for select
  using (auth.uid() = user_id);

drop policy if exists "market_prices_insert_own" on public.market_prices_cache;
create policy "market_prices_insert_own"
  on public.market_prices_cache for insert
  with check (auth.uid() = user_id);

drop policy if exists "market_prices_update_own" on public.market_prices_cache;
create policy "market_prices_update_own"
  on public.market_prices_cache for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "market_prices_delete_own" on public.market_prices_cache;
create policy "market_prices_delete_own"
  on public.market_prices_cache for delete
  using (auth.uid() = user_id);

drop policy if exists "dividends_read_own" on public.dividends_cache;
create policy "dividends_read_own"
  on public.dividends_cache for select
  using (auth.uid() = user_id);

drop policy if exists "dividends_insert_own" on public.dividends_cache;
create policy "dividends_insert_own"
  on public.dividends_cache for insert
  with check (auth.uid() = user_id);

drop policy if exists "dividends_update_own" on public.dividends_cache;
create policy "dividends_update_own"
  on public.dividends_cache for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "dividends_delete_own" on public.dividends_cache;
create policy "dividends_delete_own"
  on public.dividends_cache for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists positions_set_updated_at on public.positions;
create trigger positions_set_updated_at
before update on public.positions
for each row
execute procedure public.set_updated_at();
