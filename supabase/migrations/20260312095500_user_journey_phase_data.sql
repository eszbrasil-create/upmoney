create table if not exists public.user_journey_phase_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phase_id int not null,
  reserve_value numeric(14,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, phase_id)
);

create index if not exists user_journey_phase_data_user_id_idx
  on public.user_journey_phase_data(user_id);

alter table public.user_journey_phase_data enable row level security;

drop policy if exists "user_journey_phase_data_read_own" on public.user_journey_phase_data;
create policy "user_journey_phase_data_read_own"
  on public.user_journey_phase_data for select
  using (auth.uid() = user_id);

drop policy if exists "user_journey_phase_data_insert_own" on public.user_journey_phase_data;
create policy "user_journey_phase_data_insert_own"
  on public.user_journey_phase_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_journey_phase_data_update_own" on public.user_journey_phase_data;
create policy "user_journey_phase_data_update_own"
  on public.user_journey_phase_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_journey_phase_data_delete_own" on public.user_journey_phase_data;
create policy "user_journey_phase_data_delete_own"
  on public.user_journey_phase_data for delete
  using (auth.uid() = user_id);

drop trigger if exists user_journey_phase_data_set_updated_at on public.user_journey_phase_data;
create trigger user_journey_phase_data_set_updated_at
before update on public.user_journey_phase_data
for each row
execute procedure public.set_updated_at();
