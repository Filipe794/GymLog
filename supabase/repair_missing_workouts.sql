-- Reparação não destrutiva para um único usuário.
-- Substitua o UUID abaixo pelo id em Authentication > Users.
do $$
declare
  target_user uuid := '00000000-0000-0000-0000-000000000000';
  workout_a uuid;
  workout_b uuid;
  workout_c uuid;
begin
  insert into public.workouts (user_id, code, name, focus)
  values
    (target_user, 'A', 'Treino A', 'Costas, bíceps e antebraço'),
    (target_user, 'B', 'Treino B', 'Peito, ombros e tríceps'),
    (target_user, 'C', 'Treino C', 'Pernas')
  on conflict (user_id, code) do nothing;

  select id into workout_a from public.workouts where user_id = target_user and code = 'A';
  select id into workout_b from public.workouts where user_id = target_user and code = 'B';
  select id into workout_c from public.workouts where user_id = target_user and code = 'C';

  insert into public.exercises (workout_id, position, name, planned_sets, reps_range, muscle_group, notes)
  values
    (workout_a, 1, 'Puxada frontal', 4, '8–12', 'Costas', 'Controlar a volta do movimento.'),
    (workout_a, 2, 'Remada baixa', 4, '8–12', 'Costas', null),
    (workout_a, 3, 'Remada unilateral', 3, '10–12', 'Costas', null),
    (workout_a, 4, 'Rosca direta', 3, '8–12', 'Bíceps', null),
    (workout_a, 5, 'Rosca martelo', 3, '10–12', 'Bíceps e antebraço', null),
    (workout_a, 6, 'Rosca inversa', 3, '12–15', 'Antebraço', null),
    (workout_b, 1, 'Supino reto', 4, '8–12', 'Peito', null),
    (workout_b, 2, 'Supino inclinado', 3, '8–12', 'Peito', null),
    (workout_b, 3, 'Crucifixo', 3, '10–12', 'Peito', null),
    (workout_b, 4, 'Desenvolvimento de ombros', 3, '8–12', 'Ombros', null),
    (workout_b, 5, 'Elevação lateral', 3, '12–15', 'Ombros', null),
    (workout_b, 6, 'Tríceps na polia', 3, '10–12', 'Tríceps', null),
    (workout_c, 1, 'Agachamento livre', 4, '8–12', 'Quadríceps e glúteos', null),
    (workout_c, 2, 'Leg press', 4, '10–12', 'Quadríceps', null),
    (workout_c, 3, 'Cadeira extensora', 3, '12–15', 'Quadríceps', null),
    (workout_c, 4, 'Mesa flexora', 3, '10–12', 'Posterior de coxa', null),
    (workout_c, 5, 'Elevação pélvica', 3, '10–12', 'Glúteos', null),
    (workout_c, 6, 'Panturrilha em pé', 4, '12–15', 'Panturrilhas', null)
  on conflict (workout_id, position) do nothing;
end $$;

-- Diagnóstico pós-reparo: deve retornar 3 linhas e a contagem esperada de exercícios.
select w.code, w.id, count(e.id) as exercise_count
from public.workouts w
left join public.exercises e on e.workout_id = w.id
where w.user_id = '00000000-0000-0000-0000-000000000000'
group by w.code, w.id
order by w.code;
