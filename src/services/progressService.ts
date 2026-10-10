import type { WorkoutSession } from '../types'

export type ExerciseHistoryRow = {
  session: WorkoutSession
  exercise: WorkoutSession['exercises'][number]
  sessionMaxLoad: number | null
  validSets: number
  totalVolume: number
}

export function getExerciseRows(sessions: WorkoutSession[]): ExerciseHistoryRow[] {
  return sessions.flatMap((session) => session.exercises.map((exercise) => {
    const validSets = exercise.sets.filter((set) => typeof set.weightKg === 'number' && typeof set.reps === 'number' && set.weightKg >= 0 && set.reps >= 0)
    const loads = validSets.map((set) => set.weightKg as number)
    return {
      session,
      exercise,
      sessionMaxLoad: loads.length ? Math.max(...loads) : null,
      validSets: validSets.length,
      totalVolume: validSets.reduce((total, set) => total + (set.weightKg as number) * (set.reps as number), 0),
    }
  }))
}

export function filterSessions(sessions: WorkoutSession[], period: string, exerciseId = 'all'): WorkoutSession[] {
  return sessions.filter((session) => {
    const date = new Date(session.finishedAt ?? session.startedAt)
    const cutoff = period === 'all' ? null : new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000)
    return (!cutoff || date >= cutoff) && (exerciseId === 'all' || session.exercises.some((exercise) => exercise.exerciseId === exerciseId))
  })
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR')
}
