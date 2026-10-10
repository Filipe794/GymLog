import type { SessionExercise, SessionSet, Workout, WorkoutSession } from '../types'

const SESSIONS_STORAGE_KEY = 'myacademy:sessions'
const ACTIVE_SESSION_STORAGE_KEY = 'myacademy:active-session'

function isSessionSet(value: unknown): value is SessionSet {
  if (!value || typeof value !== 'object') return false
  const set = value as Partial<SessionSet>
  return typeof set.id === 'string' &&
    (typeof set.weightKg === 'number' || set.weightKg === null) &&
    (typeof set.reps === 'number' || set.reps === null)
}

function isSessionExercise(value: unknown): value is SessionExercise {
  if (!value || typeof value !== 'object') return false
  const exercise = value as Partial<SessionExercise>
  return typeof exercise.exerciseId === 'string' &&
    typeof exercise.name === 'string' &&
    typeof exercise.muscleGroup === 'string' &&
    typeof exercise.plannedSets === 'number' &&
    typeof exercise.plannedReps === 'string' &&
    Array.isArray(exercise.sets) &&
    exercise.sets.every(isSessionSet) &&
    typeof exercise.completed === 'boolean'
}

function isSession(value: unknown): value is WorkoutSession {
  if (!value || typeof value !== 'object') return false
  const session = value as Partial<WorkoutSession>
  return typeof session.id === 'string' &&
    (session.workoutId === 'A' || session.workoutId === 'B' || session.workoutId === 'C') &&
    typeof session.workoutName === 'string' &&
    typeof session.focus === 'string' &&
    typeof session.startedAt === 'string' &&
    (session.status === 'in-progress' || session.status === 'completed') &&
    Array.isArray(session.exercises) &&
    session.exercises.every(isSessionExercise)
}

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) as T : null
  } catch (error) {
    console.warn(`Não foi possível ler ${key} do armazenamento local.`, error)
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`Não foi possível salvar ${key} no armazenamento local.`, error)
  }
}

export function loadCompletedSessions(): WorkoutSession[] {
  const value: unknown = readJson<unknown>(SESSIONS_STORAGE_KEY)
  return Array.isArray(value) ? value.filter(isSession).filter((session) => session.status === 'completed') : []
}

export function saveCompletedSessions(sessions: WorkoutSession[]): void {
  writeJson(SESSIONS_STORAGE_KEY, sessions)
}

export function loadActiveSession(): WorkoutSession | null {
  const value: unknown = readJson<unknown>(ACTIVE_SESSION_STORAGE_KEY)
  return isSession(value) && value.status === 'in-progress' ? value : null
}

export function saveActiveSession(session: WorkoutSession): void {
  writeJson(ACTIVE_SESSION_STORAGE_KEY, session)
}

export function clearActiveSession(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
  } catch (error) {
    console.warn('Não foi possível limpar a sessão em andamento.', error)
  }
}

export function createSession(workout: Workout): WorkoutSession {
  const createId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  return {
    id: createId(),
    workoutId: workout.id,
    workoutName: workout.name,
    focus: workout.focus,
    startedAt: new Date().toISOString(),
    status: 'in-progress',
    exercises: workout.exercises.map((exercise) => ({
      exerciseId: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      plannedSets: exercise.sets,
      plannedReps: exercise.reps,
      completed: false,
      sets: Array.from({ length: exercise.sets }, (_, index) => ({
        id: createId(),
        weightKg: null,
        reps: null,
      })),
    })),
  }
}
