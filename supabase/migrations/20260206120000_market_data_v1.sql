create extension if not exists "pgcrypto";

create table if not exists public.user_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  type text not null check (type in ('ACAO', 'FII')),
  quantity numeric not null default 0,
  avg_price numeric,
  created_at timestamptz not null default now()
);

create unique index if not exists user_assets_user_ticker_unique
  on public.user_assets(user_id, ticker, type);

create index if not exists user_assets_user_idx
  on public.user_assets(user_id);

create table if not exists public.market_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  price numeric,
  change_pct numeric,
  currency text,
  provider text,
  updated_at timestamptz not null default now()
);

create unique index if not exists market_cache_user_ticker_unique
  on public.market_cache(user_id, ticker);

create index if not exists market_cache_user_idx
  on public.market_cache(user_id);

create index if not exists market_cache_updated_idx
  on public.market_cache(updated_at);

create table if not exists public.dividends_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text,
  payment_date date,
  last_date_prior date,
  rate numeric,
  label text,
  provider text,
  updated_at timestamptz not null default now()
);

alter table public.dividends_cache
  add column if not exists ticker text,
  add column if not exists payment_date date,
  add column if not exists last_date_prior date,
  add column if not exists rate numeric,
  add column if not exists label text,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists dividends_cache_user_ticker_unique
  on public.dividends_cache(user_id, ticker, payment_date, rate);

create index if not exists dividends_cache_user_idx
  on public.dividends_cache(user_id);

create index if not exists dividends_cache_ticker_idx
  on public.dividends_cache(ticker);

create table if not exists public.user_market_update_log (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_update_date date,
  last_update_at timestamptz
);

alter table public.user_assets enable row level security;
alter table public.market_cache enable row level security;
alter table public.dividends_cache enable row level security;
alter table public.user_market_update_log enable row level security;

drop policy if exists "user_assets_read_own" on public.user_assets;
create policy "user_assets_read_own"
  on public.user_assets for select
  using (auth.uid() = user_id);

drop policy if exists "user_assets_insert_own" on public.user_assets;
create policy "user_assets_insert_own"
  on public.user_assets for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_assets_update_own" on public.user_assets;
create policy "user_assets_update_own"
  on public.user_assets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_assets_delete_own" on public.user_assets;
create policy "user_assets_delete_own"
  on public.user_assets for delete
  using (auth.uid() = user_id);

drop policy if exists "market_cache_read_own" on public.market_cache;
create policy "market_cache_read_own"
  on public.market_cache for select
  using (auth.uid() = user_id);

drop policy if exists "market_cache_insert_own" on public.market_cache;
create policy "market_cache_insert_own"
  on public.market_cache for insert
  with check (auth.uid() = user_id);

drop policy if exists "market_cache_update_own" on public.market_cache;
create policy "market_cache_update_own"
  on public.market_cache for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "market_cache_delete_own" on public.market_cache;
create policy "market_cache_delete_own"
  on public.market_cache for delete
  using (auth.uid() = user_id);

drop policy if exists "dividends_cache_read_own" on public.dividends_cache;
create policy "dividends_cache_read_own"
  on public.dividends_cache for select
  using (auth.uid() = user_id);

drop policy if exists "dividends_cache_insert_own" on public.dividends_cache;
create policy "dividends_cache_insert_own"
  on public.dividends_cache for insert
  with check (auth.uid() = user_id);

drop policy if exists "dividends_cache_update_own" on public.dividends_cache;
create policy "dividends_cache_update_own"
  on public.dividends_cache for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "dividends_cache_delete_own" on public.dividends_cache;
create policy "dividends_cache_delete_own"
  on public.dividends_cache for delete
  using (auth.uid() = user_id);

drop policy if exists "user_market_update_log_read_own" on public.user_market_update_log;
create policy "user_market_update_log_read_own"
  on public.user_market_update_log for select
  using (auth.uid() = user_id);

drop policy if exists "user_market_update_log_insert_own" on public.user_market_update_log;
create policy "user_market_update_log_insert_own"
  on public.user_market_update_log for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_market_update_log_update_own" on public.user_market_update_log;
create policy "user_market_update_log_update_own"
  on public.user_market_update_log for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_market_update_log_delete_own" on public.user_market_update_log;
create policy "user_market_update_log_delete_own"
  on public.user_market_update_log for delete
  using (auth.uid() = user_id);
