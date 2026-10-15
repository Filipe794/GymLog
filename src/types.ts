import type { IconName } from './components/Icon'

export type Section = 'dashboard' | 'workouts' | 'history' | 'reports' | 'profile'

export type NavigationItem = {
  id: Section
  label: string
  icon: IconName
}

export type Exercise = {
  id: string
  name: string
  sets: number
  reps: string
  muscleGroup: string
  notes?: string
  archivedAt?: string | null
}

export type Workout = {
  id: string
  name: string
  focus: string
  exercises: Exercise[]
  archivedAt?: string | null
}

export type SessionSet = {
  id: string
  weightKg: number | null
  reps: number | null
}

export type SessionExercise = {
  id?: string
  exerciseId: string
  name: string
  muscleGroup: string
  plannedSets: number
  plannedReps: string
  sets: SessionSet[]
  completed: boolean
}

export type WorkoutSession = {
  id: string
  workoutId: Workout['id']
  workoutName: string
  focus: string
  startedAt: string
  finishedAt?: string
  status: 'in-progress' | 'completed' | 'abandoned'
  exercises: SessionExercise[]
}
