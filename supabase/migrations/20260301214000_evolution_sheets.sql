create table if not exists public.evolution_sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  rows jsonb not null default '[]'::jsonb,
  visible_months text[] not null default array[
    'jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'
  ]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evolution_sheets_year_range check (year between 2000 and 2100),
  constraint evolution_sheets_visible_months_valid check (
    visible_months <@ array[
      'jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'
    ]::text[]
  )
);

create unique index if not exists evolution_sheets_user_year_unique
  on public.evolution_sheets(user_id, year);

create index if not exists evolution_sheets_user_idx
  on public.evolution_sheets(user_id);

alter table public.evolution_sheets enable row level security;

drop policy if exists "evolution_sheets_read_own" on public.evolution_sheets;
create policy "evolution_sheets_read_own"
  on public.evolution_sheets for select
  using (auth.uid() = user_id);

drop policy if exists "evolution_sheets_insert_own" on public.evolution_sheets;
create policy "evolution_sheets_insert_own"
  on public.evolution_sheets for insert
  with check (auth.uid() = user_id);

drop policy if exists "evolution_sheets_update_own" on public.evolution_sheets;
create policy "evolution_sheets_update_own"
  on public.evolution_sheets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "evolution_sheets_delete_own" on public.evolution_sheets;
create policy "evolution_sheets_delete_own"
  on public.evolution_sheets for delete
  using (auth.uid() = user_id);

drop trigger if exists evolution_sheets_set_updated_at on public.evolution_sheets;
create trigger evolution_sheets_set_updated_at
before update on public.evolution_sheets
for each row
execute procedure public.set_updated_at();
