-- Execute no SQL Editor do Supabase para confirmar a proteção das tabelas.
-- Este script apenas consulta metadados e não altera o esquema.

select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('workouts', 'exercises', 'workout_sessions', 'session_exercises', 'session_sets')
order by c.relname;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('workouts', 'exercises', 'workout_sessions', 'session_exercises', 'session_sets')
order by tablename, policyname;
