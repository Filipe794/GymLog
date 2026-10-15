-- MyAcademy Phase 1: custom workouts and reusable exercises.
-- Run after schema.sql. This migration is additive and idempotent.

alter table public.workouts
  drop constraint if exists workouts_code_check;
alter table public.workouts
  alter column code drop not null;
alter table public.workouts
  add column if not exists archived_at timestamptz;

alter table public.workout_sessions
  drop constraint if exists workout_sessions_workout_code_check;
alter table public.workout_sessions
  alter column workout_code drop not null;

alter table public.exercises
  add column if not exists archived_at timestamptz;

create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  planned_sets integer not null check (planned_sets > 0),
  reps_range text not null,
  muscle_group text not null,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_exercises (
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercise_library(id) on delete restrict,
  position integer not null check (position > 0),
  primary key (workout_id, exercise_id),
  unique (workout_id, position)
);

create index if not exists exercise_library_user_id_idx on public.exercise_library(user_id);
create index if not exists workout_exercises_exercise_id_idx on public.workout_exercises(exercise_id);

-- Preserve the current per-workout rows as the initial personal library.
insert into public.exercise_library (id, user_id, name, planned_sets, reps_range, muscle_group, notes, created_at, updated_at)
select e.id, w.user_id, e.name, e.planned_sets, e.reps_range, e.muscle_group, e.notes, e.created_at, e.updated_at
from public.exercises e
join public.workouts w on w.id = e.workout_id
on conflict (id) do nothing;

insert into public.workout_exercises (workout_id, exercise_id, position)
select workout_id, id, position
from public.exercises
on conflict (workout_id, exercise_id) do nothing;

alter table public.exercise_library enable row level security;
alter table public.workout_exercises enable row level security;

drop policy if exists "Users manage their exercise library" on public.exercise_library;
create policy "Users manage their exercise library"
  on public.exercise_library for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users manage their workout exercise assignments" on public.workout_exercises;
create policy "Users manage their workout exercise assignments"
  on public.workout_exercises for all to authenticated
  using (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
    and exists (select 1 from public.exercise_library e where e.id = exercise_id and e.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
    and exists (select 1 from public.exercise_library e where e.id = exercise_id and e.user_id = auth.uid())
  );

-- The session keeps its own name, muscle group, plan and sets, so changing
-- the library or a workout never changes historical records.
