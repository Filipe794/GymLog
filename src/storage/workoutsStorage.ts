import type { Exercise, Workout } from '../types'

export const WORKOUTS_STORAGE_KEY = 'myacademy:workouts'

function isExercise(value: unknown): value is Exercise {
  if (!value || typeof value !== 'object') return false

  const exercise = value as Partial<Exercise>
  return (
    typeof exercise.id === 'string' &&
    typeof exercise.name === 'string' &&
    typeof exercise.sets === 'number' &&
    Number.isInteger(exercise.sets) &&
    exercise.sets > 0 &&
    typeof exercise.reps === 'string' &&
    typeof exercise.muscleGroup === 'string' &&
    (typeof exercise.notes === 'string' || typeof exercise.notes === 'undefined') &&
    (typeof exercise.archivedAt === 'string' || exercise.archivedAt === null || typeof exercise.archivedAt === 'undefined')
  )
}

function isWorkout(value: unknown): value is Workout {
  if (!value || typeof value !== 'object') return false

  const workout = value as Partial<Workout>
  return (
    typeof workout.id === 'string' &&
    workout.id.length > 0 &&
    typeof workout.name === 'string' &&
    typeof workout.focus === 'string' &&
    Array.isArray(workout.exercises) &&
    workout.exercises.every(isExercise) &&
    (typeof workout.archivedAt === 'string' || workout.archivedAt === null || typeof workout.archivedAt === 'undefined')
  )
}

function isWorkoutList(value: unknown): value is Workout[] {
  return (
    Array.isArray(value) &&
    value.every(isWorkout) &&
    new Set(value.map((workout) => workout.id)).size === value.length
  )
}

export function loadWorkouts(): Workout[] {
  if (typeof window === 'undefined') return []

  try {
    const storedValue = window.localStorage.getItem(WORKOUTS_STORAGE_KEY)
    if (!storedValue) return []

    const parsedValue: unknown = JSON.parse(storedValue)
    if (isWorkoutList(parsedValue)) return parsedValue

    console.warn('Os dados salvos dos treinos estão em um formato inválido.')
  } catch (error) {
    console.warn('Não foi possível ler os treinos salvos.', error)
  }

  return []
}

export function saveWorkouts(workouts: Workout[]): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(workouts))
  } catch (error) {
    console.warn('Não foi possível salvar os treinos no armazenamento do navegador.', error)
  }
}
