import type { WorkoutSession } from '../types'
import { supabase } from '../lib/supabaseClient'

export async function fetchRemoteSessions(userId: string): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*, session_exercises(*, session_sets(*))')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('finished_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id, workoutId: row.workout_code, workoutName: row.workout_name, focus: row.focus,
    startedAt: row.started_at, finishedAt: row.finished_at, status: 'completed' as const,
    exercises: [...(row.session_exercises ?? [])].sort((a, b) => a.position - b.position).map((exercise) => ({
      exerciseId: exercise.exercise_id ?? exercise.id, name: exercise.name, muscleGroup: exercise.muscle_group,
      plannedSets: exercise.planned_sets, plannedReps: exercise.planned_reps, completed: exercise.completed,
      sets: [...(exercise.session_sets ?? [])].sort((a, b) => a.set_number - b.set_number).map((set) => ({ id: set.id, weightKg: set.weight_kg, reps: set.reps })),
    })),
  }))
}

export async function saveRemoteSession(userId: string, session: WorkoutSession): Promise<void> {
  const { data: sessionRow, error } = await supabase.from('workout_sessions').upsert({
    id: session.id.match(/^[0-9a-f-]{36}$/i) ? session.id : undefined, user_id: userId, workout_code: session.workoutId,
    workout_name: session.workoutName, focus: session.focus, started_at: session.startedAt,
    finished_at: session.finishedAt ?? null, status: session.status, updated_at: new Date().toISOString(),
  }, { onConflict: 'id' }).select('id').single()
  if (error) throw error
  const { error: deleteError } = await supabase.from('session_exercises').delete().eq('session_id', sessionRow.id)
  if (deleteError) throw new Error(`Falha ao atualizar exercícios da sessão: ${deleteError.message}`)
  const exerciseRows = session.exercises.map((exercise, index) => ({
    session_id: sessionRow.id, exercise_id: exercise.exerciseId.match(/^[0-9a-f-]{36}$/i) ? exercise.exerciseId : null,
    position: index + 1, name: exercise.name, muscle_group: exercise.muscleGroup,
    planned_sets: exercise.plannedSets, planned_reps: exercise.plannedReps, completed: exercise.completed,
  }))
  const { data: insertedExercises, error: exerciseError } = await supabase.from('session_exercises').insert(exerciseRows).select('id, position')
  if (exerciseError) throw exerciseError
  const sets = session.exercises.flatMap((exercise, index) => exercise.sets.map((set, setIndex) => ({
    session_exercise_id: insertedExercises.find((row) => row.position === index + 1)?.id,
    set_number: setIndex + 1, weight_kg: set.weightKg, reps: set.reps,
  })))
  if (sets.length) {
    const { error: setError } = await supabase.from('session_sets').insert(sets)
    if (setError) throw setError
  }
}
