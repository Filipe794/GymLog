import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseProjectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : 'placeholder'
export const supabaseAuthStorageKey = `sb-${supabaseProjectRef}-auth-token`

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-public-key',
  { auth: { storageKey: supabaseAuthStorageKey } },
)

export function clearLocalAuthSession(): void {
  if (typeof window === 'undefined') return
  supabase.auth.stopAutoRefresh()
  window.localStorage.removeItem(supabaseAuthStorageKey)
}
