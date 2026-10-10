import { initialWorkouts } from '../data/workouts'
import type { Exercise, Workout } from '../types'
import { supabase } from '../lib/supabaseClient'

type WorkoutRow = { id: string; code: Workout['id']; name: string; focus: string }
type ExerciseRow = { id: string; workout_id: string; position: number; name: string; planned_sets: number; reps_range: string; muscle_group: string; notes: string | null }

const workoutCodes: Workout['id'][] = ['A', 'B', 'C']
function toWorkout(row: WorkoutRow, exercises: ExerciseRow[]): Workout {
  return {
    id: row.code,
    name: row.name,
    focus: row.focus,
    exercises: exercises
      .filter((exercise) => exercise.workout_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.planned_sets,
        reps: exercise.reps_range,
        muscleGroup: exercise.muscle_group,
        notes: exercise.notes ?? '',
      })),
  }
}

export async function fetchRemoteWorkouts(): Promise<Workout[]> {
  const { data: workoutRows, error: workoutError } = await supabase
    .from('workouts')
    .select('id, code, name, focus')
    .in('code', workoutCodes)
    .order('code')
  if (workoutError) throw new Error(`Falha ao ler treinos: ${workoutError.message}`)

  const rows = (workoutRows ?? []) as WorkoutRow[]
  if (rows.length !== workoutCodes.length || new Set(rows.map((row) => row.code)).size !== workoutCodes.length) {
    throw new Error(`O Supabase retornou ${rows.length} de 3 treinos esperados (A, B e C).`)
  }

  const { data: exerciseRows, error: exerciseError } = await supabase
    .from('exercises')
    .select('id, workout_id, position, name, planned_sets, reps_range, muscle_group, notes')
    .in('workout_id', rows.map((row) => row.id))
    .order('position')
  if (exerciseError) throw new Error(`Falha ao ler exercícios planejados: ${exerciseError.message}`)

  return rows.map((row) => toWorkout(row, (exerciseRows ?? []) as ExerciseRow[]))
}

async function upsertWorkout(userId: string, workout: Workout): Promise<WorkoutRow> {
  const { data, error } = await supabase.from('workouts').upsert({
    user_id: userId,
    code: workout.id,
    name: workout.name,
    focus: workout.focus,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,code' }).select('id, code, name, focus').single()
  if (error) throw new Error(`Falha ao salvar o treino ${workout.id}: ${error.message}`)
  return data as WorkoutRow
}

async function syncExercises(workoutRow: WorkoutRow, exercises: Exercise[]): Promise<void> {
  const exerciseRows = exercises.map((exercise, index) => ({
      workout_id: workoutRow.id,
      position: index + 1,
      name: exercise.name,
      planned_sets: exercise.sets,
      reps_range: exercise.reps,
      muscle_group: exercise.muscleGroup,
      notes: exercise.notes || null,
      updated_at: new Date().toISOString(),
    }))
  if (exerciseRows.length) {
    const { error } = await supabase.from('exercises').upsert(exerciseRows, { onConflict: 'workout_id,position' })
    if (error) throw new Error(`Falha ao salvar exercícios do treino ${workoutRow.code}: ${error.message}`)
  }

  const { error: staleError } = await supabase
    .from('exercises')
    .delete()
    .eq('workout_id', workoutRow.id)
    .gt('position', exercises.length)
  if (staleError) {
    throw new Error(`Falha ao remover exercícios obsoletos do treino ${workoutRow.code}: ${staleError.message}`)
  }
}

export async function replaceRemoteWorkouts(userId: string, workouts: Workout[]): Promise<Workout[]> {
  for (const workout of workouts) {
    const row = await upsertWorkout(userId, workout)
    await syncExercises(row, workout.exercises)
  }
  return fetchRemoteWorkouts()
}

export async function initializeRemoteWorkouts(userId: string): Promise<Workout[]> {
  const { data: existingRows, error } = await supabase
    .from('workouts')
    .select('id, code, name, focus')
    .eq('user_id', userId)
    .in('code', workoutCodes)
  if (error) throw new Error(`Falha ao verificar treinos do usuário: ${error.message}`)

  const existingCodes = new Set((existingRows ?? []).map((row) => row.code as Workout['id']))
  const missingWorkouts = initialWorkouts.filter((workout) => !existingCodes.has(workout.id))
  if (missingWorkouts.length) await replaceRemoteWorkouts(userId, missingWorkouts)

  const workouts = await fetchRemoteWorkouts()
  if (!missingWorkouts.length) return workouts

  const emptyWorkoutCodes = new Set(workouts.filter((workout) => workout.exercises.length === 0).map((workout) => workout.id))
  if (emptyWorkoutCodes.size) {
    const emptyWorkouts = initialWorkouts.filter((workout) => emptyWorkoutCodes.has(workout.id))
    await replaceRemoteWorkouts(userId, emptyWorkouts)
    return fetchRemoteWorkouts()
  }
  return workouts
}
