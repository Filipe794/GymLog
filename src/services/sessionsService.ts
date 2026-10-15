import type { WorkoutSession } from '../types'
import { supabase } from '../lib/supabaseClient'

const sessionSaveQueues = new Map<string, Promise<void>>()

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
      id: exercise.id, exerciseId: exercise.exercise_id ?? exercise.id, name: exercise.name, muscleGroup: exercise.muscle_group,
      plannedSets: exercise.planned_sets, plannedReps: exercise.planned_reps, completed: exercise.completed,
      sets: [...(exercise.session_sets ?? [])].sort((a, b) => a.set_number - b.set_number).map((set) => ({ id: set.id, weightKg: set.weight_kg, reps: set.reps })),
    })),
  }))
}

export async function saveRemoteSession(userId: string, session: WorkoutSession): Promise<void> {
  const previousSave = sessionSaveQueues.get(session.id) ?? Promise.resolve()
  const currentSave = previousSave.catch(() => undefined).then(() => persistRemoteSession(userId, session))
  sessionSaveQueues.set(session.id, currentSave)
  try {
    await currentSave
  } finally {
    if (sessionSaveQueues.get(session.id) === currentSave) sessionSaveQueues.delete(session.id)
  }
}

async function persistRemoteSession(userId: string, session: WorkoutSession): Promise<void> {
  const { data: sessionRow, error } = await supabase.from('workout_sessions').upsert({
    id: session.id.match(/^[0-9a-f-]{36}$/i) ? session.id : undefined, user_id: userId,
    workout_id: session.workoutId.match(/^[0-9a-f-]{36}$/i) ? session.workoutId : null,
    workout_code: session.workoutId,
    workout_name: session.workoutName, focus: session.focus, started_at: session.startedAt,
    finished_at: session.finishedAt ?? null,
    status: session.status === 'in-progress' ? 'in_progress' : session.status === 'abandoned' ? 'cancelled' : 'completed',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' }).select('id').single()
  if (error) throw error
  const exerciseRows = session.exercises.map((exercise, index) => ({
    ...(exercise.id && /^[0-9a-f-]{36}$/i.test(exercise.id) ? { id: exercise.id } : {}),
    session_id: sessionRow.id, exercise_id: exercise.exerciseId.match(/^[0-9a-f-]{36}$/i) ? exercise.exerciseId : null,
    position: index + 1, name: exercise.name, muscle_group: exercise.muscleGroup,
    planned_sets: exercise.plannedSets, planned_reps: exercise.plannedReps, completed: exercise.completed,
  }))
  const { data: savedExercises, error: exerciseError } = await supabase.from('session_exercises')
    .upsert(exerciseRows, { onConflict: 'session_id,position' })
    .select('id, position')
  if (exerciseError) throw exerciseError
  const savedExerciseIds = new Map((savedExercises ?? []).map((row) => [row.position, row.id]))
  const { error: staleExerciseError } = await supabase.from('session_exercises')
    .delete().eq('session_id', sessionRow.id).gt('position', session.exercises.length)
  if (staleExerciseError) throw new Error(`Falha ao remover exercícios retirados da sessão: ${staleExerciseError.message}`)
  const sets = session.exercises.flatMap((exercise, index) => exercise.sets.map((set, setIndex) => ({
    session_exercise_id: savedExerciseIds.get(index + 1),
    set_number: setIndex + 1, weight_kg: set.weightKg, reps: set.reps,
  })))
  if (sets.length) {
    const { error: setError } = await supabase.from('session_sets').upsert(sets, { onConflict: 'session_exercise_id,set_number' })
    if (setError) throw setError
  }
  for (const [position, exerciseId] of savedExerciseIds) {
    const setCount = session.exercises[position - 1]?.sets.length ?? 0
    const { error: staleSetError } = await supabase.from('session_sets')
      .delete().eq('session_exercise_id', exerciseId).gt('set_number', setCount)
    if (staleSetError) throw new Error(`Falha ao remover séries retiradas da sessão: ${staleSetError.message}`)
  }
}
