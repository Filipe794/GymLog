import type { Exercise, Workout } from '../types'
import { supabase } from '../lib/supabaseClient'

type WorkoutRow = { id: string; name: string; focus: string; archived_at: string | null }
type ExerciseRow = {
  id: string
  name: string
  planned_sets: number
  reps_range: string
  muscle_group: string
  notes: string | null
  archived_at: string | null
}
type AssignmentRow = { workout_id: string; exercise_id: string; position: number }

function toExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    sets: row.planned_sets,
    reps: row.reps_range,
    muscleGroup: row.muscle_group,
    notes: row.notes ?? '',
    archivedAt: row.archived_at,
  }
}

export async function fetchRemoteWorkouts(): Promise<Workout[]> {
  const { data: workoutRows, error: workoutError } = await supabase
    .from('workouts')
    .select('id, name, focus, archived_at')
    .order('created_at')
  if (workoutError) throw new Error(`Falha ao ler treinos: ${workoutError.message}`)

  const rows = (workoutRows ?? []) as WorkoutRow[]
  if (!rows.length) return []
  const ids = rows.map((row) => row.id)
  const { data: assignments, error: assignmentError } = await supabase
    .from('workout_exercises')
    .select('workout_id, exercise_id, position')
    .in('workout_id', ids)
    .order('position')
  if (assignmentError) throw new Error(`Falha ao ler exercícios dos treinos: ${assignmentError.message}`)

  const exerciseIds = [...new Set(((assignments ?? []) as AssignmentRow[]).map((row) => row.exercise_id))]
  const { data: exerciseRows, error: exerciseError } = exerciseIds.length
    ? await supabase.from('exercise_library').select('id, name, planned_sets, reps_range, muscle_group, notes, archived_at').in('id', exerciseIds)
    : { data: [], error: null }
  if (exerciseError) throw new Error(`Falha ao ler a biblioteca de exercícios: ${exerciseError.message}`)

  const exercises = new Map((exerciseRows ?? []).map((row) => [row.id, toExercise(row as ExerciseRow)]))
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    focus: row.focus,
    archivedAt: row.archived_at,
    exercises: ((assignments ?? []) as AssignmentRow[])
      .filter((assignment) => assignment.workout_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map((assignment) => exercises.get(assignment.exercise_id))
      .filter((exercise): exercise is Exercise => Boolean(exercise)),
  }))
}

export async function createRemoteWorkout(userId: string, name: string, focus: string): Promise<Workout> {
  const { data, error } = await supabase.from('workouts').insert({ user_id: userId, name, focus }).select('id, name, focus, archived_at').single()
  if (error) throw new Error(`Falha ao criar o treino: ${error.message}`)
  return { ...(data as WorkoutRow), id: data.id, archivedAt: data.archived_at, exercises: [] }
}

export async function updateRemoteWorkout(workout: Workout): Promise<void> {
  const { error } = await supabase.from('workouts').update({
    name: workout.name,
    focus: workout.focus,
    archived_at: workout.archivedAt ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', workout.id)
  if (error) throw new Error(`Falha ao atualizar o treino: ${error.message}`)
}

export async function saveRemoteExercise(userId: string, exercise: Exercise): Promise<Exercise> {
  const { data, error } = await supabase.from('exercise_library').upsert({
    id: /^[0-9a-f-]{36}$/i.test(exercise.id) ? exercise.id : undefined,
    user_id: userId,
    name: exercise.name,
    planned_sets: exercise.sets,
    reps_range: exercise.reps,
    muscle_group: exercise.muscleGroup,
    notes: exercise.notes || null,
    archived_at: exercise.archivedAt ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' }).select('id, name, planned_sets, reps_range, muscle_group, notes, archived_at').single()
  if (error) throw new Error(`Falha ao salvar o exercício: ${error.message}`)
  return toExercise(data as ExerciseRow)
}

export async function fetchExerciseLibrary(): Promise<Exercise[]> {
  const { data, error } = await supabase.from('exercise_library')
    .select('id, name, planned_sets, reps_range, muscle_group, notes, archived_at')
    .order('name')
  if (error) throw new Error(`Falha ao ler a biblioteca de exercícios: ${error.message}`)
  return (data ?? []).map((row) => toExercise(row as ExerciseRow))
}

export async function replaceWorkoutExercises(workoutId: string, exercises: Exercise[]): Promise<void> {
  const { error: deleteError } = await supabase.from('workout_exercises').delete().eq('workout_id', workoutId)
  if (deleteError) throw new Error(`Falha ao atualizar exercícios do treino: ${deleteError.message}`)
  if (!exercises.length) return
  const { error } = await supabase.from('workout_exercises').insert(exercises.map((exercise, index) => ({
    workout_id: workoutId,
    exercise_id: exercise.id,
    position: index + 1,
  })))
  if (error) throw new Error(`Falha ao associar exercícios ao treino: ${error.message}`)
}

export async function initializeRemoteWorkouts(_userId: string): Promise<Workout[]> {
  return fetchRemoteWorkouts()
}

export async function replaceRemoteWorkouts(userId: string, workouts: Workout[]): Promise<Workout[]> {
  for (const workout of workouts) {
    let workoutId = workout.id
    if (/^[0-9a-f-]{36}$/i.test(workout.id)) {
      await updateRemoteWorkout(workout)
    } else {
      const created = await createRemoteWorkout(userId, workout.name, workout.focus)
      workoutId = created.id
    }
    const exercises = []
    for (const exercise of workout.exercises) exercises.push(await saveRemoteExercise(userId, exercise))
    await replaceWorkoutExercises(workoutId, exercises)
  }
  return fetchRemoteWorkouts()
}
