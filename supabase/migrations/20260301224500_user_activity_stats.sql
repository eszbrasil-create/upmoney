create table if not exists public.user_activity_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assets_added int not null default 0,
  courses_opened int not null default 0,
  expenses_opened int not null default 0,
  updated_at timestamptz not null default now(),
  constraint user_activity_stats_non_negative check (
    assets_added >= 0 and courses_opened >= 0 and expenses_opened >= 0
  )
);

create unique index if not exists user_activity_stats_user_unique
  on public.user_activity_stats(user_id);

alter table public.user_activity_stats enable row level security;

drop policy if exists "user_activity_stats_read_own" on public.user_activity_stats;
create policy "user_activity_stats_read_own"
  on public.user_activity_stats for select
  using (auth.uid() = user_id);

drop policy if exists "user_activity_stats_insert_own" on public.user_activity_stats;
create policy "user_activity_stats_insert_own"
  on public.user_activity_stats for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_activity_stats_update_own" on public.user_activity_stats;
create policy "user_activity_stats_update_own"
  on public.user_activity_stats for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_activity_stats_delete_own" on public.user_activity_stats;
create policy "user_activity_stats_delete_own"
  on public.user_activity_stats for delete
  using (auth.uid() = user_id);

drop trigger if exists user_activity_stats_set_updated_at on public.user_activity_stats;
create trigger user_activity_stats_set_updated_at
before update on public.user_activity_stats
for each row
execute procedure public.set_updated_at();
