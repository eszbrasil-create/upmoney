create table if not exists public.expenses_sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  rows jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists expenses_sheets_user_year_unique
  on public.expenses_sheets(user_id, year);

alter table public.expenses_sheets enable row level security;

drop policy if exists "expenses_sheets_read_own" on public.expenses_sheets;
create policy "expenses_sheets_read_own"
  on public.expenses_sheets for select
  using (auth.uid() = user_id);

drop policy if exists "expenses_sheets_insert_own" on public.expenses_sheets;
create policy "expenses_sheets_insert_own"
  on public.expenses_sheets for insert
  with check (auth.uid() = user_id);

drop policy if exists "expenses_sheets_update_own" on public.expenses_sheets;
create policy "expenses_sheets_update_own"
  on public.expenses_sheets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "expenses_sheets_delete_own" on public.expenses_sheets;
create policy "expenses_sheets_delete_own"
  on public.expenses_sheets for delete
  using (auth.uid() = user_id);

drop trigger if exists expenses_sheets_set_updated_at on public.expenses_sheets;
create trigger expenses_sheets_set_updated_at
before update on public.expenses_sheets
for each row
execute procedure public.set_updated_at();
