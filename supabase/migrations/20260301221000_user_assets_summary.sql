create table if not exists public.user_assets_summary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  summary jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists user_assets_summary_user_unique
  on public.user_assets_summary(user_id);

alter table public.user_assets_summary enable row level security;

drop policy if exists "user_assets_summary_read_own" on public.user_assets_summary;
create policy "user_assets_summary_read_own"
  on public.user_assets_summary for select
  using (auth.uid() = user_id);

drop policy if exists "user_assets_summary_insert_own" on public.user_assets_summary;
create policy "user_assets_summary_insert_own"
  on public.user_assets_summary for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_assets_summary_update_own" on public.user_assets_summary;
create policy "user_assets_summary_update_own"
  on public.user_assets_summary for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_assets_summary_delete_own" on public.user_assets_summary;
create policy "user_assets_summary_delete_own"
  on public.user_assets_summary for delete
  using (auth.uid() = user_id);

drop trigger if exists user_assets_summary_set_updated_at on public.user_assets_summary;
create trigger user_assets_summary_set_updated_at
before update on public.user_assets_summary
for each row
execute procedure public.set_updated_at();
