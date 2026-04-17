-- ============================================================
-- 1. Tables
-- ============================================================

create table public.routines (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercises (
  id              uuid primary key default gen_random_uuid(),
  routine_id      uuid not null references public.routines(id) on delete cascade,
  name            text not null,
  muscle_group    text not null check (
    muscle_group in (
      'chest', 'back', 'shoulders', 'biceps', 'triceps',
      'legs', 'glutes', 'abs', 'forearms', 'calves', 'full_body'
    )
  ),
  machine_info    text,
  target_sets_reps text,
  media_url       text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create table public.workout_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  weight_kg   numeric not null,
  reps        integer not null,
  comment     text,
  logged_at   timestamptz not null default now()
);

-- ============================================================
-- 2. Indexes
-- ============================================================

create index idx_routines_user_id on public.routines(user_id);
create index idx_exercises_routine_id on public.exercises(routine_id);
create index idx_exercises_sort_order on public.exercises(routine_id, sort_order);
create index idx_workout_logs_user_id on public.workout_logs(user_id);
create index idx_workout_logs_exercise_id on public.workout_logs(exercise_id);
create index idx_workout_logs_logged_at on public.workout_logs(exercise_id, logged_at desc);

-- ============================================================
-- 3. Auto-update updated_at trigger
-- ============================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger routines_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. Row Level Security
-- ============================================================

alter table public.routines enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_logs enable row level security;

-- Routines: users can only access their own
create policy "Users can view own routines"
  on public.routines for select
  using (auth.uid() = user_id);

create policy "Users can insert own routines"
  on public.routines for insert
  with check (auth.uid() = user_id);

create policy "Users can update own routines"
  on public.routines for update
  using (auth.uid() = user_id);

create policy "Users can delete own routines"
  on public.routines for delete
  using (auth.uid() = user_id);

-- Exercises: access via routine ownership
create policy "Users can view exercises in own routines"
  on public.exercises for select
  using (
    exists (
      select 1 from public.routines
      where routines.id = exercises.routine_id
        and routines.user_id = auth.uid()
    )
  );

create policy "Users can insert exercises in own routines"
  on public.exercises for insert
  with check (
    exists (
      select 1 from public.routines
      where routines.id = exercises.routine_id
        and routines.user_id = auth.uid()
    )
  );

create policy "Users can update exercises in own routines"
  on public.exercises for update
  using (
    exists (
      select 1 from public.routines
      where routines.id = exercises.routine_id
        and routines.user_id = auth.uid()
    )
  );

create policy "Users can delete exercises in own routines"
  on public.exercises for delete
  using (
    exists (
      select 1 from public.routines
      where routines.id = exercises.routine_id
        and routines.user_id = auth.uid()
    )
  );

-- Workout logs: users can only access their own
create policy "Users can view own workout logs"
  on public.workout_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout logs"
  on public.workout_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workout logs"
  on public.workout_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own workout logs"
  on public.workout_logs for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 5. Storage bucket for exercise media
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exercise-media',
  'exercise-media',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/gif']
);

-- Public read access
create policy "Public read access for exercise media"
  on storage.objects for select
  using (bucket_id = 'exercise-media');

-- Authenticated users can upload to their own folder
create policy "Auth users can upload exercise media"
  on storage.objects for insert
  with check (
    bucket_id = 'exercise-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own media
create policy "Users can update own exercise media"
  on storage.objects for update
  using (
    bucket_id = 'exercise-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own media
create policy "Users can delete own exercise media"
  on storage.objects for delete
  using (
    bucket_id = 'exercise-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
