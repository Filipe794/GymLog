import type { IconName } from './components/Icon'

export type Section = 'dashboard' | 'workouts' | 'history' | 'reports'

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
}

export type Workout = {
  id: 'A' | 'B' | 'C'
  name: string
  focus: string
  exercises: Exercise[]
}

export type SessionSet = {
  id: string
  weightKg: number | null
  reps: number | null
}

export type SessionExercise = {
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
  status: 'in-progress' | 'completed'
  exercises: SessionExercise[]
}
