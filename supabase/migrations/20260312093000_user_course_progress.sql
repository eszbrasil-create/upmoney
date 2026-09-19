create table if not exists public.user_course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  completed_modules int[] not null default '{}'::int[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists user_course_progress_user_id_idx
  on public.user_course_progress(user_id);

alter table public.user_course_progress enable row level security;

drop policy if exists "user_course_progress_read_own" on public.user_course_progress;
create policy "user_course_progress_read_own"
  on public.user_course_progress for select
  using (auth.uid() = user_id);

drop policy if exists "user_course_progress_insert_own" on public.user_course_progress;
create policy "user_course_progress_insert_own"
  on public.user_course_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_course_progress_update_own" on public.user_course_progress;
create policy "user_course_progress_update_own"
  on public.user_course_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_course_progress_delete_own" on public.user_course_progress;
create policy "user_course_progress_delete_own"
  on public.user_course_progress for delete
  using (auth.uid() = user_id);

drop trigger if exists user_course_progress_set_updated_at on public.user_course_progress;
create trigger user_course_progress_set_updated_at
before update on public.user_course_progress
for each row
execute procedure public.set_updated_at();
