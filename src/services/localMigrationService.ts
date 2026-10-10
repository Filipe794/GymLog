import type { Workout, WorkoutSession } from '../types'
import { replaceRemoteWorkouts } from './workoutsService'
import { saveRemoteSession } from './sessionsService'

export async function migrateLocalDataOnce(userId: string, workouts: Workout[], sessions: WorkoutSession[]): Promise<{ migrated: number; skipped: number }> {
  const key = `myacademy:migration:${userId}`
  if (localStorage.getItem(key)) return { migrated: 0, skipped: workouts.length + sessions.length }
  await replaceRemoteWorkouts(userId, workouts)
  for (const session of sessions) await saveRemoteSession(userId, session)
  localStorage.setItem(key, new Date().toISOString())
  return { migrated: workouts.length + sessions.length, skipped: 0 }
}
