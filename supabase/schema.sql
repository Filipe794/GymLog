create extension if not exists pgcrypto;

create type public.session_status as enum ('in_progress', 'completed', 'cancelled');

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null check (code in ('A', 'B', 'C')),
  name text not null,
  focus text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, code)
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  position integer not null check (position > 0),
  name text not null,
  planned_sets integer not null check (planned_sets > 0),
  reps_range text not null,
  muscle_group text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_id, position)
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  workout_code text not null check (workout_code in ('A', 'B', 'C')),
  workout_name text not null,
  focus text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status public.session_status not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (finished_at is null or finished_at >= started_at)
);

create table public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  position integer not null check (position > 0),
  name text not null,
  muscle_group text not null,
  planned_sets integer not null check (planned_sets > 0),
  planned_reps text not null,
  completed boolean not null default false,
  unique (session_id, position)
);

create table public.session_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.session_exercises(id) on delete cascade,
  set_number integer not null check (set_number > 0),
  weight_kg numeric(8, 2) check (weight_kg is null or weight_kg >= 0),
  reps integer check (reps is null or reps >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_exercise_id, set_number)
);

create index workouts_user_id_idx on public.workouts(user_id);
create index sessions_user_id_started_at_idx on public.workout_sessions(user_id, started_at desc);
create index exercises_workout_id_position_idx on public.exercises(workout_id, position);
create index session_exercises_session_id_position_idx on public.session_exercises(session_id, position);

alter table public.workouts enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_exercises enable row level security;
alter table public.session_sets enable row level security;

create policy "Users manage their workouts"
  on public.workouts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users manage exercises in their workouts"
  on public.exercises for all to authenticated
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

create policy "Users manage their sessions"
  on public.workout_sessions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users manage exercises in their sessions"
  on public.session_exercises for all to authenticated
  using (exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid()));

create policy "Users manage sets in their sessions"
  on public.session_sets for all to authenticated
  using (exists (
    select 1 from public.session_exercises se
    join public.workout_sessions s on s.id = se.session_id
    where se.id = session_exercise_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.session_exercises se
    join public.workout_sessions s on s.id = se.session_id
    where se.id = session_exercise_id and s.user_id = auth.uid()
  ));
