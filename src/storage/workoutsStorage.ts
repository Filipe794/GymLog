import { initialWorkouts } from '../data/workouts'
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
    (typeof exercise.notes === 'string' || typeof exercise.notes === 'undefined')
  )
}

function isWorkout(value: unknown): value is Workout {
  if (!value || typeof value !== 'object') return false

  const workout = value as Partial<Workout>
  return (
    (workout.id === 'A' || workout.id === 'B' || workout.id === 'C') &&
    typeof workout.name === 'string' &&
    typeof workout.focus === 'string' &&
    Array.isArray(workout.exercises) &&
    workout.exercises.every(isExercise)
  )
}

function isWorkoutList(value: unknown): value is Workout[] {
  return (
    Array.isArray(value) &&
    value.length === initialWorkouts.length &&
    value.every(isWorkout) &&
    new Set(value.map((workout) => workout.id)).size === initialWorkouts.length
  )
}

export function loadWorkouts(): Workout[] {
  if (typeof window === 'undefined') return initialWorkouts

  try {
    const storedValue = window.localStorage.getItem(WORKOUTS_STORAGE_KEY)
    if (!storedValue) return initialWorkouts

    const parsedValue: unknown = JSON.parse(storedValue)
    if (isWorkoutList(parsedValue)) return parsedValue

    console.warn('Os dados salvos dos treinos estão em um formato inválido. Os treinos iniciais serão usados.')
  } catch (error) {
    console.warn('Não foi possível ler os treinos salvos. Os treinos iniciais serão usados.', error)
  }

  return initialWorkouts
}

export function saveWorkouts(workouts: Workout[]): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(workouts))
  } catch (error) {
    console.warn('Não foi possível salvar os treinos no armazenamento do navegador.', error)
  }
}
