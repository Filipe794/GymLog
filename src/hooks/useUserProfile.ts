import { useEffect, useState } from 'react'
import { fetchUserProfile, updateUserProfile } from '../services/profileService'

export function useUserProfile(userId?: string) {
  const [username, setUsername] = useState<string | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    if (!userId) {
      setUsername(null)
      setProfileUserId(null)
      setLoading(false)
      setError(null)
      return () => {
        active = false
      }
    }

    setUsername(null)
    setProfileUserId(null)
    setLoading(true)
    setError(null)

    fetchUserProfile(userId)
      .then((profile) => {
        if (active) {
          setUsername(profile?.username ?? null)
          setProfileUserId(userId)
        }
      })
      .catch((profileError: Error) => {
        if (active) {
          setUsername(null)
          setProfileUserId(userId)
          setError(profileError.message)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId])

  const profileIsCurrent = Boolean(userId) && profileUserId === userId
  const saveUsername = async (nextUsername: string) => {
    if (!userId) throw new Error('Não há usuário autenticado.')
    const profile = await updateUserProfile(userId, nextUsername)
    setUsername(profile.username)
    setProfileUserId(userId)
    setError(null)
    return profile
  }

  return {
    username: profileIsCurrent ? username : null,
    loading: Boolean(userId) && (!profileIsCurrent || loading),
    error: profileIsCurrent ? error : null,
    saveUsername,
  }
}
