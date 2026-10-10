import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { BottomNavigation } from './components/BottomNavigation'
import { AuthPanel } from './components/AuthPanel'
import { EmptyState } from './components/EmptyState'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { Reports } from './pages/Reports'
import { Workouts } from './pages/Workouts'
import type { Section } from './types'
import { isSupabaseConfigured, supabase } from './lib/supabaseClient'

function App() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard')
  const [user, setUser] = useState<User | null>(null)
  const [signOutError, setSignOutError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    if (!isSupabaseConfigured) return
    setSignOutError('')
    setSigningOut(true)
    const { error } = await supabase.auth.signOut()
    if (error) setSignOutError(`Não foi possível sair: ${error.message}`)
    setSigningOut(false)
  }

  if (isSupabaseConfigured && !user) return <AuthPanel />

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveSection} userId={user?.id} />
      case 'workouts':
        return <Workouts userId={user?.id} />
      case 'history':
        return <History userId={user?.id} />
      case 'reports':
        return <Reports userId={user?.id} />
      default:
        return <EmptyState title="Página não encontrada" description="Selecione uma seção para continuar." />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />
      <main className="main-content">
        <TopBar activeSection={activeSection} onSignOut={handleSignOut} signingOut={signingOut} showSignOut={isSupabaseConfigured && Boolean(user)} />
        {signOutError && <p className="auth-message sign-out-error" role="alert">{signOutError}</p>}
        <div className="page-content">{renderContent()}</div>
      </main>
      <BottomNavigation activeSection={activeSection} onNavigate={setActiveSection} />
    </div>
  )
}

export default App
