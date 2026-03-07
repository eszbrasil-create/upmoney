create table if not exists public.market_sync_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  provider text not null default 'brapi',
  status text not null check (status in ('updated', 'provider_empty', 'provider_error', 'no_change')),
  message text,
  last_attempt_at timestamptz not null default now(),
  last_success_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists market_sync_status_user_ticker_unique
  on public.market_sync_status(user_id, ticker);

create index if not exists market_sync_status_user_idx
  on public.market_sync_status(user_id);

create index if not exists market_sync_status_status_idx
  on public.market_sync_status(status);

alter table public.market_sync_status enable row level security;

drop policy if exists "market_sync_status_read_own" on public.market_sync_status;
create policy "market_sync_status_read_own"
  on public.market_sync_status for select
  using (auth.uid() = user_id);

drop policy if exists "market_sync_status_insert_own" on public.market_sync_status;
create policy "market_sync_status_insert_own"
  on public.market_sync_status for insert
  with check (auth.uid() = user_id);

drop policy if exists "market_sync_status_update_own" on public.market_sync_status;
create policy "market_sync_status_update_own"
  on public.market_sync_status for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "market_sync_status_delete_own" on public.market_sync_status;
create policy "market_sync_status_delete_own"
  on public.market_sync_status for delete
  using (auth.uid() = user_id);

drop trigger if exists market_sync_status_set_updated_at on public.market_sync_status;
create trigger market_sync_status_set_updated_at
before update on public.market_sync_status
for each row
execute procedure public.set_updated_at();
