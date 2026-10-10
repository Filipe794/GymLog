import { supabase } from '../lib/supabaseClient'

export type UserProfile = {
  userId: string
  username: string
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data ? { userId: data.user_id, username: data.username } : null
}

export async function updateUserProfile(userId: string, username: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ username, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('user_id, username')
    .single()

  if (error) throw error
  return { userId: data.user_id, username: data.username }
}
