import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { BottomNavigation } from './components/BottomNavigation'
import { AuthPanel } from './components/AuthPanel'
import { EmptyState } from './components/EmptyState'
import { LandingPage } from './components/LandingPage'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { Reports } from './pages/Reports'
import { Workouts } from './pages/Workouts'
import { Profile } from './pages/Profile'
import type { Section } from './types'
import { clearLocalAuthSession, isSupabaseConfigured, supabase } from './lib/supabaseClient'
import { useUserProfile } from './hooks/useUserProfile'
import { deleteAuthenticatedAccount } from './services/accountService'

function App() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard')
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [signOutError, setSignOutError] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const [accountDeletedMessage, setAccountDeletedMessage] = useState('')
  const { username, loading: profileLoading, error: profileError, saveUsername } = useUserProfile(user?.id)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Não foi possível restaurar a sessão.', error)
      }
      if (active) {
        setUser(data.session?.user ?? null)
        setAuthLoading(false)
      }
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    if (!isSupabaseConfigured) return
    setSignOutError('')
    setSigningOut(true)
    const { error } = await supabase.auth.signOut()
    if (error) setSignOutError(`Não foi possível sair: ${error.message}`)
    setSigningOut(false)
  }

  const handleDeleteAccount = async (confirmation: string) => {
    await deleteAuthenticatedAccount(confirmation)
    clearLocalAuthSession()
    setUser(null)
    setAuthMode(null)
    setActiveSection('dashboard')
    setMobileMenuOpen(false)
    setSignOutError('')
    setAccountDeletedMessage('Sua conta foi excluída permanentemente.')
  }

  const handleNavigate = (section: Section) => {
    setActiveSection(section)
    setMobileMenuOpen(false)
  }

  useEffect(() => {
    if (!mobileMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  if (authLoading) return <div className="auth-page"><p>Carregando...</p></div>
  if (!user && authMode) return <AuthPanel initialMode={authMode} onBack={() => setAuthMode(null)} />
  if (!user) return <LandingPage onAuth={setAuthMode} message={accountDeletedMessage} />

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} userId={user?.id} username={username} />
      case 'workouts':
        return <Workouts userId={user?.id} />
      case 'history':
        return <History userId={user?.id} />
      case 'reports':
        return <Reports userId={user?.id} />
      case 'profile':
        return <Profile user={user} username={username} loading={profileLoading} onSaveUsername={async (nextUsername) => { await saveUsername(nextUsername) }} onDeleteAccount={handleDeleteAccount} />
      default:
        return <EmptyState title="Página não encontrada" description="Selecione uma seção para continuar." />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar activeSection={activeSection} onNavigate={handleNavigate} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      {mobileMenuOpen && <button className="mobile-menu-backdrop" type="button" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} />}
      <main className="main-content">
        <TopBar activeSection={activeSection} onMenuToggle={() => setMobileMenuOpen((open) => !open)} mobileMenuOpen={mobileMenuOpen} onSignOut={handleSignOut} signingOut={signingOut} showSignOut={isSupabaseConfigured && Boolean(user)} username={profileLoading ? null : username} onProfile={() => handleNavigate('profile')} />
        {signOutError && <p className="auth-message sign-out-error" role="alert">{signOutError}</p>}
        {profileError && <p className="auth-message sign-out-error" role="alert">Não foi possível carregar seu perfil: {profileError}</p>}
        <div className="page-content">{renderContent()}</div>
      </main>
      <BottomNavigation activeSection={activeSection} onNavigate={handleNavigate} />
    </div>
  )
}

export default App
